using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Backend.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Microsoft.AspNetCore.Antiforgery.AntiforgeryValidationException ex)
            {
                var traceId = context.TraceIdentifier;
                _logger.LogWarning(ex, "CSRF Validation Failed for TraceId: {TraceId}", traceId);
                if (!context.Response.HasStarted)
                {
                    context.Response.ContentType = "application/problem+json";
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    var problemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails
                    {
                        Title = "CSRF Token Validation Failed.",
                        Status = (int)HttpStatusCode.Forbidden,
                        Detail = ex.Message,
                        Instance = context.Request.Path
                    };
                    await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails));
                }
            }
            catch (Exception ex)
            {
                var traceId = context.TraceIdentifier;
                _logger.LogError(ex, "An unhandled exception occurred during request processing. TraceId: {TraceId}", traceId);

                // Finding #11: if the response has already started (e.g. streaming began),
                // we cannot change headers or status — re-throw so the server handles it properly.
                if (context.Response.HasStarted)
                {
                    _logger.LogWarning(
                        "Response already started for TraceId: {TraceId}. Cannot write error response; re-throwing.",
                        traceId);
                    throw;
                }

                await HandleExceptionAsync(context, traceId);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, string traceId)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var problemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                Title = "An unexpected server error occurred.",
                Status = context.Response.StatusCode,
                Detail = "Please contact administrator.",
                Instance = context.Request.Path
            };
            problemDetails.Extensions.Add("traceId", traceId);

            var jsonResponse = JsonSerializer.Serialize(problemDetails);
            return context.Response.WriteAsync(jsonResponse);
        }
    }
}
