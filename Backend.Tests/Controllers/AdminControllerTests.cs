using System;
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
    public class AdminControllerTests
    {
        private readonly ApplicationDbContext _context;
        private readonly AdminController _controller;

        public AdminControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);
            _controller = new AdminController(_context);
        }

        private void SetUserContext(string userId, string userRole)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, userRole)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Fact]
        public async Task GetOverview_AdminUser_ReturnsOkWithMetrics()
        {
            // Arrange
            await _context.Tasks.AddAsync(new TaskItem { Id = 1, Title = "Task 1", Category = TaskCategoryEnum.Backend, Priority = TaskPriorityEnum.High, Status = TaskStatusEnum.Completed });
            await _context.Tasks.AddAsync(new TaskItem { Id = 2, Title = "Task 2", Category = TaskCategoryEnum.Frontend, Priority = TaskPriorityEnum.Medium, Status = TaskStatusEnum.InProgress });
            await _context.SaveChangesAsync();

            SetUserContext("admin-1", UserRoles.Administrator);

            // Act
            var result = await _controller.GetOverview();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<AdminOverviewDto>(okResult.Value);
            Assert.Equal(2, dto.TotalTasks);
            Assert.Equal(1, dto.CompletedTasks);
            Assert.Equal(1, dto.InProgressTasks);
        }

        [Fact]
        public async Task GetTeamProgress_AdminUser_ReturnsOkWithProgressList()
        {
            // Arrange
            var user = new User { Id = "u1", Name = "Alice", Email = "alice@co.com" };
            await _context.Users.AddAsync(user);
            await _context.Tasks.AddAsync(new TaskItem { Id = 3, Title = "Task 3", AssignedUserId = "u1", Status = TaskStatusEnum.Completed });
            await _context.SaveChangesAsync();

            SetUserContext("admin-1", UserRoles.Administrator);

            // Act
            var result = await _controller.GetTeamProgress();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var list = Assert.IsAssignableFrom<System.Collections.IEnumerable>(okResult.Value);
            var count = 0;
            foreach (var item in list) count++;
            Assert.True(count >= 1);
        }

        [Fact]
        public async Task GetRecentActivity_AdminUser_ReturnsRecentLogs()
        {
            // Arrange
            var user = new User { Id = "u2", Name = "Bob", Email = "bob@co.com" };
            await _context.Users.AddAsync(user);
            var task = new TaskItem { Id = 4, Title = "Task 4", AssignedUserId = "u2", Status = TaskStatusEnum.InProgress, CreatedAt = DateTime.UtcNow };
            await _context.Tasks.AddAsync(task);
            await _context.TaskProgressEntries.AddAsync(new TaskProgressEntry { Id = 1, TaskId = 4, UserId = "u2", Description = "Update 1", CreatedAt = DateTime.UtcNow });
            await _context.SaveChangesAsync();

            SetUserContext("admin-1", UserRoles.Administrator);

            // Act
            var result = await _controller.GetRecentActivity();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var logs = Assert.IsAssignableFrom<System.Collections.IEnumerable>(okResult.Value);
            var count = 0;
            foreach (var item in logs) count++;
            Assert.True(count >= 1);
        }
    }
}
