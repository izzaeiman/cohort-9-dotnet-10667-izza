using System;
using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using Backend.Middleware;

namespace Backend.Tests.Middleware
{
    public class GlobalExceptionMiddlewareTests
    {
        private readonly Mock<ILogger<GlobalExceptionMiddleware>> _loggerMock;

        public GlobalExceptionMiddlewareTests()
        {
            _loggerMock = new Mock<ILogger<GlobalExceptionMiddleware>>();
        }

        [Fact]
        public async Task InvokeAsync_NoException_ProceedsToNextMiddleware()
        {
            // Arrange
            var context = new DefaultHttpContext();
            var nextCalled = false;
            RequestDelegate next = (ctx) =>
            {
                nextCalled = true;
                return Task.CompletedTask;
            };

            var middleware = new GlobalExceptionMiddleware(next, _loggerMock.Object);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.True(nextCalled);
        }

        [Fact]
        public async Task InvokeAsync_ExceptionThrown_CatchesExceptionAndReturnsProblemDetails()
        {
            // Arrange
            var context = new DefaultHttpContext();
            context.TraceIdentifier = "test-trace-id";
            context.Request.Path = "/api/test";
            
            // Setup a memory stream to read the response body
            context.Response.Body = new MemoryStream();

            RequestDelegate next = (ctx) => throw new InvalidOperationException("Test exception");

            var middleware = new GlobalExceptionMiddleware(next, _loggerMock.Object);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.Equal((int)HttpStatusCode.InternalServerError, context.Response.StatusCode);
            Assert.Equal("application/problem+json", context.Response.ContentType);

            context.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(context.Response.Body);
            var responseBody = await reader.ReadToEndAsync();

            var problemDetails = JsonSerializer.Deserialize<ProblemDetails>(responseBody);

            Assert.NotNull(problemDetails);
            Assert.Equal("An unexpected server error occurred.", problemDetails.Title);
            Assert.Equal(500, problemDetails.Status);
            Assert.Equal("Please contact administrator.", problemDetails.Detail);
            Assert.Equal("/api/test", problemDetails.Instance);
            Assert.True(problemDetails.Extensions.ContainsKey("traceId"));
            
            var traceIdElement = (JsonElement)problemDetails.Extensions["traceId"];
            Assert.Equal("test-trace-id", traceIdElement.GetString());
        }

        [Fact]
        public async Task InvokeAsync_ExceptionThrownAndResponseStarted_RethrowsException()
        {
            // Arrange
            var context = new DefaultHttpContext();
            // DefaultHttpContext.Response.HasStarted is false by default. We cannot easily mock it on DefaultHttpContext,
            // so we mock the entire HttpContext and HttpResponse.
            var contextMock = new Mock<HttpContext>();
            var responseMock = new Mock<HttpResponse>();
            
            contextMock.Setup(c => c.Response).Returns(responseMock.Object);
            responseMock.Setup(r => r.HasStarted).Returns(true);
            contextMock.Setup(c => c.TraceIdentifier).Returns("test-trace-id");

            RequestDelegate next = (ctx) => throw new InvalidOperationException("Test exception");

            var middleware = new GlobalExceptionMiddleware(next, _loggerMock.Object);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => middleware.InvokeAsync(contextMock.Object));
        }
    }
}
