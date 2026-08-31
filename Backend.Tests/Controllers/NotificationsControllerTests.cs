using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Backend.Controllers;
using Backend.Data;
using Backend.Models;

namespace Backend.Tests.Controllers
{
    public class NotificationsControllerTests
    {
        private readonly ApplicationDbContext _context;
        private readonly NotificationsController _controller;

        public NotificationsControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);
            _controller = new NotificationsController(_context);
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
        public async Task GetNotifications_ReturnsOk_WithAssignmentAndDeadlineNotifications()
        {
            // Arrange
            SetUserContext("u1");
            var task = new TaskItem
            {
                Id = 101,
                Title = "High Priority Task",
                AssignedUserId = "u1",
                Status = TaskStatusEnum.InProgress,
                DueDate = DateTime.UtcNow.AddHours(24), // inside 48h horizon
                CreatedAt = DateTime.UtcNow.AddHours(-1)
            };
            await _context.Tasks.AddAsync(task);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetNotifications();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var list = Assert.IsAssignableFrom<List<NotificationItemDto>>(okResult.Value);
            Assert.Equal(2, list.Count); // One assignment + one deadline notification
            Assert.Equal("assignment", list[1].Type);
            Assert.Equal("deadline", list[0].Type);
        }
    }
}
