using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _authServiceMock = new Mock<IAuthService>();
            _controller = new AuthController(_authServiceMock.Object);
        }

        [Fact]
        public async Task Register_ValidDto_ReturnsCreatedResult_WithAuthResponse()
        {
            // Arrange
            var registerDto = new RegisterDto { Name = "Alice", Email = "alice@test.com", Password = "Password123!" };
            var expectedResponse = new AuthResponseDto
            {
                Token = "jwt-token-123",
                User = new UserDto { Id = "usr-1", Name = "Alice", Email = "alice@test.com", Role = UserRoles.RegularUser }
            };

            _authServiceMock.Setup(s => s.RegisterAsync(registerDto)).ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(nameof(AuthController.GetMe), createdResult.ActionName);
            Assert.Equal(expectedResponse, createdResult.Value);
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
            var expectedResponse = new AuthResponseDto
            {
                Token = "jwt-token-123",
                User = new UserDto { Id = "usr-1", Name = "Alice", Email = "alice@test.com", Role = UserRoles.RegularUser }
            };

            _authServiceMock.Setup(s => s.LoginAsync(loginDto)).ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(expectedResponse, okResult.Value);
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
    }
}
