using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using Backend.Controllers;
using Backend.Data;
using Backend.Models;

namespace Backend.Tests.Controllers
{
    public class UploadsControllerTests
    {
        private readonly ApplicationDbContext _context;
        private readonly UploadsController _controller;

        public UploadsControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);
            _controller = new UploadsController(_context);
        }

        private void SetUserContext(string userId)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Fact]
        public async Task UploadAvatar_NullFile_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.UploadAvatar(null!);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UploadAvatar_InvalidExtension_ReturnsBadRequest()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.Length).Returns(100);
            fileMock.Setup(f => f.FileName).Returns("test.txt");

            // Act
            var result = await _controller.UploadAvatar(fileMock.Object);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UploadAvatar_ValidFile_Succeeds()
        {
            // Arrange
            SetUserContext("u1");
            var user = new User { Id = "u1", Name = "User 1", Email = "u1@co.com" };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.Length).Returns(100);
            fileMock.Setup(f => f.FileName).Returns("test.png");
            fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.UploadAvatar(fileMock.Object);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            
            // Clean up created file/directories if any
            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
            if (Directory.Exists(uploadsDir))
            {
                try { Directory.Delete(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), true); } catch {}
            }
        }
    }
}
