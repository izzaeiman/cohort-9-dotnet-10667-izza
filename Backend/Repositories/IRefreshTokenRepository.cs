using System.Threading.Tasks;
using Backend.Models;

namespace Backend.Repositories
{
    public interface IRefreshTokenRepository
    {
        Task<RefreshToken?> GetByTokenHashAsync(string tokenHash);
        Task<RefreshToken> CreateAsync(RefreshToken token);
        Task RevokeAsync(RefreshToken token);
        Task RevokeAllForUserAsync(string userId);
    }
}
