using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using Backend.Controllers;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Tests.Controllers
{
    public class UsersControllerTests
    {
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly UsersController _controller;

        public UsersControllerTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _controller = new UsersController(_userRepositoryMock.Object);
        }

        private void SetupUser(string role)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "usr-1"),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        [Fact]
        public async Task GetUsers_Administrator_ReturnsUsersWithEmails()
        {
            // Arrange
            SetupUser("Administrator");
            
            var users = new List<User>
            {
                new User { Id = "usr-1", Name = "Admin", Email = "admin@test.com", Role = "Administrator" },
                new User { Id = "usr-2", Name = "User", Email = "user@test.com", Role = "Regular User" }
            };
            _userRepositoryMock.Setup(repo => repo.GetAllAsync()).ReturnsAsync(users);

            // Act
            var result = await _controller.GetUsers(null);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedUsers = Assert.IsAssignableFrom<IEnumerable<UserDto>>(okResult.Value);
            
            Assert.Equal(2, returnedUsers.Count());
            Assert.Equal("admin@test.com", returnedUsers.First().Email);
            Assert.Equal("user@test.com", returnedUsers.Last().Email);
        }

        [Fact]
        public async Task GetUsers_NonAdministrator_MasksEmails()
        {
            // Arrange
            SetupUser("Regular User"); // Should not technically reach here due to Authorize attribute, but testing logic
            
            var users = new List<User>
            {
                new User { Id = "usr-1", Name = "Admin", Email = "admin@test.com", Role = "Administrator" }
            };
            _userRepositoryMock.Setup(repo => repo.GetAllAsync()).ReturnsAsync(users);

            // Act
            var result = await _controller.GetUsers(null);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedUsers = Assert.IsAssignableFrom<IEnumerable<UserDto>>(okResult.Value);
            
            Assert.Single(returnedUsers);
            Assert.Equal(string.Empty, returnedUsers.First().Email);
        }

        [Fact]
        public async Task UpdateRole_AdminUser_ValidRole_Succeeds()
        {
            // Arrange
            SetupUser("Administrator");
            var user = new User { Id = "usr-2", Name = "User", Role = UserRoles.RegularUser, Email = "user@test.com" };
            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-2")).ReturnsAsync(user);

            var dto = new UpdateRoleDto { Role = UserRoles.Administrator };

            // Act
            var result = await _controller.UpdateRole("usr-2", dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedUser = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal(UserRoles.Administrator, returnedUser.Role);
            Assert.Equal(UserRoles.Administrator, user.Role);
            _userRepositoryMock.Verify(r => r.UpdateAsync(user), Times.Once);
        }

        [Fact]
        public async Task UpdateRole_InvalidRole_ReturnsBadRequest()
        {
            // Arrange
            SetupUser("Administrator");
            var dto = new UpdateRoleDto { Role = "SuperAdmin" };

            // Act
            var result = await _controller.UpdateRole("usr-2", dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UpdateRole_UserNotFound_ReturnsNotFound()
        {
            // Arrange
            SetupUser("Administrator");
            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-999")).ReturnsAsync((User?)null);
            var dto = new UpdateRoleDto { Role = UserRoles.Administrator };

            // Act
            var result = await _controller.UpdateRole("usr-999", dto);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        }
    }
}
