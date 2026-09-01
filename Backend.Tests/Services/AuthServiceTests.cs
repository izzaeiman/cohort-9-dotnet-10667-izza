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
        private readonly Mock<IRefreshTokenRepository> _refreshTokenRepositoryMock;
        private readonly Mock<IPasswordHasher<User>> _passwordHasherMock;
        private readonly Mock<IJwtTokenService> _jwtTokenServiceMock;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _refreshTokenRepositoryMock = new Mock<IRefreshTokenRepository>();
            _passwordHasherMock = new Mock<IPasswordHasher<User>>();
            _jwtTokenServiceMock = new Mock<IJwtTokenService>();
            var logger = NullLogger<AuthService>.Instance;

            _authService = new AuthService(
                _userRepositoryMock.Object,
                _refreshTokenRepositoryMock.Object,
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
            _jwtTokenServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>()))
                .Returns(("valid-jwt-token", DateTimeOffset.UtcNow.AddMinutes(15)));

            // Act
            var result = await _authService.RegisterAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("john@company.com", result.User.Email);
            Assert.Equal("Regular User", result.User.Role);
            Assert.NotNull(result.Token);
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
            _jwtTokenServiceMock.Setup(j => j.GenerateToken(existingUser))
                .Returns(("valid-jwt-token", DateTimeOffset.UtcNow.AddMinutes(15)));

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

        [Fact]
        public async Task RefreshAsync_ValidToken_SucceedsAndRotates()
        {
            // Arrange
            var rawToken = "raw-refresh-token-123";
            var tokenHash = AuthService.HashToken(rawToken);
            var storedToken = new RefreshToken
            {
                Id = 1,
                UserId = "usr-1",
                TokenHash = tokenHash,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(1),
                IsRevoked = false
            };

            var user = new User { Id = "usr-1", Name = "Alice", Email = "alice@co.com", Role = UserRoles.RegularUser };

            _refreshTokenRepositoryMock.Setup(r => r.GetByTokenHashAsync(tokenHash)).ReturnsAsync(storedToken);
            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-1")).ReturnsAsync(user);
            _jwtTokenServiceMock.Setup(j => j.GenerateToken(user)).Returns(("new-jwt", DateTimeOffset.UtcNow.AddMinutes(15)));

            // Act
            var result = await _authService.RefreshAsync(rawToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("new-jwt", result.Token);
            _refreshTokenRepositoryMock.Verify(r => r.RevokeAsync(storedToken), Times.Once);
            _refreshTokenRepositoryMock.Verify(r => r.CreateAsync(It.IsAny<RefreshToken>()), Times.Once);
        }

        [Fact]
        public async Task RefreshAsync_RevokedToken_ThrowsUnauthorized()
        {
            // Arrange
            var rawToken = "revoked-token-123";
            var tokenHash = AuthService.HashToken(rawToken);
            var storedToken = new RefreshToken
            {
                Id = 2,
                UserId = "usr-1",
                TokenHash = tokenHash,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(1),
                IsRevoked = true
            };

            _refreshTokenRepositoryMock.Setup(r => r.GetByTokenHashAsync(tokenHash)).ReturnsAsync(storedToken);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.RefreshAsync(rawToken));
            Assert.Equal("Invalid or expired refresh token.", ex.Message);
        }

        [Fact]
        public async Task ChangePasswordAsync_ValidCurrentPassword_ChangesPassword()
        {
            // Arrange
            var userId = "usr-1";
            var user = new User { Id = userId, PasswordHash = "hashed-current" };
            var dto = new ChangePasswordDto { CurrentPassword = "currentPass", NewPassword = "newPass" };

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
            _passwordHasherMock.Setup(h => h.VerifyHashedPassword(user, "hashed-current", "currentPass"))
                .Returns(PasswordVerificationResult.Success);
            _passwordHasherMock.Setup(h => h.HashPassword(user, "newPass")).Returns("hashed-new");

            // Act
            await _authService.ChangePasswordAsync(userId, dto);

            // Assert
            Assert.Equal("hashed-new", user.PasswordHash);
            _userRepositoryMock.Verify(r => r.UpdateAsync(user), Times.Once);
        }

        [Fact]
        public async Task ChangePasswordAsync_WrongCurrentPassword_ThrowsInvalidOperationException()
        {
            // Arrange
            var userId = "usr-1";
            var user = new User { Id = userId, PasswordHash = "hashed-current" };
            var dto = new ChangePasswordDto { CurrentPassword = "wrongPass", NewPassword = "newPass" };

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
            _passwordHasherMock.Setup(h => h.VerifyHashedPassword(user, "hashed-current", "wrongPass"))
                .Returns(PasswordVerificationResult.Failed);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _authService.ChangePasswordAsync(userId, dto));
            Assert.Equal("Incorrect current password.", ex.Message);
        }

        // ── Batch 6 — closing the remaining coverage gaps ─────────────────────

        [Fact]
        public async Task GetCurrentUserAsync_NullOrEmptyUserId_ReturnsNull()
        {
            // Null userId short-circuit on line 143
            Assert.Null(await _authService.GetCurrentUserAsync(null!));
            Assert.Null(await _authService.GetCurrentUserAsync(""));
            Assert.Null(await _authService.GetCurrentUserAsync("   "));
        }

        [Fact]
        public async Task GetCurrentUserAsync_UserNotFound_ReturnsNull()
        {
            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-missing")).ReturnsAsync((User?)null);
            Assert.Null(await _authService.GetCurrentUserAsync("usr-missing"));
        }

        [Fact]
        public async Task GetCurrentUserAsync_UserFound_ReturnsDto()
        {
            var user = new User { Id = "usr-99", Name = "Jane", Email = "jane@company.com", Role = UserRoles.RegularUser };
            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-99")).ReturnsAsync(user);

            var result = await _authService.GetCurrentUserAsync("usr-99");

            Assert.NotNull(result);
            Assert.Equal("usr-99", result!.Id);
            Assert.Equal("jane@company.com", result.Email);
        }

        [Fact]
        public async Task ChangePasswordAsync_UserNotFound_ThrowsUnauthorized()
        {
            // Branch: user == null → throw UnauthorizedAccessException
            _userRepositoryMock.Setup(r => r.GetByIdAsync("ghost-usr")).ReturnsAsync((User?)null);
            var dto = new ChangePasswordDto { CurrentPassword = "old", NewPassword = "new" };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.ChangePasswordAsync("ghost-usr", dto));
            Assert.Equal("User not found.", ex.Message);
        }

        [Fact]
        public async Task RevokeAllRefreshTokensAsync_EmptyUserId_DoesNothing()
        {
            // Branch: string.IsNullOrWhiteSpace(userId) → early return
            await _authService.RevokeAllRefreshTokensAsync("");
            _refreshTokenRepositoryMock.Verify(r => r.RevokeAllForUserAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task RevokeAllRefreshTokensAsync_ValidUserId_RevokesAllTokens()
        {
            await _authService.RevokeAllRefreshTokensAsync("usr-1");
            _refreshTokenRepositoryMock.Verify(r => r.RevokeAllForUserAsync("usr-1"), Times.Once);
        }

        [Fact]
        public void HashToken_IsDeterministic()
        {
            // Same input must always produce the same hash
            var hash1 = AuthService.HashToken("some-raw-token");
            var hash2 = AuthService.HashToken("some-raw-token");
            Assert.Equal(hash1, hash2);
            Assert.NotEqual(hash1, AuthService.HashToken("different-token"));
        }

        [Fact]
        public async Task RefreshAsync_EmptyToken_ThrowsUnauthorized()
        {
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.RefreshAsync(""));
            Assert.Equal("Refresh token is required.", ex.Message);
        }

        [Fact]
        public async Task RefreshAsync_UserNotFoundAfterValidToken_ThrowsUnauthorized()
        {
            // StoredToken valid but associated user was deleted
            var rawToken = "some-valid-raw-token";
            var tokenHash = AuthService.HashToken(rawToken);
            var storedToken = new RefreshToken
            {
                UserId = "deleted-usr",
                TokenHash = tokenHash,
                IsRevoked = false,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(7)
            };

            _refreshTokenRepositoryMock.Setup(r => r.GetByTokenHashAsync(tokenHash)).ReturnsAsync(storedToken);
            _userRepositoryMock.Setup(r => r.GetByIdAsync("deleted-usr")).ReturnsAsync((User?)null);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.RefreshAsync(rawToken));
            Assert.Equal("User not found.", ex.Message);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public async Task LoginAsync_NullOrEmptyEmail_ThrowsArgumentException(string? email)
        {
            var dto = new LoginDto { Email = email!, Password = "password" };
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _authService.LoginAsync(dto));
            Assert.Contains("Email", ex.Message);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public async Task LoginAsync_NullOrEmptyPassword_ThrowsArgumentException(string? password)
        {
            var dto = new LoginDto { Email = "user@test.com", Password = password! };
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _authService.LoginAsync(dto));
            Assert.Contains("Password", ex.Message);
        }

        [Fact]
        public async Task LoginAsync_UserNotFound_PerformsDummyHashAndThrows()
        {
            // Finding #9 — dummy hash is performed even when user is not found (timing-safe)
            var dto = new LoginDto { Email = "notfound@test.com", Password = "anything" };
            _userRepositoryMock.Setup(r => r.GetByEmailAsync("notfound@test.com")).ReturnsAsync((User?)null);
            // The mock passwordHasher's VerifyHashedPassword will be called with dummy hash
            _passwordHasherMock.Setup(h => h.VerifyHashedPassword(It.IsAny<User>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(PasswordVerificationResult.Failed);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(dto));
            Assert.Equal("Invalid email or password.", ex.Message);
            // Verify the dummy hash verify was called once
            _passwordHasherMock.Verify(h => h.VerifyHashedPassword(It.IsAny<User>(), It.IsAny<string>(), "anything"), Times.Once);
        }
    }
}
