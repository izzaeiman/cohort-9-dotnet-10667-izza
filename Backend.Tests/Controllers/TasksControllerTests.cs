using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        private readonly Backend.Data.ApplicationDbContext _context;
        private readonly TasksController _controller;

        public TasksControllerTests()
        {
            _taskServiceMock = new Mock<ITaskService>();
            var options = new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<Backend.Data.ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
                .Options;
            _context = new Backend.Data.ApplicationDbContext(options);
            _controller = new TasksController(_taskServiceMock.Object, _context);
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

            _taskServiceMock.Setup(s => s.GetTasksAsync("usr-1", UserRoles.RegularUser, It.IsAny<TaskQueryDto>())).ReturnsAsync(mockTasks);

            // Act
            var query = new TaskQueryDto();
            var result = await _controller.GetTasks(query);

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
            var createDto = new TaskInputDto { Title = "New Task", AssignedUserId = "usr-1" };
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
            var createDto = new TaskInputDto { Title = "", AssignedUserId = "usr-nonexistent" };

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
            var createDto = new TaskInputDto { Title = "Illegal Task", AssignedUserId = "usr-other" };

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
            var updateDto = new TaskInputDto { Title = "Updated Task" };
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
            var updateDto = new TaskInputDto { Title = "Updated Task" };

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
            var updateDto = new TaskInputDto { Title = "Updated Task" };

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
            var updateDto = new TaskInputDto { Title = "Updated Task" };

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

        [Fact]
        public void TaskInputDto_InvalidCategoryJson_ThrowsJsonException()
        {
            // Arrange
            var invalidJson = "{\"title\":\"Invalid Category Task\",\"category\":\"NotARealCategory\"}";
            var options = new System.Text.Json.JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
            };

            // Act & Assert
            Assert.Throws<System.Text.Json.JsonException>(() =>
                System.Text.Json.JsonSerializer.Deserialize<TaskInputDto>(invalidJson, options));
        }

        [Fact]
        public void TaskInputDto_ValidCategoryJson_DeserializesCorrectly()
        {
            // Arrange
            var validJson = "{\"title\":\"Valid Category Task\",\"category\":\"Frontend\"}";
            var options = new System.Text.Json.JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
            };

            // Act
            var dto = System.Text.Json.JsonSerializer.Deserialize<TaskInputDto>(validJson, options);

            // Assert
            Assert.NotNull(dto);
            Assert.Equal(TaskCategoryEnum.Frontend, dto.Category);
        }

        [Fact]
        public async Task ExportTasks_Success_ReturnsCsvFile()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            var mockTasks = new List<TaskDto>
            {
                new TaskDto { Id = 1, Title = "Task A", Description = "Desc A", Status = TaskStatusEnum.Pending, Priority = TaskPriorityEnum.Medium, Category = TaskCategoryEnum.Frontend, AssignedUserName = "User A", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
            };
            _taskServiceMock.Setup(s => s.GetTasksAsync("usr-1", UserRoles.RegularUser, It.IsAny<TaskQueryDto>())).ReturnsAsync(mockTasks);

            // Act
            var result = await _controller.ExportTasks("csv");

            // Assert
            var fileResult = Assert.IsType<FileContentResult>(result);
            Assert.Equal("text/csv", fileResult.ContentType);
            Assert.True(fileResult.FileContents.Length > 0);
        }

        [Fact]
        public async Task ImportTasks_NullFile_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.ImportTasks(null!);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task ImportTasks_ValidCsv_Succeeds()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            
            var csvContent = "Title,Description,Category,Priority,Status\nImported Task,This is a test,Frontend,High,Pending";
            var bytes = System.Text.Encoding.UTF8.GetBytes(csvContent);
            var stream = new System.IO.MemoryStream(bytes);
            var formFileMock = new Mock<IFormFile>();
            formFileMock.Setup(f => f.Length).Returns(bytes.Length);
            formFileMock.Setup(f => f.OpenReadStream()).Returns(stream);

            // Act
            var result = await _controller.ImportTasks(formFileMock.Object);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            dynamic response = okResult.Value!;
            Assert.Contains("Successfully imported 1 tasks.", response.GetType().GetProperty("message").GetValue(response, null));
        }

        [Fact]
        public async Task ImportTasks_InvalidCsv_ReturnsBadRequestWithErrors()
        {
            // Arrange
            SetUserContext("usr-1", UserRoles.RegularUser);
            
            var csvContent = "Title,Description,Category,Priority,Status\n,This has no title,Frontend,InvalidPriority,Pending";
            var bytes = System.Text.Encoding.UTF8.GetBytes(csvContent);
            var stream = new System.IO.MemoryStream(bytes);
            var formFileMock = new Mock<IFormFile>();
            formFileMock.Setup(f => f.Length).Returns(bytes.Length);
            formFileMock.Setup(f => f.OpenReadStream()).Returns(stream);

            // Act
            var result = await _controller.ImportTasks(formFileMock.Object);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        }

        // ── Batch 6 — closing the remaining 20 uncovered lines in TasksController ──

        [Fact]
        public async Task CreateTask_UnauthorizedAccessException_Returns403()
        {
            SetUserContext("usr-regular", UserRoles.RegularUser);
            _taskServiceMock
                .Setup(s => s.CreateTaskAsync(It.IsAny<TaskInputDto>(), "usr-regular", UserRoles.RegularUser))
                .ThrowsAsync(new UnauthorizedAccessException("Cannot assign to other user."));

            var result = await _controller.CreateTask(new TaskInputDto { Title = "T" });

            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(403, statusResult.StatusCode);
        }

        [Fact]
        public async Task CreateTask_ArgumentException_Returns400()
        {
            SetUserContext("usr-1", UserRoles.Administrator);
            _taskServiceMock
                .Setup(s => s.CreateTaskAsync(It.IsAny<TaskInputDto>(), "usr-1", UserRoles.Administrator))
                .ThrowsAsync(new ArgumentException("Assigned user does not exist."));

            var result = await _controller.CreateTask(new TaskInputDto { Title = "T" });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UpdateTask_ArgumentException_Returns400()
        {
            SetUserContext("usr-1", UserRoles.Administrator);
            _taskServiceMock
                .Setup(s => s.UpdateTaskAsync(5, It.IsAny<TaskInputDto>(), "usr-1", UserRoles.Administrator))
                .ThrowsAsync(new ArgumentException("Assigned user does not exist."));

            var result = await _controller.UpdateTask(5, new TaskInputDto { Title = "T" });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UpdateTask_UnauthorizedAccessException_Returns403()
        {
            SetUserContext("usr-regular", UserRoles.RegularUser);
            _taskServiceMock
                .Setup(s => s.UpdateTaskAsync(5, It.IsAny<TaskInputDto>(), "usr-regular", UserRoles.RegularUser))
                .ThrowsAsync(new UnauthorizedAccessException("No permission."));

            var result = await _controller.UpdateTask(5, new TaskInputDto { Title = "T" });

            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(403, statusResult.StatusCode);
        }

        [Fact]
        public async Task DeleteTask_UnauthorizedAccessException_Returns403()
        {
            SetUserContext("usr-regular", UserRoles.RegularUser);
            _taskServiceMock
                .Setup(s => s.DeleteTaskAsync(7, "usr-regular", UserRoles.RegularUser))
                .ThrowsAsync(new UnauthorizedAccessException("No permission."));

            var result = await _controller.DeleteTask(7);

            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(403, statusResult.StatusCode);
        }

        [Fact]
        public async Task ExportTasks_WithTasks_IncludesTasksInCsv()
        {
            SetUserContext("usr-1", UserRoles.Administrator);
            var mockTasks = new List<TaskDto>
            {
                new TaskDto
                {
                    Id = 1, Title = "Exported Task", Description = "Desc",
                    Status = TaskStatusEnum.Pending, Priority = TaskPriorityEnum.High,
                    Category = TaskCategoryEnum.Backend, AssignedUserName = "User A",
                    DueDate = new DateTime(2026, 12, 1, 0, 0, 0, DateTimeKind.Utc),
                    CreatedAt = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 8, 2, 0, 0, 0, DateTimeKind.Utc)
                }
            };
            _taskServiceMock.Setup(s => s.GetTasksAsync("usr-1", UserRoles.Administrator, It.IsAny<TaskQueryDto>())).ReturnsAsync(mockTasks);

            var result = await _controller.ExportTasks("csv");

            var fileResult = Assert.IsType<FileContentResult>(result);
            var content = System.Text.Encoding.UTF8.GetString(fileResult.FileContents);
            Assert.Contains("Exported Task", content);
            Assert.Contains("2026-12-01", content);
        }

        [Fact]
        public void Constructor_NullTaskService_ThrowsArgumentNullException()
        {
            Assert.Throws<ArgumentNullException>(() => new TasksController(null!, _context));
        }

        [Fact]
        public void Constructor_NullDbContext_ThrowsArgumentNullException()
        {
            Assert.Throws<ArgumentNullException>(() => new TasksController(_taskServiceMock.Object, null!));
        }

        [Fact]
        public async Task ImportTasks_NullFileArgument_ReturnsBadRequest()
        {
            SetUserContext("usr-1", UserRoles.Administrator);
            var result = await _controller.ImportTasks(null!);
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequest.Value);
        }

        [Fact]
        public async Task ImportTasks_EmptyFile_ReturnsBadRequest()
        {
            SetUserContext("usr-1", UserRoles.Administrator);
            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.Length).Returns(0);

            var result = await _controller.ImportTasks(mockFile.Object);
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequest.Value);
        }

        [Fact]
        public async Task ImportTasks_CsvWithValidationErrors_ReturnsBadRequestWithErrors()
        {
            SetUserContext("usr-1", UserRoles.Administrator);
            var csvContent = "Title,Description,Category,Priority,Status\n,Bad Desc,InvalidCategory,InvalidPriority,InvalidStatus";
            var bytes = System.Text.Encoding.UTF8.GetBytes(csvContent);
            var stream = new System.IO.MemoryStream(bytes);

            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.OpenReadStream()).Returns(stream);
            mockFile.Setup(f => f.Length).Returns(bytes.Length);

            var result = await _controller.ImportTasks(mockFile.Object);
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequest.Value);
        }

        [Fact]
        public async Task ImportTasks_ValidCsv_ImportsSuccessfully()
        {
            SetUserContext("usr-1", UserRoles.Administrator);
            var csvContent = "Title,Description,Category,Priority,Status\nValid Task,Valid Description,Backend,High,Pending";
            var bytes = System.Text.Encoding.UTF8.GetBytes(csvContent);
            var stream = new System.IO.MemoryStream(bytes);

            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.OpenReadStream()).Returns(stream);
            mockFile.Setup(f => f.Length).Returns(bytes.Length);

            var result = await _controller.ImportTasks(mockFile.Object);
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }
    }
}

