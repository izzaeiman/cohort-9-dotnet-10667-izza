using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using Backend.Controllers;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;

namespace Backend.Tests.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _authServiceMock;
        private readonly Mock<IAntiforgery> _antiforgeryMock;
        private readonly Backend.Data.ApplicationDbContext _context;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _authServiceMock = new Mock<IAuthService>();
            _antiforgeryMock = new Mock<IAntiforgery>();

            var options = new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<Backend.Data.ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new Backend.Data.ApplicationDbContext(options);

            _controller = new AuthController(_authServiceMock.Object, _antiforgeryMock.Object, _context);

            var httpContext = new DefaultHttpContext();
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        }

        [Fact]
        public async Task Register_ValidDto_ReturnsCreatedResult_WithAuthResponse()
        {
            // Arrange
            var registerDto = new RegisterDto { Name = "Alice", Email = "alice@test.com", Password = "Password123!" };
            var internalResult = new AuthInternalResult
            {
                Token = "jwt-token-123",
                RefreshToken = "refresh-token-123",
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(15),
                User = new UserDto { Id = "usr-1", Name = "Alice", Email = "alice@test.com", Role = UserRoles.RegularUser }
            };

            _authServiceMock.Setup(s => s.RegisterAsync(registerDto)).ReturnsAsync(internalResult);

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(nameof(AuthController.GetMe), createdResult.ActionName);
            var responseValue = Assert.IsType<AuthResponseDto>(createdResult.Value);
            Assert.Equal("usr-1", responseValue.User.Id);
        }

        [Fact]
        public async Task Register_DuplicateEmail_ReturnsBadRequest_WithMessage()
        {
            // Arrange
            var registerDto = new RegisterDto { Name = "Alice", Email = "alice@test.com", Password = "Password123!" };
            _authServiceMock.Setup(s => s.RegisterAsync(registerDto))
                .ThrowsAsync(new InvalidOperationException("User with this email already exists."));

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            dynamic response = badRequestResult.Value!;
            Assert.Equal("User with this email already exists.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task Login_ValidDto_ReturnsOkResult_WithAuthResponse()
        {
            // Arrange
            var loginDto = new LoginDto { Email = "alice@test.com", Password = "Password123!" };
            var internalResult = new AuthInternalResult
            {
                Token = "jwt-token-123",
                RefreshToken = "refresh-token-123",
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(15),
                User = new UserDto { Id = "usr-1", Name = "Alice", Email = "alice@test.com", Role = UserRoles.RegularUser }
            };

            _authServiceMock.Setup(s => s.LoginAsync(loginDto)).ReturnsAsync(internalResult);

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var responseValue = Assert.IsType<AuthResponseDto>(okResult.Value);
            Assert.Equal("usr-1", responseValue.User.Id);
        }

        [Fact]
        public async Task Login_InvalidCredentials_ReturnsUnauthorized_WithMessage()
        {
            // Arrange
            var loginDto = new LoginDto { Email = "alice@test.com", Password = "WrongPassword!" };
            _authServiceMock.Setup(s => s.LoginAsync(loginDto))
                .ThrowsAsync(new UnauthorizedAccessException("Invalid email or password."));

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            dynamic response = unauthorizedResult.Value!;
            Assert.Equal("Invalid email or password.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task GetMe_NoNameIdentifierClaim_ReturnsUnauthorized()
        {
            // Arrange - controller has HttpContext but no claims
            var user = new ClaimsPrincipal(new ClaimsIdentity());
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Act
            var result = await _controller.GetMe();

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            dynamic response = unauthorizedResult.Value!;
            Assert.Equal("Invalid token claims.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task GetMe_UserNotFound_ReturnsNotFound()
        {
            // Arrange - identity claims exist but service returns null
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "usr-999") };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            _authServiceMock.Setup(s => s.GetCurrentUserAsync("usr-999")).ReturnsAsync((UserDto?)null);

            // Act
            var result = await _controller.GetMe();

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            dynamic response = notFoundResult.Value!;
            Assert.Equal("User not found.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task GetMe_UserFound_ReturnsOkResult_WithUserDto()
        {
            // Arrange
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "usr-1") };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            var userDto = new UserDto { Id = "usr-1", Name = "Alice", Email = "alice@test.com", Role = UserRoles.RegularUser };
            _authServiceMock.Setup(s => s.GetCurrentUserAsync("usr-1")).ReturnsAsync(userDto);

            // Act
            var result = await _controller.GetMe();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(userDto, okResult.Value);
        }

        [Fact]
        public void AdminOnly_AccessGranted_ReturnsOk()
        {
            // Act
            var result = _controller.AdminOnly();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            dynamic response = okResult.Value!;
            Assert.Equal("Access granted to Administrator resource.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task GetSessions_ReturnsOnlyOwnActiveSessions()
        {
            // Arrange
            var userId = "usr-1";
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

            // Seed db
            _context.RefreshTokens.AddRange(
                new RefreshToken { Id = 1, UserId = userId, TokenHash = "hash1", ExpiresAt = DateTimeOffset.UtcNow.AddDays(1), IsRevoked = false },
                new RefreshToken { Id = 2, UserId = userId, TokenHash = "hash2", ExpiresAt = DateTimeOffset.UtcNow.AddDays(1), IsRevoked = true }, // Revoked
                new RefreshToken { Id = 3, UserId = "usr-2", TokenHash = "hash3", ExpiresAt = DateTimeOffset.UtcNow.AddDays(1), IsRevoked = false } // Other user
            );
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetSessions();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var sessions = Assert.IsAssignableFrom<System.Collections.IEnumerable>(okResult.Value);
            var list = new System.Collections.Generic.List<object>();
            foreach (var s in sessions) list.Add(s);
            Assert.Single(list); // Only 1 unrevoked session for usr-1
        }

        [Fact]
        public async Task RevokeSession_ValidId_SetsIsRevoked_AndReturnsOk()
        {
            // Arrange
            var userId = "usr-1";
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

            var token = new RefreshToken { Id = 10, UserId = userId, TokenHash = "hash10", ExpiresAt = DateTimeOffset.UtcNow.AddDays(1), IsRevoked = false };
            _context.RefreshTokens.Add(token);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.RevokeSession(10);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            var updatedToken = await _context.RefreshTokens.FindAsync(10);
            Assert.True(updatedToken!.IsRevoked);
        }

        [Fact]
        public async Task RevokeSession_OtherUserSession_ReturnsNotFound()
        {
            // Arrange
            var userId = "usr-1";
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

            var token = new RefreshToken { Id = 11, UserId = "usr-2", TokenHash = "hash11", ExpiresAt = DateTimeOffset.UtcNow.AddDays(1), IsRevoked = false };
            _context.RefreshTokens.Add(token);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.RevokeSession(11);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task Refresh_TokenMissing_ReturnsUnauthorized()
        {
            // Act
            var result = await _controller.Refresh();

            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Refresh_Success_ReturnsOk()
        {
            // Arrange
            var cookiesMock = new Mock<IRequestCookieCollection>();
            cookiesMock.Setup(c => c["refresh_token"]).Returns("raw-token");
            _controller.ControllerContext.HttpContext.Request.Cookies = cookiesMock.Object;

            var internalResult = new AuthInternalResult
            {
                Token = "new-jwt-123",
                RefreshToken = "refresh-token-123",
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(15),
                User = new UserDto { Id = "usr-1", Role = UserRoles.RegularUser }
            };
            _authServiceMock.Setup(s => s.RefreshAsync("raw-token")).ReturnsAsync(internalResult);

            // Act
            var result = await _controller.Refresh();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var responseValue = Assert.IsType<AuthResponseDto>(okResult.Value);
            Assert.Equal("usr-1", responseValue.User.Id);
        }

        [Fact]
        public async Task Logout_Success_ReturnsNoContent()
        {
            // Arrange
            var userId = "usr-1";
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

            // Act
            var result = await _controller.Logout();

            // Assert
            Assert.IsType<NoContentResult>(result);
            _authServiceMock.Verify(s => s.RevokeAllRefreshTokensAsync("usr-1"), Times.Once);
        }

        [Fact]
        public async Task ChangePassword_Success_ReturnsNoContent()
        {
            // Arrange
            var userId = "usr-1";
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

            var dto = new ChangePasswordDto { CurrentPassword = "old", NewPassword = "new" };

            // Act
            var result = await _controller.ChangePassword(dto);

            // Assert
            Assert.IsType<NoContentResult>(result);
            _authServiceMock.Verify(s => s.ChangePasswordAsync("usr-1", dto), Times.Once);
        }

        [Fact]
        public void GetAntiforgeryToken_ReturnsOk_WithToken()
        {
            var tokenSet = new Microsoft.AspNetCore.Antiforgery.AntiforgeryTokenSet("request-token", "cookie-token", "form-field-name", "header-name");
            _antiforgeryMock.Setup(a => a.GetAndStoreTokens(It.IsAny<HttpContext>())).Returns(tokenSet);
            var result = _controller.GetAntiforgeryToken();
            var okResult = Assert.IsType<OkObjectResult>(result);
            var tokenProp = okResult.Value!.GetType().GetProperty("token");
            Assert.Equal("request-token", tokenProp!.GetValue(okResult.Value, null));
        }

        // ── Batch 6 — closing the remaining uncovered lines ─────────────────

        [Fact]
        public async Task ChangePassword_NoClaim_ReturnsUnauthorized()
        {
            _controller.ControllerContext.HttpContext.User = new System.Security.Claims.ClaimsPrincipal();
            var result = await _controller.ChangePassword(new ChangePasswordDto { CurrentPassword = "old", NewPassword = "new" });
            Assert.IsType<UnauthorizedResult>(result);
        }

        [Fact]
        public async Task ChangePassword_ServiceThrowsInvalidOperation_ReturnsBadRequest()
        {
            var claims = new[] { new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "usr-1") };
            _controller.ControllerContext.HttpContext.User = new System.Security.Claims.ClaimsPrincipal(
                new System.Security.Claims.ClaimsIdentity(claims, "TestAuth"));
            _authServiceMock.Setup(s => s.ChangePasswordAsync("usr-1", It.IsAny<ChangePasswordDto>()))
                .ThrowsAsync(new InvalidOperationException("Incorrect current password."));
            var result = await _controller.ChangePassword(new ChangePasswordDto { CurrentPassword = "wrong", NewPassword = "new" });
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task Refresh_NoCookie_ReturnsUnauthorized()
        {
            var result = await _controller.Refresh();
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Refresh_ServiceThrows_ReturnsUnauthorized()
        {
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Headers["Cookie"] = "refresh_token=bad-token";
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
            _authServiceMock.Setup(s => s.RefreshAsync("bad-token"))
                .ThrowsAsync(new UnauthorizedAccessException("Invalid or expired refresh token."));
            var result = await _controller.Refresh();
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task GetSessions_NoClaim_ReturnsUnauthorized()
        {
            _controller.ControllerContext.HttpContext.User = new System.Security.Claims.ClaimsPrincipal();
            var result = await _controller.GetSessions();
            Assert.IsType<UnauthorizedResult>(result);
        }

        [Fact]
        public async Task GetSessions_ValidUser_ReturnsOk()
        {
            var claims = new[] { new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "usr-1") };
            _controller.ControllerContext.HttpContext.User = new System.Security.Claims.ClaimsPrincipal(
                new System.Security.Claims.ClaimsIdentity(claims, "TestAuth"));
            var result = await _controller.GetSessions();
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task RevokeSession_NoClaim_ReturnsUnauthorized()
        {
            _controller.ControllerContext.HttpContext.User = new System.Security.Claims.ClaimsPrincipal();
            var result = await _controller.RevokeSession(1);
            Assert.IsType<UnauthorizedResult>(result);
        }

        [Fact]
        public async Task RevokeSession_TokenNotFound_ReturnsNotFound()
        {
            var claims = new[] { new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "usr-1") };
            _controller.ControllerContext.HttpContext.User = new System.Security.Claims.ClaimsPrincipal(
                new System.Security.Claims.ClaimsIdentity(claims, "TestAuth"));
            var result = await _controller.RevokeSession(999);
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task RevokeSession_ValidToken_RevokesAndReturnsOk()
        {
            var token = new Backend.Models.RefreshToken
            {
                UserId = "usr-1", TokenHash = "hash-xyz",
                CreatedAt = DateTimeOffset.UtcNow, ExpiresAt = DateTimeOffset.UtcNow.AddDays(7), IsRevoked = false
            };
            _context.RefreshTokens.Add(token);
            await _context.SaveChangesAsync();

            var claims = new[] { new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "usr-1") };
            _controller.ControllerContext.HttpContext.User = new System.Security.Claims.ClaimsPrincipal(
                new System.Security.Claims.ClaimsIdentity(claims, "TestAuth"));

            var result = await _controller.RevokeSession(token.Id);
            Assert.IsType<OkObjectResult>(result);
            Assert.True(token.IsRevoked);
        }
    }
}
