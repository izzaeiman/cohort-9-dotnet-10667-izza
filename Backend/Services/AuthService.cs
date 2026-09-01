using System;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public class AuthService : IAuthService
    {
        // Static dummy hash used only for timing-safe user-not-found path.
        private static readonly string _dummyPasswordHash =
            new PasswordHasher<User>().HashPassword(new User(), "DUMMY_TIMING_PLACEHOLDER_NOT_A_REAL_PASSWORD");

        private readonly IUserRepository _userRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository,
            IPasswordHasher<User> passwordHasher,
            IJwtTokenService jwtTokenService,
            ILogger<AuthService> logger)
        {
            _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
            _refreshTokenRepository = refreshTokenRepository ?? throw new ArgumentNullException(nameof(refreshTokenRepository));
            _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
            _jwtTokenService = jwtTokenService ?? throw new ArgumentNullException(nameof(jwtTokenService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<AuthInternalResult> RegisterAsync(RegisterDto dto)
        {
            ArgumentNullException.ThrowIfNull(dto);

            // Finding #8: explicit null/whitespace guards before Trim() to protect direct callers
            if (string.IsNullOrWhiteSpace(dto.Email))
                throw new ArgumentException("Email is required.", nameof(dto));
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Name is required.", nameof(dto));
            if (string.IsNullOrWhiteSpace(dto.Password))
                throw new ArgumentException("Password is required.", nameof(dto));

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            // Finding #10: log event type only — do not log raw email address
            _logger.LogInformation("Registration attempt received.");

            var emailExists = await _userRepository.ExistsByEmailAsync(normalizedEmail);
            if (emailExists)
            {
                // Finding #10: do not log the email address
                _logger.LogWarning("Registration failed: Duplicate email attempt.");
                throw new InvalidOperationException("User with this email already exists.");
            }

            var newUser = new User
            {
                Id = Guid.NewGuid().ToString(),
                Name = dto.Name.Trim(),
                Email = normalizedEmail,
                // Finding #3: use centralized role constant — never trust client-provided role
                Role = UserRoles.RegularUser,
            };

            newUser.PasswordHash = _passwordHasher.HashPassword(newUser, dto.Password);

            var createdUser = await _userRepository.CreateAsync(newUser);
            var tokenInfo = _jwtTokenService.GenerateToken(createdUser);
            var rawRefresh = await IssueRefreshTokenAsync(createdUser.Id);

            // Finding #10: log UserId only, not email
            _logger.LogInformation("User registration successful for UserId: {UserId}, Role: {Role}",
                createdUser.Id, createdUser.Role);

            return new AuthInternalResult
            {
                Token = tokenInfo.Token,
                ExpiresAt = tokenInfo.ExpiresAt,
                RefreshToken = rawRefresh,
                User = MapToUserDto(createdUser)
            };
        }

        public async Task<AuthInternalResult> LoginAsync(LoginDto dto)
        {
            ArgumentNullException.ThrowIfNull(dto);

            // Finding #8: explicit null/whitespace guards before Trim()
            if (string.IsNullOrWhiteSpace(dto.Email))
                throw new ArgumentException("Email is required.", nameof(dto));
            if (string.IsNullOrWhiteSpace(dto.Password))
                throw new ArgumentException("Password is required.", nameof(dto));

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            // Finding #10: do not log the raw email address
            _logger.LogInformation("Login attempt received.");

            var user = await _userRepository.GetByEmailAsync(normalizedEmail);
            if (user == null)
            {
                // Finding #9: perform dummy hash verification to reduce timing difference
                // between user-not-found and wrong-password paths.
                _passwordHasher.VerifyHashedPassword(new User(), _dummyPasswordHash, dto.Password);

                // Finding #10: do not log the email address
                _logger.LogWarning("Login failed: credentials not recognized.");
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                // Finding #10: log UserId only, not email
                _logger.LogWarning("Login failed: password verification failed for UserId: {UserId}", user.Id);
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            var tokenInfo = _jwtTokenService.GenerateToken(user);
            var rawRefresh = await IssueRefreshTokenAsync(user.Id);

            // Finding #10: log UserId and role only, not email
            _logger.LogInformation("Login successful for UserId: {UserId}, Role: {Role}", user.Id, user.Role);

            return new AuthInternalResult
            {
                Token = tokenInfo.Token,
                ExpiresAt = tokenInfo.ExpiresAt,
                RefreshToken = rawRefresh,
                User = MapToUserDto(user)
            };
        }

        public async Task<UserDto?> GetCurrentUserAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId)) return null;

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("GetCurrentUser: User record not found for UserId: {UserId}", userId);
                return null;
            }

            return MapToUserDto(user);
        }

        public async Task ChangePasswordAsync(string userId, ChangePasswordDto dto)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new UnauthorizedAccessException("User not found.");
            }

            var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (verification == PasswordVerificationResult.Failed)
            {
                throw new InvalidOperationException("Incorrect current password.");
            }

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
            await _userRepository.UpdateAsync(user);
            
            _logger.LogInformation("Password changed successfully for UserId: {UserId}", userId);
        }

        /// <summary>Issues a new rotating refresh token alongside an access token.</summary>
        public async Task<AuthInternalResult> RefreshAsync(string rawRefreshToken)
        {
            if (string.IsNullOrWhiteSpace(rawRefreshToken))
                throw new UnauthorizedAccessException("Refresh token is required.");

            var tokenHash = HashToken(rawRefreshToken);
            var storedToken = await _refreshTokenRepository.GetByTokenHashAsync(tokenHash);

            if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiresAt < DateTimeOffset.UtcNow)
            {
                _logger.LogWarning("Refresh attempt with invalid/expired/revoked token.");
                throw new UnauthorizedAccessException("Invalid or expired refresh token.");
            }

            var user = await _userRepository.GetByIdAsync(storedToken.UserId);
            if (user == null)
            {
                _logger.LogWarning("Refresh: user {UserId} not found.", storedToken.UserId);
                throw new UnauthorizedAccessException("User not found.");
            }

            // Rotate: revoke old token, issue new one
            await _refreshTokenRepository.RevokeAsync(storedToken);
            var tokenInfo = _jwtTokenService.GenerateToken(user);
            var newRefreshResult = await IssueRefreshTokenAsync(user.Id);

            _logger.LogInformation("Token refreshed for UserId: {UserId}", user.Id);

            return new AuthInternalResult
            {
                Token = tokenInfo.Token,
                ExpiresAt = tokenInfo.ExpiresAt,
                RefreshToken = newRefreshResult,
                User = MapToUserDto(user)
            };
        }

        public async Task RevokeAllRefreshTokensAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId)) return;
            await _refreshTokenRepository.RevokeAllForUserAsync(userId);
            _logger.LogInformation("All refresh tokens revoked for UserId: {UserId}", userId);
        }

        /// <summary>Creates a hashed refresh token record in the DB and returns the raw (unhashed) token for cookie use.</summary>
        private async Task<string> IssueRefreshTokenAsync(string userId)
        {
            var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var tokenHash = HashToken(rawToken);

            await _refreshTokenRepository.CreateAsync(new RefreshToken
            {
                UserId = userId,
                TokenHash = tokenHash,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
                CreatedAt = DateTimeOffset.UtcNow
            });

            return rawToken;
        }

        public static string HashToken(string rawToken)
        {
            var bytes = System.Text.Encoding.UTF8.GetBytes(rawToken);
            var hash = SHA256.HashData(bytes);
            return Convert.ToBase64String(hash);
        }

        private static UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                Avatar = user.Avatar
            };
        }
    }
}
