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
using Backend.Services;

namespace Backend.Tests.Controllers
{
    public class ProjectsControllerTests
    {
        private readonly Mock<IProjectService> _projectServiceMock;
        private readonly ProjectsController _controller;

        public ProjectsControllerTests()
        {
            _projectServiceMock = new Mock<IProjectService>();
            _controller = new ProjectsController(_projectServiceMock.Object);
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
        public async Task GetProjects_ReturnsOk_WithProjects()
        {
            // Arrange
            var projects = new List<ProjectDto>
            {
                new ProjectDto { Id = "p1", Name = "Proj 1" }
            };
            _projectServiceMock.Setup(s => s.GetAllProjectsAsync()).ReturnsAsync(projects);

            // Act
            var result = await _controller.GetProjects();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(projects, okResult.Value);
        }

        [Fact]
        public async Task GetProject_ProjectFound_ReturnsOk()
        {
            // Arrange
            var project = new ProjectDto { Id = "p1", Name = "Proj 1" };
            _projectServiceMock.Setup(s => s.GetProjectByIdAsync("p1")).ReturnsAsync(project);

            // Act
            var result = await _controller.GetProject("p1");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(project, okResult.Value);
        }

        [Fact]
        public async Task GetProject_ProjectNotFound_ReturnsNotFound()
        {
            // Arrange
            _projectServiceMock.Setup(s => s.GetProjectByIdAsync("p2")).ReturnsAsync((ProjectDto?)null);

            // Act
            var result = await _controller.GetProject("p2");

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task CreateProject_ValidUser_ReturnsCreated()
        {
            // Arrange
            SetUserContext("usr-1");
            var createDto = new CreateProjectDto { Name = "New P" };
            var project = new ProjectDto { Id = "p10", Name = "New P" };
            _projectServiceMock.Setup(s => s.CreateProjectAsync(createDto, "usr-1")).ReturnsAsync(project);

            // Act
            var result = await _controller.CreateProject(createDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            Assert.Equal(nameof(ProjectsController.GetProject), createdResult.ActionName);
            Assert.Equal("p10", createdResult.RouteValues!["id"]);
        }

        [Fact]
        public async Task UpdateProject_Success_ReturnsNoContent()
        {
            // Arrange
            SetUserContext("usr-1");
            var updateDto = new CreateProjectDto { Name = "Updated P" };

            // Act
            var result = await _controller.UpdateProject("p1", updateDto);

            // Assert
            Assert.IsType<NoContentResult>(result);
            _projectServiceMock.Verify(s => s.UpdateProjectAsync("p1", updateDto, "usr-1"), Times.Once);
        }

        [Fact]
        public async Task UpdateProject_NotFound_ReturnsNotFound()
        {
            // Arrange
            SetUserContext("usr-1");
            var updateDto = new CreateProjectDto { Name = "Updated P" };
            _projectServiceMock.Setup(s => s.UpdateProjectAsync("p1", updateDto, "usr-1"))
                .ThrowsAsync(new KeyNotFoundException());

            // Act
            var result = await _controller.UpdateProject("p1", updateDto);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteProject_Success_ReturnsNoContent()
        {
            // Arrange
            SetUserContext("usr-1");

            // Act
            var result = await _controller.DeleteProject("p1");

            // Assert
            Assert.IsType<NoContentResult>(result);
            _projectServiceMock.Verify(s => s.DeleteProjectAsync("p1", "usr-1"), Times.Once);
        }
    }
}
