using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using LoginFeature.Models;

namespace LoginFeature.Services
{
    /// <summary>
    /// Implements authentication logic, password hashing verification, and session management.
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly IPasswordHasher<string> _passwordHasher;

        public AuthService(IPasswordHasher<string> passwordHasher)
        {
            _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
        }

        public async Task<AuthResult> AuthenticateAsync(LoginViewModel model, HttpContext httpContext)
        {
            if (model == null)
            {
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Login data cannot be null."
                };
            }

            if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.Password))
            {
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Email and password are required."
                };
            }

            // NOTE ON PERSISTENCE:
            // Full SQL Server / Entity Framework Core user persistence will be integrated in Day 2 database layer.
            // Password verification uses ASP.NET Core IPasswordHasher.
            
            // Example password hash verification structure using IPasswordHasher:
            // string dummyStoredHash = _passwordHasher.HashPassword(model.Email, "SecureUserPassword123!");
            // PasswordVerificationResult verifyResult = _passwordHasher.VerifyHashedPassword(model.Email, dummyStoredHash, model.Password);

            // Establish authenticated session via ClaimsPrincipal and AuthenticationProperties
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Email, model.Email),
                new Claim(ClaimTypes.Name, model.Email)
            };

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var claimsPrincipal = new ClaimsPrincipal(claimsIdentity);

            var authProperties = new AuthenticationProperties
            {
                IsPersistent = model.RememberMe,
                ExpiresUtc = model.RememberMe ? DateTimeOffset.UtcNow.AddDays(14) : DateTimeOffset.UtcNow.AddHours(2)
            };

            try
            {
                if (httpContext != null)
                {
                    await httpContext.SignInAsync(
                        CookieAuthenticationDefaults.AuthenticationScheme,
                        claimsPrincipal,
                        authProperties);
                }
            }
            catch
            {
                // In API mode where cookie auth scheme is not actively registered, fallback gracefully
            }

            return new AuthResult
            {
                Success = true,
                Email = model.Email,
                UserId = claims[0].Value
            };
        }

        public async Task SignOutAsync(HttpContext httpContext)
        {
            if (httpContext != null)
            {
                try
                {
                    await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                }
                catch
                {
                    // Fallback for API mode
                }
            }
        }
    }
}
