using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using LoginFeature.Models;
using LoginFeature.Services;

namespace LoginFeature.Controllers
{
    /// <summary>
    /// Handles user authentication and login operations.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Validates user credentials and authenticates the user.
        /// </summary>
        /// <param name="model">The login form data.</param>
        /// <returns>HTTP result indicating authentication status.</returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromForm] LoginViewModel model)
        {
            if (model == null)
            {
                return BadRequest(new { success = false, message = "Login request model cannot be null." });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new { success = false, message = "Validation failed.", errors });
            }

            var result = await _authService.AuthenticateAsync(model, HttpContext);
            if (!result.Success)
            {
                return Unauthorized(new { success = false, message = result.ErrorMessage });
            }

            return Ok(new { success = true, message = "Authentication successful.", userId = result.UserId, email = result.Email });
        }

        /// <summary>
        /// Logs the user out and clears the authenticated session.
        /// </summary>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _authService.SignOutAsync(HttpContext);
            return Ok(new { success = true, message = "Logged out successfully." });
        }
    }
}
