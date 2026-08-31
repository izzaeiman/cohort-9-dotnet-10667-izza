using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Backend.Models;

namespace Backend.Services
{
    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        public (string Token, DateTimeOffset ExpiresAt) GenerateToken(User user)
        {
            ArgumentNullException.ThrowIfNull(user);
            if (string.IsNullOrWhiteSpace(user.Id)) throw new ArgumentException("User Id is required.", nameof(user));
            if (string.IsNullOrWhiteSpace(user.Email)) throw new ArgumentException("User Email is required.", nameof(user));
            if (string.IsNullOrWhiteSpace(user.Name)) throw new ArgumentException("User Name is required.", nameof(user));
            if (string.IsNullOrWhiteSpace(user.Role)) throw new ArgumentException("User Role is required.", nameof(user));
            // Key must be configured — no hardcoded fallback in production
            var jwtKey = _configuration["Jwt:Key"]
                ?? Environment.GetEnvironmentVariable("JWT_KEY")
                ?? throw new InvalidOperationException(
                    "JWT signing key is not configured. Set 'Jwt:Key' in configuration or the JWT_KEY environment variable.");

            var issuer = _configuration["Jwt:Issuer"] ?? "WorkFlowApi";
            var audience = _configuration["Jwt:Audience"] ?? "WorkFlowClient";
            var expirationMinutes = int.TryParse(_configuration["Jwt:ExpirationMinutes"], out var exp) ? exp : 1440;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("role", user.Role)
            };

            var expires = DateTime.UtcNow.AddMinutes(expirationMinutes);
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return (new JwtSecurityTokenHandler().WriteToken(token), expires);
        }
    }
}
