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

            _taskRepositoryMock.Setup(r => r.GetAllAsync(It.IsAny<TaskQueryDto>())).ReturnsAsync(allTasks);

            // Act
            var query = new TaskQueryDto();
            var results = await _taskService.GetTasksAsync("usr-admin", UserRoles.Administrator, query);

            // Assert
            Assert.NotNull(results);
            Assert.Equal(2, results.Count());
            _taskRepositoryMock.Verify(r => r.GetAllAsync(It.IsAny<TaskQueryDto>()), Times.Once);
        }

        [Fact]
        public async Task Test8_CreateTaskAsync_InvalidAssignedUser_IsRejected()
        {
            // Arrange — Administrator tries to assign to non-existent user
            var dto = new TaskInputDto
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

            var updateDto = new TaskInputDto
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
            var dto = new TaskInputDto
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

            var updateDto = new TaskInputDto { Title = "Hacked Title", AssignedUserId = "usr-other" };

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

            var updateDto = new TaskInputDto
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
            var dto = new TaskInputDto
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
            var dto = new TaskInputDto { Title = null!, AssignedUserId = null };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-regular", UserRoles.RegularUser));

            Assert.Contains("title", ex.Message, StringComparison.OrdinalIgnoreCase);
            _userRepositoryMock.Verify(r => r.GetByIdAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Test17_CreateTaskAsync_EmptyTitle_ThrowsArgumentException()
        {
            // Finding #4: empty title rejected
            var dto = new TaskInputDto { Title = string.Empty };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-regular", UserRoles.RegularUser));

            Assert.Contains("title", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test18_CreateTaskAsync_WhitespaceTitle_ThrowsArgumentException()
        {
            // Finding #4: whitespace-only title rejected
            var dto = new TaskInputDto { Title = "   " };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-regular", UserRoles.RegularUser));

            Assert.Contains("title", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test19_CreateTaskAsync_ValidTitleWithWhitespace_TrimsAndSucceeds()
        {
            // Finding #4: valid title with surrounding whitespace is trimmed
            var dto = new TaskInputDto { Title = "  My Task  " };
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
            var dto = new TaskInputDto { Title = "   " };

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
            var dto = new TaskInputDto { Title = "Task", AssignedUserId = "usr-other" };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-regular", UserRoles.RegularUser));

            Assert.Equal("Regular users cannot assign tasks to other users.", ex.Message);
            _userRepositoryMock.Verify(r => r.GetByIdAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Test22_UpdateTaskAsync_EmptyAssignedUserId_RetainsExistingAssignee()
        {
            // Arrange
            var existingTask = new TaskItem
            {
                Id = 10,
                Title = "Original Title",
                AssignedUserId = "usr-regular"
            };

            _taskRepositoryMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(existingTask);
            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-regular")).ReturnsAsync(new User { Id = "usr-regular", Name = "Regular" });
            _taskRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<TaskItem>())).ReturnsAsync((TaskItem t) => t);

            var updateDto = new TaskInputDto
            {
                Title = "Updated Title",
                AssignedUserId = string.Empty
            };

            // Act
            var result = await _taskService.UpdateTaskAsync(10, updateDto, "usr-regular", UserRoles.RegularUser);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("usr-regular", result.AssignedUserId); // Stays regular, not overwritten by empty
            _taskRepositoryMock.Verify(r => r.UpdateAsync(It.Is<TaskItem>(t => t.AssignedUserId == "usr-regular")), Times.Once);
        }

        [Fact]
        public async Task Test23_UpdateTaskAsync_WhitespaceAssignedUserId_RetainsExistingAssignee()
        {
            // Arrange
            var existingTask = new TaskItem
            {
                Id = 10,
                Title = "Original Title",
                AssignedUserId = "usr-regular"
            };

            _taskRepositoryMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(existingTask);
            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-regular")).ReturnsAsync(new User { Id = "usr-regular", Name = "Regular" });
            _taskRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<TaskItem>())).ReturnsAsync((TaskItem t) => t);

            var updateDto = new TaskInputDto
            {
                Title = "Updated Title",
                AssignedUserId = "   "
            };

            // Act
            var result = await _taskService.UpdateTaskAsync(10, updateDto, "usr-regular", UserRoles.RegularUser);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("usr-regular", result.AssignedUserId); // Stays regular, not overwritten by whitespace
            _taskRepositoryMock.Verify(r => r.UpdateAsync(It.Is<TaskItem>(t => t.AssignedUserId == "usr-regular")), Times.Once);
        }

        [Theory]
        [InlineData(null, "Regular User")]
        [InlineData("", "Regular User")]
        [InlineData("   ", "Regular User")]
        [InlineData("usr-1", null)]
        [InlineData("usr-1", "")]
        [InlineData("usr-1", "   ")]
        public async Task Test24_TaskService_PublicMethods_ValidateIdentity_ThrowArgumentException(string? currentUserId, string? currentUserRole)
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.GetTasksAsync(currentUserId!, currentUserRole!, new TaskQueryDto()));

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.GetTaskByIdAsync(1, currentUserId!, currentUserRole!));

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.CreateTaskAsync(new TaskInputDto { Title = "Task" }, currentUserId!, currentUserRole!));

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.UpdateTaskAsync(1, new TaskInputDto { Title = "Task" }, currentUserId!, currentUserRole!));

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.DeleteTaskAsync(1, currentUserId!, currentUserRole!));
        }

        [Fact]
        public async Task Test25_CreateTaskAsync_PastDueDate_ThrowsArgumentException()
        {
            var dto = new TaskInputDto
            {
                Title = "Task with Past Due Date",
                DueDate = DateTime.UtcNow.AddDays(-2)
            };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-regular", UserRoles.RegularUser));

            Assert.Contains("due date", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        // ── Batch 6 — Closing remaining TaskService coverage gaps ─────────────

        [Fact]
        public async Task Test26_GetTasksAsync_RegularUser_GetsAssignedTasks()
        {
            // Regular-user branch of GetTasksAsync: calls GetByAssignedUserIdAsync
            var tasks = new List<TaskItem> { new TaskItem { Id = 5, Title = "My Task", AssignedUserId = "usr-regular" } };
            _taskRepositoryMock.Setup(r => r.GetByAssignedUserIdAsync("usr-regular", It.IsAny<TaskQueryDto>())).ReturnsAsync(tasks);

            var result = await _taskService.GetTasksAsync("usr-regular", UserRoles.RegularUser, new TaskQueryDto());

            Assert.Single(result);
            Assert.Equal("My Task", result.First().Title);
        }

        [Fact]
        public async Task Test27_GetTasksAsync_Administrator_GetsAllTasks()
        {
            // Admin branch of GetTasksAsync: calls GetAllAsync
            var tasks = new List<TaskItem>
            {
                new TaskItem { Id = 1, Title = "Task A", AssignedUserId = "usr-1" },
                new TaskItem { Id = 2, Title = "Task B", AssignedUserId = "usr-2" }
            };
            _taskRepositoryMock.Setup(r => r.GetAllAsync(It.IsAny<TaskQueryDto>())).ReturnsAsync(tasks);

            var result = await _taskService.GetTasksAsync("admin-1", UserRoles.Administrator, new TaskQueryDto());

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task Test28_GetTaskByIdAsync_TaskNotFound_ReturnsNull()
        {
            _taskRepositoryMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((TaskItem?)null);
            var result = await _taskService.GetTaskByIdAsync(999, "usr-1", UserRoles.RegularUser);
            Assert.Null(result);
        }

        [Fact]
        public async Task Test29_CreateTaskAsync_NullDto_ThrowsArgumentNullException()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                _taskService.CreateTaskAsync(null!, "usr-1", UserRoles.RegularUser));
        }

        [Fact]
        public async Task Test30_CreateTaskAsync_EmptyTitle_ThrowsArgumentException()
        {
            var dto = new TaskInputDto { Title = "   " };
            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-1", UserRoles.RegularUser));
            Assert.Contains("title", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test31_CreateTaskAsync_RegularUser_AssignsToOtherUser_ThrowsUnauthorized()
        {
            // Regular user trying to assign task to another user
            var dto = new TaskInputDto { Title = "Task", AssignedUserId = "usr-other" };
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _taskService.CreateTaskAsync(dto, "usr-regular", UserRoles.RegularUser));
            Assert.Contains("assign", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test32_CreateTaskAsync_AssignedUserDoesNotExist_ThrowsArgumentException()
        {
            // Even admin: if assigned user doesn't exist in DB, throw
            var dto = new TaskInputDto { Title = "Task", AssignedUserId = "usr-nonexistent" };
            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-nonexistent")).ReturnsAsync((User?)null);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.CreateTaskAsync(dto, "admin-1", UserRoles.Administrator));
            Assert.Contains("does not exist", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test33_UpdateTaskAsync_NullDto_ThrowsArgumentNullException()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                _taskService.UpdateTaskAsync(1, null!, "usr-1", UserRoles.RegularUser));
        }

        [Fact]
        public async Task Test34_UpdateTaskAsync_EmptyTitle_ThrowsArgumentException()
        {
            var dto = new TaskInputDto { Title = "" };
            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.UpdateTaskAsync(1, dto, "usr-1", UserRoles.RegularUser));
            Assert.Contains("title", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test35_UpdateTaskAsync_TaskNotFound_ReturnsNull()
        {
            _taskRepositoryMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((TaskItem?)null);
            var result = await _taskService.UpdateTaskAsync(999, new TaskInputDto { Title = "T" }, "usr-1", UserRoles.RegularUser);
            Assert.Null(result);
        }

        [Fact]
        public async Task Test36_UpdateTaskAsync_RegularUser_UpdatesOtherUserTask_ThrowsUnauthorized()
        {
            var existing = new TaskItem { Id = 7, Title = "Task", AssignedUserId = "usr-other" };
            _taskRepositoryMock.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(existing);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _taskService.UpdateTaskAsync(7, new TaskInputDto { Title = "New" }, "usr-regular", UserRoles.RegularUser));
            Assert.Contains("permission", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test37_UpdateTaskAsync_AssignedUserDoesNotExist_ThrowsArgumentException()
        {
            var existing = new TaskItem { Id = 8, Title = "Task", AssignedUserId = "usr-1" };
            _taskRepositoryMock.Setup(r => r.GetByIdAsync(8)).ReturnsAsync(existing);
            _userRepositoryMock.Setup(r => r.GetByIdAsync("usr-ghost")).ReturnsAsync((User?)null);

            var dto = new TaskInputDto { Title = "Task", AssignedUserId = "usr-ghost" };
            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _taskService.UpdateTaskAsync(8, dto, "admin-1", UserRoles.Administrator));
            Assert.Contains("does not exist", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test38_UpdateTaskAsync_RegularUser_TriesToReassign_ThrowsUnauthorized()
        {
            // Regular user owns the task but tries to reassign it to someone else
            var existing = new TaskItem { Id = 9, Title = "Task", AssignedUserId = "usr-regular" };
            _taskRepositoryMock.Setup(r => r.GetByIdAsync(9)).ReturnsAsync(existing);

            var dto = new TaskInputDto { Title = "Task", AssignedUserId = "usr-other" };
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _taskService.UpdateTaskAsync(9, dto, "usr-regular", UserRoles.RegularUser));
            Assert.Contains("reassign", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test39_DeleteTaskAsync_TaskNotFound_ReturnsFalse()
        {
            _taskRepositoryMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((TaskItem?)null);
            var result = await _taskService.DeleteTaskAsync(999, "usr-1", UserRoles.RegularUser);
            Assert.False(result);
        }

        [Fact]
        public async Task Test40_DeleteTaskAsync_RegularUser_DeletesOtherUserTask_ThrowsUnauthorized()
        {
            var existing = new TaskItem { Id = 11, Title = "Task", AssignedUserId = "usr-other" };
            _taskRepositoryMock.Setup(r => r.GetByIdAsync(11)).ReturnsAsync(existing);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _taskService.DeleteTaskAsync(11, "usr-regular", UserRoles.RegularUser));
            Assert.Contains("permission", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test41_DeleteTaskAsync_AdminDeletesAnyTask_ReturnsTrue()
        {
            var existing = new TaskItem { Id = 12, Title = "Task", AssignedUserId = "usr-other" };
            _taskRepositoryMock.Setup(r => r.GetByIdAsync(12)).ReturnsAsync(existing);
            _taskRepositoryMock.Setup(r => r.DeleteAsync(12)).ReturnsAsync(true);

            var result = await _taskService.DeleteTaskAsync(12, "admin-1", UserRoles.Administrator);
            Assert.True(result);
        }

        [Fact]
        public async Task Test42_MapToTaskDto_NullNavigations_ReturnsNullNames()
        {
            // Task with no AssignedUser navigation and no Project navigation
            var task = new TaskItem
            {
                Id = 20,
                Title = "Orphan Task",
                AssignedUserId = "usr-1",
                AssignedUser = null,
                Project = null,
                Status = TaskStatusEnum.Pending,
                Priority = TaskPriorityEnum.Medium,
                Category = TaskCategoryEnum.General,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _taskRepositoryMock.Setup(r => r.GetByIdAsync(20)).ReturnsAsync(task);

            var result = await _taskService.GetTaskByIdAsync(20, "admin-1", UserRoles.Administrator);

            Assert.NotNull(result);
            Assert.Null(result!.AssignedUserName);
            Assert.Null(result.ProjectName);
        }
    }
}

