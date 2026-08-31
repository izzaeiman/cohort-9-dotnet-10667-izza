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
using Backend.DTOs;
using Backend.Models;

namespace Backend.Tests.Controllers
{
    public class TaskProgressControllerTests
    {
        private readonly ApplicationDbContext _context;
        private readonly TaskProgressController _controller;

        public TaskProgressControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);
            _controller = new TaskProgressController(_context);

            // Seed users so that Include(p => p.User) queries succeed in InMemory DB
            var user1 = new User { Id = "user-1", Name = "User 1", Email = "user1@co.com", PasswordHash = "hash", Role = UserRoles.RegularUser };
            var user2 = new User { Id = "user-2", Name = "User 2", Email = "user2@co.com", PasswordHash = "hash", Role = UserRoles.RegularUser };
            _context.Users.AddRange(user1, user2);
            _context.SaveChanges();
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
        public async Task CreateProgressEntry_AssignedUser_ReturnsCreated()
        {
            // Arrange
            var task = new TaskItem { Id = 1, Title = "Test Task", AssignedUserId = "user-1", Category = TaskCategoryEnum.Backend, Priority = TaskPriorityEnum.High, Status = TaskStatusEnum.Pending };
            await _context.Tasks.AddAsync(task);
            await _context.SaveChangesAsync();

            SetUserContext("user-1", UserRoles.RegularUser);

            // Act
            var result = await _controller.CreateProgressEntry(1, new CreateTaskProgressDto { Description = "Finished initial draft" });

            // Assert
            var actionResult = Assert.IsType<CreatedAtActionResult>(result);
            var dto = Assert.IsType<TaskProgressDto>(actionResult.Value);
            Assert.Equal("Finished initial draft", dto.Description);
        }

        [Fact]
        public async Task CreateProgressEntry_UnassignedUser_ReturnsForbidden()
        {
            // Arrange
            var task = new TaskItem { Id = 2, Title = "Test Task 2", AssignedUserId = "user-1", Category = TaskCategoryEnum.Frontend, Priority = TaskPriorityEnum.Medium, Status = TaskStatusEnum.Pending };
            await _context.Tasks.AddAsync(task);
            await _context.SaveChangesAsync();

            SetUserContext("user-2", UserRoles.RegularUser);

            // Act
            var result = await _controller.CreateProgressEntry(2, new CreateTaskProgressDto { Description = "Unauthorized progress attempt" });

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task GetProgressEntries_TaskNotFound_ReturnsNotFound()
        {
            // Arrange
            SetUserContext("user-1", UserRoles.RegularUser);

            // Act
            var result = await _controller.GetProgressEntries(999);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task GetProgressEntries_UnassignedUser_ReturnsForbidden()
        {
            // Arrange
            var task = new TaskItem { Id = 10, Title = "Test Task 10", AssignedUserId = "user-1" };
            await _context.Tasks.AddAsync(task);
            await _context.SaveChangesAsync();

            SetUserContext("user-2", UserRoles.RegularUser);

            // Act
            var result = await _controller.GetProgressEntries(10);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task GetProgressEntries_AssignedUser_ReturnsOk()
        {
            // Arrange
            var task = new TaskItem { Id = 11, Title = "Test Task 11", AssignedUserId = "user-1" };
            await _context.Tasks.AddAsync(task);
            await _context.SaveChangesAsync();

            SetUserContext("user-1", UserRoles.RegularUser);

            // Act
            var result = await _controller.GetProgressEntries(11);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task UpdateProgressEntry_NotFound_ReturnsNotFound()
        {
            // Arrange
            SetUserContext("user-1", UserRoles.RegularUser);

            // Act
            var result = await _controller.UpdateProgressEntry(1, 999, new UpdateTaskProgressDto { Description = "Updated" });

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task UpdateProgressEntry_UnauthorisedUser_ReturnsForbidden()
        {
            // Arrange
            var task = new TaskItem { Title = "Test Task 12", AssignedUserId = "user-1", Category = TaskCategoryEnum.Backend, Priority = TaskPriorityEnum.High };
            await _context.Tasks.AddAsync(task);
            await _context.SaveChangesAsync();

            var entry = new TaskProgressEntry { TaskId = task.Id, UserId = "user-1", Description = "Progress" };
            await _context.TaskProgressEntries.AddAsync(entry);
            await _context.SaveChangesAsync();

            SetUserContext("user-2", UserRoles.RegularUser);

            // Act
            var result = await _controller.UpdateProgressEntry(task.Id, entry.Id, new UpdateTaskProgressDto { Description = "Updated" });

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task UpdateProgressEntry_AuthorisedUser_ReturnsOk()
        {
            // Arrange
            var task = new TaskItem { Title = "Test Task 13", AssignedUserId = "user-1", Category = TaskCategoryEnum.Backend, Priority = TaskPriorityEnum.High };
            await _context.Tasks.AddAsync(task);
            await _context.SaveChangesAsync();

            var entry = new TaskProgressEntry { TaskId = task.Id, UserId = "user-1", Description = "Progress" };
            await _context.TaskProgressEntries.AddAsync(entry);
            await _context.SaveChangesAsync();

            SetUserContext("user-1", UserRoles.RegularUser);

            // Act
            var result = await _controller.UpdateProgressEntry(task.Id, entry.Id, new UpdateTaskProgressDto { Description = "Updated Description" });

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<TaskProgressDto>(okResult.Value);
            Assert.Equal("Updated Description", dto.Description);
        }

        [Fact]
        public async Task DeleteProgressEntry_NotFound_ReturnsNotFound()
        {
            // Arrange
            SetUserContext("user-1", UserRoles.RegularUser);

            // Act
            var result = await _controller.DeleteProgressEntry(1, 999);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task DeleteProgressEntry_UnauthorisedUser_ReturnsForbidden()
        {
            // Arrange
            var task = new TaskItem { Title = "Test Task 14", AssignedUserId = "user-1", Category = TaskCategoryEnum.Backend, Priority = TaskPriorityEnum.High };
            await _context.Tasks.AddAsync(task);
            await _context.SaveChangesAsync();

            var entry = new TaskProgressEntry { TaskId = task.Id, UserId = "user-1", Description = "Progress" };
            await _context.TaskProgressEntries.AddAsync(entry);
            await _context.SaveChangesAsync();

            SetUserContext("user-2", UserRoles.RegularUser);

            // Act
            var result = await _controller.DeleteProgressEntry(task.Id, entry.Id);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task DeleteProgressEntry_AuthorisedUser_ReturnsOk()
        {
            // Arrange
            var task = new TaskItem { Title = "Test Task 15", AssignedUserId = "user-1", Category = TaskCategoryEnum.Backend, Priority = TaskPriorityEnum.High };
            await _context.Tasks.AddAsync(task);
            await _context.SaveChangesAsync();

            var entry = new TaskProgressEntry { TaskId = task.Id, UserId = "user-1", Description = "Progress" };
            await _context.TaskProgressEntries.AddAsync(entry);
            await _context.SaveChangesAsync();

            SetUserContext("user-1", UserRoles.RegularUser);

            // Act
            var result = await _controller.DeleteProgressEntry(task.Id, entry.Id);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }
    }
}
