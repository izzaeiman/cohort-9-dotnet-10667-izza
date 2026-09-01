using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Antiforgery;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IAntiforgery _antiforgery;
        private readonly Backend.Data.ApplicationDbContext _context;

        public AuthController(IAuthService authService, IAntiforgery antiforgery, Backend.Data.ApplicationDbContext context)
        {
            _authService = authService ?? throw new ArgumentNullException(nameof(authService));
            _antiforgery = antiforgery ?? throw new ArgumentNullException(nameof(antiforgery));
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpGet("antiforgery-token")]
        [IgnoreAntiforgeryToken]
        public IActionResult GetAntiforgeryToken()
        {
            var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
            return Ok(new { token = tokens.RequestToken });
        }

        [HttpPost("register")]
        [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(AuthResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var result = await _authService.RegisterAsync(dto);
                AppendAccessTokenCookie(result.Token, result.ExpiresAt);
                if (!string.IsNullOrEmpty(result.RefreshToken))
                {
                    AppendRefreshTokenCookie(result.RefreshToken);
                }
                return CreatedAtAction(nameof(GetMe), null, new AuthResponseDto { User = result.User });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(AuthResponseDto))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var result = await _authService.LoginAsync(dto);
                AppendAccessTokenCookie(result.Token, result.ExpiresAt);
                if (!string.IsNullOrEmpty(result.RefreshToken))
                {
                    AppendRefreshTokenCookie(result.RefreshToken);
                }
                return Ok(new AuthResponseDto { User = result.User });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost("refresh")]
        [IgnoreAntiforgeryToken]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(AuthResponseDto))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Refresh()
        {
            var rawRefreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(rawRefreshToken))
            {
                return Unauthorized(new { message = "Refresh token missing." });
            }

            try
            {
                var result = await _authService.RefreshAsync(rawRefreshToken);
                AppendAccessTokenCookie(result.Token, result.ExpiresAt);
                if (!string.IsNullOrEmpty(result.RefreshToken))
                {
                    AppendRefreshTokenCookie(result.RefreshToken);
                }
                return Ok(new AuthResponseDto { User = result.User });
            }
            catch (UnauthorizedAccessException ex)
            {
                Response.Cookies.Delete("access_token");
                Response.Cookies.Delete("refresh_token");
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                await _authService.RevokeAllRefreshTokensAsync(userId);
            }

            Response.Cookies.Delete("access_token");
            Response.Cookies.Delete("refresh_token");
            return NoContent();
        }

        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UserDto))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized(new { message = "Invalid token claims." });

            var user = await _authService.GetCurrentUserAsync(userId);
            if (user == null) return NotFound(new { message = "User not found." });

            return Ok(user);
        }

        [HttpPut("change-password")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                await _authService.ChangePasswordAsync(userId, dto);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("profile")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UserDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                _context.Users, u => u.Id == userId
            );
            if (user == null) return NotFound(new { message = "User not found." });

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                user.Name = dto.Name;
            }
            if (dto.Avatar != null)
            {
                user.Avatar = dto.Avatar;
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                Avatar = user.Avatar
            });
        }


        [HttpGet("admin-only")]
        [Authorize(Roles = UserRoles.Administrator)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public IActionResult AdminOnly()
        {
            return Ok(new { message = "Access granted to Administrator resource." });
        }

        [HttpGet("sessions")]
        [Authorize]
        public async Task<IActionResult> GetSessions()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var currentRefreshToken = Request.Cookies["refresh_token"];
            var currentTokenHash = !string.IsNullOrEmpty(currentRefreshToken) 
                ? Backend.Services.AuthService.HashToken(currentRefreshToken) 
                : string.Empty;

            var sessions = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
                System.Linq.Queryable.Where(_context.RefreshTokens, r => r.UserId == userId && !r.IsRevoked && r.ExpiresAt > DateTime.UtcNow)
                .Select(r => new
                {
                    r.Id,
                    r.CreatedAt,
                    r.ExpiresAt,
                    r.IsRevoked,
                    IsCurrent = r.TokenHash == currentTokenHash
                })
            );

            return Ok(sessions);
        }

        [HttpPost("sessions/{id}/revoke")]
        [Authorize]
        public async Task<IActionResult> RevokeSession(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var token = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                _context.RefreshTokens, r => r.Id == id && r.UserId == userId
            );

            if (token == null) return NotFound(new { message = "Session not found." });

            token.IsRevoked = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Session revoked successfully." });
        }

        private void AppendAccessTokenCookie(string token, DateTimeOffset expiresAt)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Expires = expiresAt
            };
            Response.Cookies.Append("access_token", token, cookieOptions);
        }

        private void AppendRefreshTokenCookie(string refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            };
            Response.Cookies.Append("refresh_token", refreshToken, cookieOptions);
        }
    }
}
