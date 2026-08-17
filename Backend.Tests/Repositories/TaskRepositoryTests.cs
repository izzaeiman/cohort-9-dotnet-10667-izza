using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Tests.Repositories
{
    public class TaskRepositoryTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly TaskRepository _repository;

        public TaskRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _repository = new TaskRepository(_context);

            SeedData();
        }

        private void SeedData()
        {
            var user1 = new User { Id = "usr-1", Name = "User 1", Email = "user1@example.com", PasswordHash = "hash" };
            var user2 = new User { Id = "usr-2", Name = "User 2", Email = "user2@example.com", PasswordHash = "hash" };

            _context.Users.AddRange(user1, user2);
            _context.SaveChanges();

            _context.Tasks.AddRange(
                new TaskItem { Id = 1, Title = "Task A Alpha", Description = "Alpha Desc", Status = TaskStatusEnum.Pending, Priority = TaskPriorityEnum.High, Category = "Frontend", AssignedUserId = "usr-1", DueDate = new DateTime(2025, 1, 1), CreatedAt = new DateTime(2025, 1, 1) },
                new TaskItem { Id = 2, Title = "Task B Beta", Description = "Beta Desc", Status = TaskStatusEnum.InProgress, Priority = TaskPriorityEnum.Medium, Category = "Backend", AssignedUserId = "usr-1", DueDate = new DateTime(2025, 2, 1), CreatedAt = new DateTime(2025, 1, 2) },
                new TaskItem { Id = 3, Title = "Task C Alpha", Description = "Gamma Desc", Status = TaskStatusEnum.Completed, Priority = TaskPriorityEnum.Low, Category = "DevOps", AssignedUserId = "usr-2", DueDate = new DateTime(2025, 3, 1), CreatedAt = new DateTime(2025, 1, 3) }
            );

            _context.SaveChanges();
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Fact]
        public async Task GetAllAsync_NoFilters_ReturnsAllTasks()
        {
            var query = new TaskQueryDto();
            var results = await _repository.GetAllAsync(query);
            Assert.Equal(3, results.Count());
        }

        [Fact]
        public async Task GetAllAsync_SearchFilter_ReturnsMatchingTasks()
        {
            var query = new TaskQueryDto { Search = "Alpha" };
            var results = await _repository.GetAllAsync(query);
            Assert.Equal(2, results.Count()); // Task 1 and 3
        }

        [Fact]
        public async Task GetAllAsync_StatusFilter_ReturnsMatchingTasks()
        {
            var query = new TaskQueryDto { Status = TaskStatusEnum.InProgress };
            var results = await _repository.GetAllAsync(query);
            Assert.Single(results);
            Assert.Equal(2, results.First().Id);
        }

        [Fact]
        public async Task GetAllAsync_PriorityFilter_ReturnsMatchingTasks()
        {
            var query = new TaskQueryDto { Priority = TaskPriorityEnum.High };
            var results = await _repository.GetAllAsync(query);
            Assert.Single(results);
            Assert.Equal(1, results.First().Id);
        }

        [Fact]
        public async Task GetAllAsync_CategoryFilter_ReturnsMatchingTasks()
        {
            var query = new TaskQueryDto { Category = "Backend" };
            var results = await _repository.GetAllAsync(query);
            Assert.Single(results);
            Assert.Equal(2, results.First().Id);
        }

        [Fact]
        public async Task GetAllAsync_AssignedUserIdFilter_ReturnsMatchingTasks()
        {
            var query = new TaskQueryDto { AssignedUserId = "usr-2" };
            var results = await _repository.GetAllAsync(query);
            Assert.Single(results);
            Assert.Equal(3, results.First().Id);
        }

        [Fact]
        public async Task GetAllAsync_DueDateFilters_ReturnsMatchingTasks()
        {
            var query = new TaskQueryDto 
            { 
                DueDateFrom = new DateTime(2025, 1, 15),
                DueDateTo = new DateTime(2025, 2, 15) 
            };
            var results = await _repository.GetAllAsync(query);
            Assert.Single(results);
            Assert.Equal(2, results.First().Id); // Only Task 2 is between Jan 15 and Feb 15
        }

        [Fact]
        public async Task GetAllAsync_CombinedFilters_ReturnsMatchingTasks()
        {
            var query = new TaskQueryDto { Search = "Alpha", AssignedUserId = "usr-1" };
            var results = await _repository.GetAllAsync(query);
            Assert.Single(results);
            Assert.Equal(1, results.First().Id);
        }

        [Fact]
        public async Task GetByAssignedUserIdAsync_SearchFilter_ReturnsOnlyOwnMatchingTasks()
        {
            var query = new TaskQueryDto { Search = "Alpha" };
            var results = await _repository.GetByAssignedUserIdAsync("usr-1", query);
            Assert.Single(results);
            Assert.Equal(1, results.First().Id); // Task 3 matches search but is owned by usr-2
        }

        [Fact]
        public async Task GetByAssignedUserIdAsync_OverridesAssignedUserIdFilter()
        {
            var query = new TaskQueryDto { AssignedUserId = "usr-2" };
            var results = await _repository.GetByAssignedUserIdAsync("usr-1", query);
            Assert.Empty(results); // The query asks for usr-2, but the boundary is usr-1, so intersection is empty
        }
    }
}
