using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;
using Backend.Services;

namespace Backend.Tests.Services
{
    public class TaskServiceTests
    {
        private readonly Mock<ITaskRepository> _taskRepositoryMock;
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly TaskService _taskService;

        public TaskServiceTests()
        {
            _taskRepositoryMock = new Mock<ITaskRepository>();
            _userRepositoryMock = new Mock<IUserRepository>();
            var logger = NullLogger<TaskService>.Instance;

            _taskService = new TaskService(
                _taskRepositoryMock.Object,
                _userRepositoryMock.Object,
                logger
            );
        }

        // ── Existing tests ────────────────────────────────────────────────────

        [Fact]
        public async Task Test5_GetTaskByIdAsync_RegularUser_AccessesOwnTask()
        {
            // Arrange
            var task = new TaskItem
            {
                Id = 1,
                Title = "User Task",
                AssignedUserId = "usr-regular"
            };

            _taskRepositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);

            // Act
            var result = await _taskService.GetTaskByIdAsync(1, "usr-regular", UserRoles.RegularUser);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.Id);
            Assert.Equal("User Task", result.Title);
        }

        [Fact]
        public async Task Test6_GetTaskByIdAsync_RegularUser_CannotAccessOtherUserTask()
        {
            // Arrange
            var task = new TaskItem
            {
                Id = 2,
                Title = "Other User Task",
                AssignedUserId = "usr-other"
            };

            _taskRepositoryMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(task);

            // Act
            var result = await _taskService.GetTaskByIdAsync(2, "usr-regular", UserRoles.RegularUser);

            // Assert
            Assert.Null(result); // Forbidden task access returns null to prevent data leakage
        }

        [Fact]
        public async Task Test7_GetTasksAsync_Administrator_AccessesAllTasks()
        {
            // Arrange
            var allTasks = new List<TaskItem>
            {
                new TaskItem { Id = 1, Title = "Task A", AssignedUserId = "usr-1" },
                new TaskItem { Id = 2, Title = "Task B", AssignedUserId = "usr-2" }
            };

            _taskRepositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(allTasks);

            // Act
            var results = await _taskService.GetTasksAsync("usr-admin", UserRoles.Administrator);

            // Assert
            Assert.NotNull(results);
            Assert.Equal(2, results.Count());
            _taskRepositoryMock.Verify(r => r.GetAllAsync(), Times.Once);
        }

        [Fact]
        public async Task Test8_CreateTaskAsync_InvalidAssignedUser_IsRejected()
        {
            // Arrange — Administrator tries to assign to non-existent user
            var dto = new CreateTaskDto
            {
                Title = "New Task",
                AssignedUserId = "usr-nonexistent"
            };

            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-nonexistent")).ReturnsAsync((User?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-admin", UserRoles.Administrator));

            Assert.Contains("Assigned user with ID 'usr-nonexistent' does not exist.", exception.Message);
        }

        [Fact]
        public async Task Test9_UpdateTaskAsync_UpdatesUpdatedAtTimestamp()
        {
            // Arrange
            var originalTime = DateTime.UtcNow.AddHours(-2);
            var existingTask = new TaskItem
            {
                Id = 10,
                Title = "Original Title",
                AssignedUserId = "usr-regular",
                CreatedAt = originalTime,
                UpdatedAt = originalTime
            };

            var updateDto = new UpdateTaskDto
            {
                Title = "Updated Title",
                Status = TaskStatusEnum.InProgress,
                Priority = TaskPriorityEnum.High,
                AssignedUserId = "usr-regular"
            };

            _taskRepositoryMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(existingTask);
            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-regular")).ReturnsAsync(new User { Id = "usr-regular", Name = "User" });
            _taskRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<TaskItem>()))
                .ReturnsAsync((TaskItem t) => t);

            // Act
            var result = await _taskService.UpdateTaskAsync(10, updateDto, "usr-regular", UserRoles.RegularUser);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Updated Title", result.Title);
            Assert.True(result.UpdatedAt > originalTime);
        }

        [Fact]
        public async Task Test10_DeleteTaskAsync_AuthorizedTask_Succeeds()
        {
            // Arrange
            var existingTask = new TaskItem
            {
                Id = 15,
                Title = "Task To Delete",
                AssignedUserId = "usr-regular"
            };

            _taskRepositoryMock.Setup(r => r.GetByIdAsync(15)).ReturnsAsync(existingTask);
            _taskRepositoryMock.Setup(r => r.DeleteAsync(15)).ReturnsAsync(true);

            // Act
            var result = await _taskService.DeleteTaskAsync(15, "usr-regular", UserRoles.RegularUser);

            // Assert
            Assert.True(result);
            _taskRepositoryMock.Verify(r => r.DeleteAsync(15), Times.Once);
        }

        [Fact]
        public async Task Test11_CreateTaskAsync_RegularUser_AssigningOtherUser_ThrowsUnauthorized()
        {
            // Arrange — Finding #5: authorization check runs BEFORE user lookup,
            // so no GetByIdAsync mock setup is needed here.
            var dto = new CreateTaskDto
            {
                Title = "Illegal Assignment",
                AssignedUserId = "usr-other"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-regular", UserRoles.RegularUser));

            Assert.Equal("Regular users cannot assign tasks to other users.", exception.Message);

            // Verify: authorization check short-circuits before the DB user lookup
            _userRepositoryMock.Verify(r => r.GetByIdAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Test12_UpdateTaskAsync_RegularUser_UpdatingOtherUserTask_ThrowsUnauthorized()
        {
            // Arrange
            var existingTask = new TaskItem
            {
                Id = 20,
                Title = "Other's Task",
                AssignedUserId = "usr-other"
            };

            var updateDto = new UpdateTaskDto { Title = "Hacked Title", AssignedUserId = "usr-other" };

            _taskRepositoryMock.Setup(r => r.GetByIdAsync(20)).ReturnsAsync(existingTask);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _taskService.UpdateTaskAsync(20, updateDto, "usr-regular", UserRoles.RegularUser));

            Assert.Equal("You do not have permission to update this task.", exception.Message);
        }

        [Fact]
        public async Task Test13_DeleteTaskAsync_RegularUser_DeletingOtherUserTask_ThrowsUnauthorized()
        {
            // Arrange
            var existingTask = new TaskItem
            {
                Id = 25,
                Title = "Other's Task To Delete",
                AssignedUserId = "usr-other"
            };

            _taskRepositoryMock.Setup(r => r.GetByIdAsync(25)).ReturnsAsync(existingTask);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _taskService.DeleteTaskAsync(25, "usr-regular", UserRoles.RegularUser));

            Assert.Equal("You do not have permission to delete this task.", exception.Message);
        }

        [Fact]
        public async Task Test14_UpdateTaskAsync_Administrator_UpdatesOtherUserTask_Succeeds()
        {
            // Arrange
            var existingTask = new TaskItem
            {
                Id = 30,
                Title = "User Task",
                AssignedUserId = "usr-regular"
            };

            var updateDto = new UpdateTaskDto
            {
                Title = "Admin Override Title",
                AssignedUserId = "usr-regular"
            };

            _taskRepositoryMock.Setup(r => r.GetByIdAsync(30)).ReturnsAsync(existingTask);
            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-regular")).ReturnsAsync(new User { Id = "usr-regular", Name = "User" });
            _taskRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<TaskItem>())).ReturnsAsync((TaskItem t) => t);

            // Act
            var result = await _taskService.UpdateTaskAsync(30, updateDto, "usr-admin", UserRoles.Administrator);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Admin Override Title", result.Title);
        }

        [Fact]
        public async Task Test15_CreateTaskAsync_Administrator_AssignsToValidUser_Succeeds()
        {
            // Arrange
            var dto = new CreateTaskDto
            {
                Title = "Admin Assigned Task",
                AssignedUserId = "usr-engineer"
            };

            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-engineer")).ReturnsAsync(new User { Id = "usr-engineer", Name = "Engineer" });
            _taskRepositoryMock.Setup(r => r.CreateAsync(It.IsAny<TaskItem>())).ReturnsAsync((TaskItem t) => t);

            // Act
            var result = await _taskService.CreateTaskAsync(dto, "usr-admin", UserRoles.Administrator);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("usr-engineer", result.AssignedUserId);
        }

        // ── New tests (CodeRabbit findings #4, #5) ───────────────────────────

        [Fact]
        public async Task Test16_CreateTaskAsync_NullTitle_ThrowsArgumentException()
        {
            // Finding #4: null title rejected before any DB call
            var dto = new CreateTaskDto { Title = null!, AssignedUserId = null };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-regular", UserRoles.RegularUser));

            Assert.Contains("title", ex.Message, StringComparison.OrdinalIgnoreCase);
            _userRepositoryMock.Verify(r => r.GetByIdAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Test17_CreateTaskAsync_EmptyTitle_ThrowsArgumentException()
        {
            // Finding #4: empty title rejected
            var dto = new CreateTaskDto { Title = string.Empty };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-regular", UserRoles.RegularUser));

            Assert.Contains("title", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test18_CreateTaskAsync_WhitespaceTitle_ThrowsArgumentException()
        {
            // Finding #4: whitespace-only title rejected
            var dto = new CreateTaskDto { Title = "   " };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-regular", UserRoles.RegularUser));

            Assert.Contains("title", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test19_CreateTaskAsync_ValidTitleWithWhitespace_TrimsAndSucceeds()
        {
            // Finding #4: valid title with surrounding whitespace is trimmed
            var dto = new CreateTaskDto { Title = "  My Task  " };
            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-regular"))
                .ReturnsAsync(new User { Id = "usr-regular", Name = "Regular" });
            _taskRepositoryMock.Setup(r => r.CreateAsync(It.IsAny<TaskItem>()))
                .ReturnsAsync((TaskItem t) => t);

            var result = await _taskService.CreateTaskAsync(dto, "usr-regular", UserRoles.RegularUser);

            Assert.Equal("My Task", result.Title);
        }

        [Fact]
        public async Task Test20_UpdateTaskAsync_WhitespaceTitle_ThrowsArgumentException()
        {
            // Finding #4: whitespace-only title on update is rejected before DB call
            var dto = new UpdateTaskDto { Title = "   " };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.UpdateTaskAsync(1, dto, "usr-regular", UserRoles.RegularUser));

            Assert.Contains("title", ex.Message, StringComparison.OrdinalIgnoreCase);
            _taskRepositoryMock.Verify(r => r.GetByIdAsync(It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task Test21_CreateTaskAsync_RegularUser_AuthCheckBeforeDbLookup()
        {
            // Finding #5: for Regular User assigning another user, authorization check fires
            // BEFORE any DB lookup — GetByIdAsync should never be called.
            var dto = new CreateTaskDto { Title = "Task", AssignedUserId = "usr-other" };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-regular", UserRoles.RegularUser));

            Assert.Equal("Regular users cannot assign tasks to other users.", ex.Message);
            _userRepositoryMock.Verify(r => r.GetByIdAsync(It.IsAny<string>()), Times.Never);
        }
    }
}
