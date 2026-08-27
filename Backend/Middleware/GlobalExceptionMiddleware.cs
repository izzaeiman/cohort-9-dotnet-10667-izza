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
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var errorResponse = new
            {
                statusCode = context.Response.StatusCode,
                message = "An unexpected server error occurred. Please contact administrator.",
                traceId = traceId
            };

            var jsonResponse = JsonSerializer.Serialize(errorResponse);
            return context.Response.WriteAsync(jsonResponse);
        }
    }
}
