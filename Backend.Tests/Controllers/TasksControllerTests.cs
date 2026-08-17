using System;
using System.Collections.Generic;
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
    public class TasksControllerTests
    {
        private readonly Mock<ITaskService> _taskServiceMock;
        private readonly TasksController _controller;

        public TasksControllerTests()
        {
            _taskServiceMock = new Mock<ITaskService>();
            _controller = new TasksController(_taskServiceMock.Object);
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
        public async Task GetTasks_ReturnsOkResult_WithTasksList()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            var mockTasks = new List<TaskDto>
            {
                new TaskDto { Id = 1, Title = "Task A", AssignedUserId = "usr-1" }
            };

            _taskServiceMock.Setup(s => s.GetTasksAsync("usr-1", UserRoles.RegularUser)).ReturnsAsync(mockTasks);

            // Act
            var result = await _controller.GetTasks();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(mockTasks, okResult.Value);
        }

        [Fact]
        public async Task GetTaskById_TaskFound_ReturnsOkResult_WithTaskDto()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            var taskDto = new TaskDto { Id = 1, Title = "Task A", AssignedUserId = "usr-1" };

            _taskServiceMock.Setup(s => s.GetTaskByIdAsync(1, "usr-1", UserRoles.RegularUser)).ReturnsAsync(taskDto);

            // Act
            var result = await _controller.GetTaskById(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(taskDto, okResult.Value);
        }

        [Fact]
        public async Task GetTaskById_TaskNotFoundOrForbidden_ReturnsNotFound()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            _taskServiceMock.Setup(s => s.GetTaskByIdAsync(2, "usr-1", UserRoles.RegularUser)).ReturnsAsync((TaskDto?)null);

            // Act
            var result = await _controller.GetTaskById(2);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            dynamic response = notFoundResult.Value!;
            Assert.Equal("Task with ID 2 was not found or access is restricted.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task CreateTask_ValidDto_ReturnsCreatedResult_WithTaskDto()
        {
            // Arrange
            SetUserContext("usr-admin", UserRoles.Administrator);
            var createDto = new CreateTaskDto { Title = "New Task", AssignedUserId = "usr-1" };
            var taskDto = new TaskDto { Id = 10, Title = "New Task", AssignedUserId = "usr-1" };

            _taskServiceMock.Setup(s => s.CreateTaskAsync(createDto, "usr-admin", UserRoles.Administrator)).ReturnsAsync(taskDto);

            // Act
            var result = await _controller.CreateTask(createDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(nameof(TasksController.GetTaskById), createdResult.ActionName);
            Assert.Equal(10, createdResult.RouteValues!["id"]);
            Assert.Equal(taskDto, createdResult.Value);
        }

        [Fact]
        public async Task CreateTask_ArgumentException_ReturnsBadRequest_WithMessage()
        {
            // Arrange
            SetUserContext("usr-admin", UserRoles.Administrator);
            var createDto = new CreateTaskDto { Title = "", AssignedUserId = "usr-nonexistent" };

            _taskServiceMock.Setup(s => s.CreateTaskAsync(createDto, "usr-admin", UserRoles.Administrator))
                .ThrowsAsync(new ArgumentException("Assigned user with ID 'usr-nonexistent' does not exist."));

            // Act
            var result = await _controller.CreateTask(createDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            dynamic response = badRequestResult.Value!;
            Assert.Equal("Assigned user with ID 'usr-nonexistent' does not exist.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task CreateTask_UnauthorizedAccessException_ReturnsForbidden_WithMessage()
        {
            // Arrange
            SetUserContext("usr-regular", UserRoles.RegularUser);
            var createDto = new CreateTaskDto { Title = "Illegal Task", AssignedUserId = "usr-other" };

            _taskServiceMock.Setup(s => s.CreateTaskAsync(createDto, "usr-regular", UserRoles.RegularUser))
                .ThrowsAsync(new UnauthorizedAccessException("Regular users cannot assign tasks to other users."));

            // Act
            var result = await _controller.CreateTask(createDto);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
            dynamic response = objectResult.Value!;
            Assert.Equal("Regular users cannot assign tasks to other users.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task UpdateTask_TaskFound_ReturnsOkResult_WithTaskDto()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            var updateDto = new UpdateTaskDto { Title = "Updated Task" };
            var taskDto = new TaskDto { Id = 1, Title = "Updated Task", AssignedUserId = "usr-1" };

            _taskServiceMock.Setup(s => s.UpdateTaskAsync(1, updateDto, "usr-1", UserRoles.RegularUser)).ReturnsAsync(taskDto);

            // Act
            var result = await _controller.UpdateTask(1, updateDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(taskDto, okResult.Value);
        }

        [Fact]
        public async Task UpdateTask_TaskNotFound_ReturnsNotFound_WithMessage()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            var updateDto = new UpdateTaskDto { Title = "Updated Task" };

            _taskServiceMock.Setup(s => s.UpdateTaskAsync(2, updateDto, "usr-1", UserRoles.RegularUser)).ReturnsAsync((TaskDto?)null);

            // Act
            var result = await _controller.UpdateTask(2, updateDto);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            dynamic response = notFoundResult.Value!;
            Assert.Equal("Task with ID 2 was not found.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task UpdateTask_ArgumentException_ReturnsBadRequest_WithMessage()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            var updateDto = new UpdateTaskDto { Title = "Updated Task" };

            _taskServiceMock.Setup(s => s.UpdateTaskAsync(1, updateDto, "usr-1", UserRoles.RegularUser))
                .ThrowsAsync(new ArgumentException("Task must have a valid assignee."));

            // Act
            var result = await _controller.UpdateTask(1, updateDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            dynamic response = badRequestResult.Value!;
            Assert.Equal("Task must have a valid assignee.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task UpdateTask_UnauthorizedAccessException_ReturnsForbidden_WithMessage()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            var updateDto = new UpdateTaskDto { Title = "Updated Task" };

            _taskServiceMock.Setup(s => s.UpdateTaskAsync(1, updateDto, "usr-1", UserRoles.RegularUser))
                .ThrowsAsync(new UnauthorizedAccessException("You do not have permission to update this task."));

            // Act
            var result = await _controller.UpdateTask(1, updateDto);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
            dynamic response = objectResult.Value!;
            Assert.Equal("You do not have permission to update this task.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task DeleteTask_Success_ReturnsNoContent()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            _taskServiceMock.Setup(s => s.DeleteTaskAsync(1, "usr-1", UserRoles.RegularUser)).ReturnsAsync(true);

            // Act
            var result = await _controller.DeleteTask(1);

            // Assert
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteTask_TaskNotFound_ReturnsNotFound_WithMessage()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            _taskServiceMock.Setup(s => s.DeleteTaskAsync(2, "usr-1", UserRoles.RegularUser)).ReturnsAsync(false);

            // Act
            var result = await _controller.DeleteTask(2);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            dynamic response = notFoundResult.Value!;
            Assert.Equal("Task with ID 2 was not found.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task DeleteTask_UnauthorizedAccessException_ReturnsForbidden_WithMessage()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            _taskServiceMock.Setup(s => s.DeleteTaskAsync(1, "usr-1", UserRoles.RegularUser))
                .ThrowsAsync(new UnauthorizedAccessException("You do not have permission to delete this task."));

            // Act
            var result = await _controller.DeleteTask(1);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
            dynamic response = objectResult.Value!;
            Assert.Equal("You do not have permission to delete this task.", response.GetType().GetProperty("message").GetValue(response, null));
        }
    }
}
