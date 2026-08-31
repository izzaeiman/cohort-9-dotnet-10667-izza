using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Serilog;

using Backend.Data;
using Backend.Middleware;
using Backend.Models;
using Backend.Repositories;
using Backend.Services;

// Configure Serilog from appsettings.json
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
        .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
        .AddEnvironmentVariables()
        .Build())
    .CreateLogger();

try
{
    Log.Information("Starting WorkFlow Task Management Backend Service...");

    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    // 1. Validate JWT key at startup — fail fast if missing or too short
    var jwtKey = builder.Configuration["Jwt:Key"]
        ?? Environment.GetEnvironmentVariable("JWT_KEY");

    if (string.IsNullOrWhiteSpace(jwtKey))
    {
        throw new InvalidOperationException(
            "JWT signing key is not configured. " +
            "Set 'Jwt:Key' in appsettings.Development.json, user-secrets, " +
            "or the JWT_KEY environment variable.");
    }

    const int MinJwtKeyBytes = 32;
    if (Encoding.UTF8.GetByteCount(jwtKey) < MinJwtKeyBytes)
    {
        throw new InvalidOperationException(
            $"JWT signing key is too short. Minimum {MinJwtKeyBytes} bytes required for HMAC-SHA256.");
    }

    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "WorkFlowApi";
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "WorkFlowClient";

    // 2. Add DbContext with SQL Server configuration
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(connectionString));

    // Rate Limiting for Auth Endpoints
    builder.Services.AddRateLimiter(options =>
    {
        options.AddFixedWindowLimiter("auth", limiter =>
        {
            limiter.Window = TimeSpan.FromMinutes(1);
            limiter.PermitLimit = 100;
            limiter.QueueLimit = 0;
        });
    });

    // 3. Configure CORS for Frontend Integration
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowReactFrontend", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    // 4. Register Repositories & Services
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
    builder.Services.AddScoped<IProjectRepository, ProjectRepository>();
    builder.Services.AddScoped<ITaskRepository, TaskRepository>();

    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
    builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
    builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

    // 5. Register Controllers
    builder.Services.AddControllersWithViews(options =>
    {
        options.Filters.Add(new Microsoft.AspNetCore.Mvc.AutoValidateAntiforgeryTokenAttribute());
    }).AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

    // 6. Configure JWT Bearer Authentication & Authorization
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        // RequireHttpsMetadata must be true in all non-development environments
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.SaveToken = true;
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                ctx.Token = ctx.Request.Cookies["access_token"];
                return Task.CompletedTask;
            },
            OnTokenValidated = async ctx =>
            {
                var dbContext = ctx.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                var refreshToken = ctx.HttpContext.Request.Cookies["refresh_token"];
                Console.WriteLine($"[TokenValidated] refreshToken cookie: {refreshToken}");
                if (string.IsNullOrEmpty(refreshToken))
                {
                    Console.WriteLine("[TokenValidated] Session token is missing.");
                    ctx.Fail("Session token is missing.");
                    return;
                }
                
                var tokenHash = Backend.Services.AuthService.HashToken(refreshToken);
                var storedToken = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                    dbContext.RefreshTokens, r => r.TokenHash == tokenHash
                );
                
                if (storedToken == null)
                {
                    Console.WriteLine("[TokenValidated] Refresh token not found in DB.");
                    ctx.Fail("Session not found.");
                }
                else if (storedToken.IsRevoked)
                {
                    Console.WriteLine($"[TokenValidated] Refresh token {storedToken.Id} is REVOKED.");
                    ctx.Fail("Session has been revoked.");
                }
                else if (storedToken.ExpiresAt < DateTimeOffset.UtcNow)
                {
                    Console.WriteLine($"[TokenValidated] Refresh token {storedToken.Id} is EXPIRED.");
                    ctx.Fail("Session has expired.");
                }
                else
                {
                    Console.WriteLine($"[TokenValidated] Session {storedToken.Id} is VALID.");
                }
            }
        };
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

    builder.Services.AddAuthorizationBuilder()
        .AddPolicy("RequireAdministrator", policy => policy.RequireRole(UserRoles.Administrator));

    // 7. OpenAPI/Swagger Explorer
    builder.Services.AddOpenApi();

    builder.Services.AddAntiforgery(o => { o.HeaderName = "X-XSRF-TOKEN"; });

    var app = builder.Build();

    // Global Exception Handling Middleware
    app.UseMiddleware<GlobalExceptionMiddleware>();

    // Configure HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
        app.UseHttpsRedirection();
    }
    app.UseStaticFiles();
    app.UseCors("AllowReactFrontend");
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseAntiforgery();

    app.MapControllers();

    await DbInitializer.SeedAdminUserAsync(app.Services);

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Backend service terminated unexpectedly.");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
