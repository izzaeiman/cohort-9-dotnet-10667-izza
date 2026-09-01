using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Backend.Data;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Tests.Repositories
{
    public class ProjectRepositoryTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ProjectRepository _repository;

        public ProjectRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);
            _repository = new ProjectRepository(_context);

            // Seed user u1 so Include(p => p.LeadUser) succeeds in InMemory Database
            var user = new User { Id = "u1", Name = "User 1", Email = "u1@co.com", PasswordHash = "hash", Role = UserRoles.RegularUser };
            _context.Users.Add(user);
            _context.SaveChanges();
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllProjects()
        {
            // Arrange
            var project = new Project { Id = "p1", Name = "P1", LeadUserId = "u1" };
            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetAllAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
        }

        [Fact]
        public async Task GetByIdAsync_InvalidId_ReturnsNull()
        {
            // Act
            var result = await _repository.GetByIdAsync(null!);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetByIdAsync_ValidId_ReturnsProject()
        {
            // Arrange
            var project = new Project { Id = "p2", Name = "P2", LeadUserId = "u1" };
            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByIdAsync("p2");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("P2", result.Name);
        }

        [Fact]
        public async Task CreateAsync_Succeeds()
        {
            // Arrange
            var project = new Project { Name = "New P", LeadUserId = "u1" };

            // Act
            var result = await _repository.CreateAsync(project);

            // Assert
            Assert.NotNull(result.Id);
            var created = await _context.Projects.FindAsync(result.Id);
            Assert.NotNull(created);
        }

        [Fact]
        public async Task UpdateAsync_UpdatesProject()
        {
            // Arrange
            var project = new Project { Id = "p3", Name = "P3", LeadUserId = "u1" };
            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            // Act
            project.Name = "Updated Name";
            await _repository.UpdateAsync(project);

            // Assert
            var updated = await _context.Projects.FindAsync("p3");
            Assert.Equal("Updated Name", updated!.Name);
        }

        [Fact]
        public async Task DeleteAsync_ProjectExists_Deletes()
        {
            // Arrange
            var project = new Project { Id = "p4", Name = "P4", LeadUserId = "u1" };
            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            // Act
            await _repository.DeleteAsync("p4");

            // Assert
            var deleted = await _context.Projects.FindAsync("p4");
            Assert.Null(deleted);
        }
    }
}
