using System;
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
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IUserRepository userRepository,
            IPasswordHasher<User> passwordHasher,
            IJwtTokenService jwtTokenService,
            ILogger<AuthService> logger)
        {
            _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
            _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
            _jwtTokenService = jwtTokenService ?? throw new ArgumentNullException(nameof(jwtTokenService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            _logger.LogInformation("Registration attempt for email: {Email}", normalizedEmail);

            var emailExists = await _userRepository.ExistsByEmailAsync(normalizedEmail);
            if (emailExists)
            {
                _logger.LogWarning("Registration failed: Duplicate email attempt for {Email}", normalizedEmail);
                throw new InvalidOperationException("User with this email already exists.");
            }

            var newUser = new User
            {
                Id = Guid.NewGuid().ToString(),
                Name = dto.Name.Trim(),
                Email = normalizedEmail,
                Role = "Regular User", // STRICT SECURITY: Self-registration ALWAYS defaults to Regular User
            };

            newUser.PasswordHash = _passwordHasher.HashPassword(newUser, dto.Password);

            var createdUser = await _userRepository.CreateAsync(newUser);
            var token = _jwtTokenService.GenerateToken(createdUser);

            _logger.LogInformation("User registration successful for UserId: {UserId}, Email: {Email}, Role: {Role}", createdUser.Id, createdUser.Email, createdUser.Role);

            return new AuthResponseDto
            {
                Token = token,
                User = MapToUserDto(createdUser)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            _logger.LogInformation("Login attempt for email: {Email}", normalizedEmail);

            var user = await _userRepository.GetByEmailAsync(normalizedEmail);
            if (user == null)
            {
                _logger.LogWarning("Login failed: User not found for email: {Email}", normalizedEmail);
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                _logger.LogWarning("Login failed: Password verification failed for UserId: {UserId}, Email: {Email}", user.Id, normalizedEmail);
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            var token = _jwtTokenService.GenerateToken(user);
            _logger.LogInformation("Login successful for UserId: {UserId}, Email: {Email}, Role: {Role}", user.Id, user.Email, user.Role);

            return new AuthResponseDto
            {
                Token = token,
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

        private static UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role
            };
        }
    }
}
