using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;
using Backend.Services;

namespace Backend.Tests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly Mock<IPasswordHasher<User>> _passwordHasherMock;
        private readonly Mock<IJwtTokenService> _jwtTokenServiceMock;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _passwordHasherMock = new Mock<IPasswordHasher<User>>();
            _jwtTokenServiceMock = new Mock<IJwtTokenService>();
            var logger = NullLogger<AuthService>.Instance;

            _authService = new AuthService(
                _userRepositoryMock.Object,
                _passwordHasherMock.Object,
                _jwtTokenServiceMock.Object,
                logger
            );
        }

        // ── Existing tests (unchanged) ────────────────────────────────────────

        [Fact]
        public async Task Test1_RegisterAsync_CreatesRegularUserByDefault()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "John Engineer",
                Email = "john@company.com",
                Password = "Password123!"
            };

            _userRepositoryMock.Setup(r => r.ExistsByEmailAsync(It.IsAny<string>())).ReturnsAsync(false);
            _passwordHasherMock.Setup(h => h.HashPassword(It.IsAny<User>(), It.IsAny<string>())).Returns("HashedPassword123!");
            _userRepositoryMock.Setup(r => r.CreateAsync(It.IsAny<User>()))
                .ReturnsAsync((User u) => u);
            _jwtTokenServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("valid-jwt-token");

            // Act
            var result = await _authService.RegisterAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("john@company.com", result.User.Email);
            Assert.Equal(UserRoles.RegularUser, result.User.Role);
            Assert.Equal("valid-jwt-token", result.Token);
            _userRepositoryMock.Verify(r => r.CreateAsync(It.Is<User>(u => u.Role == UserRoles.RegularUser)), Times.Once);
        }

        [Fact]
        public async Task Test2_RegisterAsync_DuplicateEmail_IsRejected()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Name = "Jane Dev",
                Email = "existing@company.com",
                Password = "Password123!"
            };

            _userRepositoryMock.Setup(r => r.ExistsByEmailAsync("existing@company.com")).ReturnsAsync(true);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => _authService.RegisterAsync(dto));
            Assert.Equal("User with this email already exists.", exception.Message);
            _userRepositoryMock.Verify(r => r.CreateAsync(It.IsAny<User>()), Times.Never);
        }

        [Fact]
        public async Task Test3_LoginAsync_ValidCredentials_Succeeds()
        {
            // Arrange
            var dto = new LoginDto
            {
                Email = "john@company.com",
                Password = "Password123!"
            };

            var existingUser = new User
            {
                Id = "usr-101",
                Name = "John Engineer",
                Email = "john@company.com",
                PasswordHash = "HashedPassword123!",
                Role = UserRoles.RegularUser
            };

            _userRepositoryMock.Setup(r => r.GetByEmailAsync("john@company.com")).ReturnsAsync(existingUser);
            _passwordHasherMock.Setup(h => h.VerifyHashedPassword(existingUser, "HashedPassword123!", "Password123!"))
                .Returns(PasswordVerificationResult.Success);
            _jwtTokenServiceMock.Setup(j => j.GenerateToken(existingUser)).Returns("valid-jwt-token");

            // Act
            var result = await _authService.LoginAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("usr-101", result.User.Id);
            Assert.Equal("john@company.com", result.User.Email);
            Assert.Equal("valid-jwt-token", result.Token);
        }

        [Fact]
        public async Task Test4_LoginAsync_InvalidCredentials_Fails()
        {
            // Arrange
            var dto = new LoginDto
            {
                Email = "john@company.com",
                Password = "WrongPassword!"
            };

            var existingUser = new User
            {
                Id = "usr-101",
                Name = "John Engineer",
                Email = "john@company.com",
                PasswordHash = "HashedPassword123!",
                Role = UserRoles.RegularUser
            };

            _userRepositoryMock.Setup(r => r.GetByEmailAsync("john@company.com")).ReturnsAsync(existingUser);
            _passwordHasherMock.Setup(h => h.VerifyHashedPassword(existingUser, "HashedPassword123!", "WrongPassword!"))
                .Returns(PasswordVerificationResult.Failed);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(dto));
            Assert.Equal("Invalid email or password.", exception.Message);
        }

        // ── New tests (CodeRabbit findings #8, #9) ───────────────────────────

        [Fact]
        public async Task Test16_RegisterAsync_NullEmail_ThrowsArgumentException()
        {
            // Finding #8: service-layer null guard before Trim()
            var dto = new RegisterDto { Name = "Alice", Email = null!, Password = "Password123!" };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _authService.RegisterAsync(dto));
            Assert.Equal("dto", ex.ParamName);
        }

        [Fact]
        public async Task Test17_RegisterAsync_WhitespaceEmail_ThrowsArgumentException()
        {
            // Finding #8: whitespace email guard
            var dto = new RegisterDto { Name = "Alice", Email = "   ", Password = "Password123!" };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _authService.RegisterAsync(dto));
            Assert.Equal("dto", ex.ParamName);
        }

        [Fact]
        public async Task Test18_RegisterAsync_NullName_ThrowsArgumentException()
        {
            // Finding #8: null name guard
            var dto = new RegisterDto { Name = null!, Email = "alice@co.com", Password = "Password123!" };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _authService.RegisterAsync(dto));
            Assert.Equal("dto", ex.ParamName);
        }

        [Fact]
        public async Task Test19_LoginAsync_NullEmail_ThrowsArgumentException()
        {
            // Finding #8: null email guard on login
            var dto = new LoginDto { Email = null!, Password = "Password123!" };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _authService.LoginAsync(dto));
            Assert.Equal("dto", ex.ParamName);
        }

        [Fact]
        public async Task Test20_LoginAsync_NullPassword_ThrowsArgumentException()
        {
            // Finding #8: null password guard on login
            var dto = new LoginDto { Email = "alice@co.com", Password = null! };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _authService.LoginAsync(dto));
            Assert.Equal("dto", ex.ParamName);
        }

        [Fact]
        public async Task Test21_LoginAsync_UserNotFound_ThrowsUnauthorized_WithDummyHashVerify()
        {
            // Finding #9: timing-safe user-not-found path still throws UnauthorizedAccessException
            // (dummy hash verify happens internally but result remains the same generic error)
            var dto = new LoginDto { Email = "ghost@company.com", Password = "AnyPassword!" };

            _userRepositoryMock.Setup(r => r.GetByEmailAsync("ghost@company.com")).ReturnsAsync((User?)null);

            // The dummy hash verify uses a real PasswordHasher<User>, not our mock, so we don't set it up.
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(dto));
            Assert.Equal("Invalid email or password.", ex.Message);

            // Ensure no token was generated (short-circuit path)
            _jwtTokenServiceMock.Verify(j => j.GenerateToken(It.IsAny<User>()), Times.Never);
        }
    }
}
