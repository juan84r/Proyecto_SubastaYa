using Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Text.Json;

namespace SubastaYaCopia.Middlewares
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate _next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            this._next = _next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ocurrió una excepción no controlada: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var statusCode = exception switch
            {
                KeyNotFoundException => HttpStatusCode.NotFound,            
                ArgumentException => HttpStatusCode.BadRequest,             
                InvalidOperationException => HttpStatusCode.Conflict,
                UserAlreadyExistsException => HttpStatusCode.Conflict,
                InvalidCredentialsException => HttpStatusCode.Unauthorized,
                InvalidAmountException => HttpStatusCode.Unauthorized,
                NotFoundException => HttpStatusCode.NotFound,
                InvalidAuctionDateException => HttpStatusCode.Unauthorized,
                UnauthorizedAccessException => HttpStatusCode.Unauthorized,
                ConcurrencyConflictException => HttpStatusCode.Unauthorized,

                AuctionNotActiveException => HttpStatusCode.Unauthorized,
                InsufficientFundsException => HttpStatusCode.Unauthorized,
                SelfBiddingException => HttpStatusCode.Unauthorized,
                _ => HttpStatusCode.InternalServerError                     
            };

            context.Response.StatusCode = (int)statusCode;

            var problemDetails = new ProblemDetails
            {
                Status = (int)statusCode,
                Title = GetTitleForStatusCode(statusCode),
                Detail = exception.Message,
                Instance = context.Request.Path
            };

            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var json = JsonSerializer.Serialize(problemDetails, jsonOptions);

            await context.Response.WriteAsync(json);
        }

        private static string GetTitleForStatusCode(HttpStatusCode statusCode) => statusCode switch
        {
            HttpStatusCode.NotFound => "Recurso no encontrado",
            HttpStatusCode.BadRequest => "Petición inválida",
            HttpStatusCode.Conflict => "Conflicto con el estado actual del recurso",
            HttpStatusCode.Unauthorized => "Acceso no autorizado",
            _ => "Error interno del servidor"
        };
    }
}