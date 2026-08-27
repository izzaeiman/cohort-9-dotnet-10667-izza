using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using LoginFeature.Models;

namespace LoginFeature.Services
{
    /// <summary>
    /// Contract for user authentication, password verification, and session management.
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Authenticates user credentials, verifies password hash, and establishes session.
        /// </summary>
        Task<AuthResult> AuthenticateAsync(LoginViewModel model, HttpContext httpContext);

        /// <summary>
        /// Invalidates the user's authenticated session and performs logout.
        /// </summary>
        Task SignOutAsync(HttpContext httpContext);
    }
}
