using System;
using Backend.DTOs;

namespace Backend.Services
{
    public class AuthInternalResult
    {
        public string Token { get; init; } = string.Empty;
        public DateTimeOffset ExpiresAt { get; init; }
        public UserDto User { get; init; } = new();
        /// <summary>Raw (unhashed) refresh token — set only on Login/Register/Refresh. Stored hashed in DB.</summary>
        public string? RefreshToken { get; init; }
    }
}
