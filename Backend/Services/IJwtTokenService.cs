using System;
using Backend.Models;

namespace Backend.Services
{
    public interface IJwtTokenService
    {
        (string Token, DateTimeOffset ExpiresAt) GenerateToken(User user);
    }
}
