using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Services
{
    public interface IAuthService
    {
        Task<AuthInternalResult> RegisterAsync(RegisterDto dto);
        Task<AuthInternalResult> LoginAsync(LoginDto dto);
        Task<UserDto?> GetCurrentUserAsync(string userId);
        Task ChangePasswordAsync(string userId, ChangePasswordDto dto);
        /// <summary>Validates a hashed refresh token, revokes it, and issues a new access token + refresh token.</summary>
        Task<AuthInternalResult> RefreshAsync(string rawRefreshToken);
        /// <summary>Revokes all active refresh tokens for the given user (called on logout).</summary>
        Task RevokeAllRefreshTokensAsync(string userId);
    }
}
