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
        // Static dummy hash used only for timing-safe user-not-found path.
        // This is a pre-computed BCrypt hash of a throwaway value and is not a secret.
        private static readonly string _dummyPasswordHash =
            new PasswordHasher<User>().HashPassword(new User(), "DUMMY_TIMING_PLACEHOLDER_NOT_A_REAL_PASSWORD");

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
            var token = _jwtTokenService.GenerateToken(createdUser);

            // Finding #10: log UserId only, not email
            _logger.LogInformation("User registration successful for UserId: {UserId}, Role: {Role}",
                createdUser.Id, createdUser.Role);

            return new AuthResponseDto
            {
                Token = token,
                User = MapToUserDto(createdUser)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

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

            var token = _jwtTokenService.GenerateToken(user);

            // Finding #10: log UserId and role only, not email
            _logger.LogInformation("Login successful for UserId: {UserId}, Role: {Role}", user.Id, user.Role);

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
