using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using Xunit;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;
using Backend.Services;

namespace Backend.Tests.Services
{
    public class ProjectServiceTests
    {
        private readonly Mock<IProjectRepository> _projectRepositoryMock;
        private readonly ProjectService _projectService;

        public ProjectServiceTests()
        {
            _projectRepositoryMock = new Mock<IProjectRepository>();
            _projectService = new ProjectService(_projectRepositoryMock.Object);
        }

        [Fact]
        public async Task GetAllProjectsAsync_ReturnsAllProjects()
        {
            // Arrange
            var projects = new List<Project>
            {
                new Project { Id = "p1", Name = "P1", LeadUserId = "u1" }
            };
            _projectRepositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(projects);

            // Act
            var result = await _projectService.GetAllProjectsAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal("p1", result.First().Id);
        }

        [Fact]
        public async Task GetProjectByIdAsync_ProjectFound_ReturnsDto()
        {
            // Arrange
            var project = new Project { Id = "p1", Name = "P1", LeadUserId = "u1" };
            _projectRepositoryMock.Setup(r => r.GetByIdAsync("p1")).ReturnsAsync(project);

            // Act
            var result = await _projectService.GetProjectByIdAsync("p1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("p1", result.Id);
        }

        [Fact]
        public async Task GetProjectByIdAsync_ProjectNotFound_ReturnsNull()
        {
            // Arrange
            _projectRepositoryMock.Setup(r => r.GetByIdAsync("p2")).ReturnsAsync((Project?)null);

            // Act
            var result = await _projectService.GetProjectByIdAsync("p2");

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CreateProjectAsync_Succeeds()
        {
            // Arrange
            var createDto = new CreateProjectDto { Name = "New P", Description = "Desc" };
            var project = new Project { Id = "p10", Name = "New P", Description = "Desc", LeadUserId = "u1" };
            _projectRepositoryMock.Setup(r => r.CreateAsync(It.IsAny<Project>())).ReturnsAsync(project);
            _projectRepositoryMock.Setup(r => r.GetByIdAsync("p10")).ReturnsAsync(project);

            // Act
            var result = await _projectService.CreateProjectAsync(createDto, "u1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("p10", result.Id);
        }

        [Fact]
        public async Task UpdateProjectAsync_ProjectFound_Updates()
        {
            // Arrange
            var project = new Project { Id = "p1", Name = "P1", LeadUserId = "u1" };
            _projectRepositoryMock.Setup(r => r.GetByIdAsync("p1")).ReturnsAsync(project);

            var updateDto = new CreateProjectDto { Name = "Updated Name", Description = "Updated Desc" };

            // Act
            await _projectService.UpdateProjectAsync("p1", updateDto, "u1");

            // Assert
            Assert.Equal("Updated Name", project.Name);
            _projectRepositoryMock.Verify(r => r.UpdateAsync(project), Times.Once);
        }

        [Fact]
        public async Task UpdateProjectAsync_ProjectNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            _projectRepositoryMock.Setup(r => r.GetByIdAsync("p99")).ReturnsAsync((Project?)null);
            var updateDto = new CreateProjectDto { Name = "Updated Name" };

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() => _projectService.UpdateProjectAsync("p99", updateDto, "u1"));
        }

        [Fact]
        public async Task DeleteProjectAsync_ProjectFound_Deletes()
        {
            // Arrange
            var project = new Project { Id = "p1", Name = "P1", LeadUserId = "u1" };
            _projectRepositoryMock.Setup(r => r.GetByIdAsync("p1")).ReturnsAsync(project);

            // Act
            await _projectService.DeleteProjectAsync("p1", "u1");

            // Assert
            _projectRepositoryMock.Verify(r => r.DeleteAsync("p1"), Times.Once);
        }
    }
}
