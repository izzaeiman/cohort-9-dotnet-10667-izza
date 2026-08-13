using Backend.Models;

namespace Backend.Services
{
    public interface IJwtTokenService
    {
        string GenerateToken(User user);
    }
}
