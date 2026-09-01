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
    public class ProjectProgressControllerTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ProjectProgressController _controller;

        public ProjectProgressControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);
            _controller = new ProjectProgressController(_context);
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
        public async Task CreateProgress_AdminMember_ReturnsCreated()
        {
            // Arrange
            var project = new Project { Id = "proj-1", Name = "Admin Proj", LeadUserId = "lead-1" };
            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            SetUserContext("admin-1", UserRoles.Administrator);

            // Act
            var result = await _controller.CreateProgress("proj-1", new CreateProjectProgressDto { Description = "Admin Update" });

            // Assert
            var actionResult = Assert.IsType<CreatedAtActionResult>(result);
            var dto = Assert.IsType<ProjectProgressDto>(actionResult.Value);
            Assert.Equal("Admin Update", dto.Description);
        }

        [Fact]
        public async Task CreateProgress_ProjectLead_ReturnsCreated()
        {
            // Arrange
            var project = new Project { Id = "proj-2", Name = "Lead Proj", LeadUserId = "lead-2" };
            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            SetUserContext("lead-2", UserRoles.RegularUser);

            // Act
            var result = await _controller.CreateProgress("proj-2", new CreateProjectProgressDto { Description = "Lead Update" });

            // Assert
            var actionResult = Assert.IsType<CreatedAtActionResult>(result);
            var dto = Assert.IsType<ProjectProgressDto>(actionResult.Value);
            Assert.Equal("Lead Update", dto.Description);
        }

        [Fact]
        public async Task CreateProgress_NonMember_ReturnsForbidden()
        {
            // Arrange
            var project = new Project { Id = "proj-3", Name = "Private Proj", LeadUserId = "lead-3" };
            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            SetUserContext("regular-user", UserRoles.RegularUser);

            // Act
            var result = await _controller.CreateProgress("proj-3", new CreateProjectProgressDto { Description = "Intruder Update" });

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task GetProgress_ProjectNotFound_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetProgress("nonexistent");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task GetProgress_ProjectFound_ReturnsOk()
        {
            // Arrange
            var project = new Project { Id = "proj-4", Name = "Found Proj", LeadUserId = "lead-4" };
            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetProgress("proj-4");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task CreateProgress_ProjectNotFound_ReturnsNotFound()
        {
            // Act
            var result = await _controller.CreateProgress("nonexistent", new CreateProjectProgressDto { Description = "Update" });

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task UpdateProgress_NotFound_ReturnsNotFound()
        {
            // Act
            var result = await _controller.UpdateProgress("proj-4", 999, new UpdateProjectProgressDto { Description = "Updated" });

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task UpdateProgress_Unauthorised_ReturnsForbidden()
        {
            // Arrange
            var project = new Project { Id = "proj-5", Name = "Proj 5", LeadUserId = "lead-5" };
            var entry = new ProjectProgressEntry { Id = 10, ProjectId = "proj-5", UserId = "user-1", Description = "Progress" };
            await _context.Projects.AddAsync(project);
            await _context.ProjectProgressEntries.AddAsync(entry);
            await _context.SaveChangesAsync();

            SetUserContext("user-2", UserRoles.RegularUser);

            // Act
            var result = await _controller.UpdateProgress("proj-5", 10, new UpdateProjectProgressDto { Description = "Updated" });

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task UpdateProgress_Authorised_ReturnsNoContent()
        {
            // Arrange
            var project = new Project { Id = "proj-6", Name = "Proj 6", LeadUserId = "lead-6" };
            var entry = new ProjectProgressEntry { Id = 11, ProjectId = "proj-6", UserId = "user-1", Description = "Progress" };
            await _context.Projects.AddAsync(project);
            await _context.ProjectProgressEntries.AddAsync(entry);
            await _context.SaveChangesAsync();

            SetUserContext("user-1", UserRoles.RegularUser);

            // Act
            var result = await _controller.UpdateProgress("proj-6", 11, new UpdateProjectProgressDto { Description = "Updated Description" });

            // Assert
            Assert.IsType<NoContentResult>(result);
            var updated = await _context.ProjectProgressEntries.FindAsync(11);
            Assert.Equal("Updated Description", updated!.Description);
        }

        [Fact]
        public async Task DeleteProgress_NotFound_ReturnsNotFound()
        {
            // Act
            var result = await _controller.DeleteProgress("proj-6", 999);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task DeleteProgress_Unauthorised_ReturnsForbidden()
        {
            // Arrange
            var project = new Project { Id = "proj-7", Name = "Proj 7", LeadUserId = "lead-7" };
            var entry = new ProjectProgressEntry { Id = 12, ProjectId = "proj-7", UserId = "user-1", Description = "Progress" };
            await _context.Projects.AddAsync(project);
            await _context.ProjectProgressEntries.AddAsync(entry);
            await _context.SaveChangesAsync();

            SetUserContext("user-2", UserRoles.RegularUser);

            // Act
            var result = await _controller.DeleteProgress("proj-7", 12);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task DeleteProgress_Authorised_ReturnsNoContent()
        {
            // Arrange
            var project = new Project { Id = "proj-8", Name = "Proj 8", LeadUserId = "lead-8" };
            var entry = new ProjectProgressEntry { Id = 13, ProjectId = "proj-8", UserId = "user-1", Description = "Progress" };
            await _context.Projects.AddAsync(project);
            await _context.ProjectProgressEntries.AddAsync(entry);
            await _context.SaveChangesAsync();

            SetUserContext("user-1", UserRoles.RegularUser);

            // Act
            var result = await _controller.DeleteProgress("proj-8", 13);

            // Assert
            Assert.IsType<NoContentResult>(result);
            var deleted = await _context.ProjectProgressEntries.FindAsync(13);
            Assert.Null(deleted);
        }
    }
}
