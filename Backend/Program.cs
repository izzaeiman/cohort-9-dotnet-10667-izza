using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
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
        .Build())
    .CreateLogger();

try
{
    Log.Information("Starting WorkFlow Task Management Backend Service...");

    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    // 1. Add DbContext with SQL Server configuration
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(connectionString));

    // 2. Configure CORS for Frontend Integration
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowReactFrontend", policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    // 3. Register Repositories & Services
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<ITaskRepository, TaskRepository>();

    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<ITaskService, TaskService>();
    builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
    builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

    // 4. Register Controllers
    builder.Services.AddControllers();

    // 5. Configure JWT Bearer Authentication & Authorization
    var jwtKey = builder.Configuration["Jwt:Key"]
        ?? "SuperSecretDevelopmentJwtKeyThatIsAtLeast32BytesLong123456!";
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "WorkFlowApi";
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "WorkFlowClient";

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
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

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("RequireAdministrator", policy => policy.RequireRole(UserRoles.Administrator));
    });

    // 6. OpenAPI/Swagger Explorer
    builder.Services.AddOpenApi();

    var app = builder.Build();

    // Global Exception Handling Middleware
    app.UseMiddleware<GlobalExceptionMiddleware>();

    // Configure HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    app.UseHttpsRedirection();
    app.UseCors("AllowReactFrontend");
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Backend service terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}
