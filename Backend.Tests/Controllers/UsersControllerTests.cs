using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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

        [Fact]
        public async Task GetUsers_ReturnsOkResult_WithSafeUserDtos()
        {
            // Arrange
            var mockUsers = new List<User>
            {
                new User { Id = "usr-1", Name = "User One", Email = "one@test.com", PasswordHash = "secret_hash", Role = UserRoles.RegularUser },
                new User { Id = "usr-2", Name = "User Two", Email = "two@test.com", PasswordHash = "another_secret", Role = UserRoles.Administrator }
            };

            _userRepositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(mockUsers);

            // Act
            var result = await _controller.GetUsers();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedDtos = Assert.IsAssignableFrom<IEnumerable<UserDto>>(okResult.Value).ToList();

            Assert.Equal(2, returnedDtos.Count);

            // Verify safe public DTO properties mapping
            Assert.Equal("usr-1", returnedDtos[0].Id);
            Assert.Equal("User One", returnedDtos[0].Name);
            Assert.Equal("one@test.com", returnedDtos[0].Email);
            Assert.Equal(UserRoles.RegularUser, returnedDtos[0].Role);

            Assert.Equal("usr-2", returnedDtos[1].Id);
            Assert.Equal("User Two", returnedDtos[1].Name);
            Assert.Equal("two@test.com", returnedDtos[1].Email);
            Assert.Equal(UserRoles.Administrator, returnedDtos[1].Role);
        }
    }
}
