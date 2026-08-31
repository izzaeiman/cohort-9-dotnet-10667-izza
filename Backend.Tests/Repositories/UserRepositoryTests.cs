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
    public class UserRepositoryTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly UserRepository _repository;

        public UserRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _repository = new UserRepository(_context);

            SeedData();
        }

        private void SeedData()
        {
            _context.Users.AddRange(new List<User>
            {
                new User
                {
                    Id = "usr-1",
                    Email = "admin@test.com",
                    Name = "Admin User",
                    PasswordHash = "hash1",
                    Role = "Administrator"
                },
                new User
                {
                    Id = "usr-2",
                    Email = "user@test.com",
                    Name = "Regular User",
                    PasswordHash = "hash2",
                    Role = "Regular User"
                }
            });
            _context.SaveChanges();
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Fact]
        public async Task GetByEmailAsync_ExistingEmail_ReturnsUser()
        {
            var user = await _repository.GetByEmailAsync("admin@test.com");
            
            Assert.NotNull(user);
            Assert.Equal("usr-1", user.Id);
            Assert.Equal("Admin User", user.Name);
        }

        [Fact]
        public async Task GetByEmailAsync_NonExistingEmail_ReturnsNull()
        {
            var user = await _repository.GetByEmailAsync("nonexistent@test.com");
            
            Assert.Null(user);
        }

        [Fact]
        public async Task ExistsByEmailAsync_ExistingEmail_ReturnsTrue()
        {
            var exists = await _repository.ExistsByEmailAsync("user@test.com");
            
            Assert.True(exists);
        }

        [Fact]
        public async Task ExistsByEmailAsync_NonExistingEmail_ReturnsFalse()
        {
            var exists = await _repository.ExistsByEmailAsync("nobody@test.com");
            
            Assert.False(exists);
        }

        [Fact]
        public async Task CreateAsync_ValidUser_AddsUserToDatabase()
        {
            var newUser = new User
            {
                Id = "usr-3",
                Email = "new@test.com",
                Name = "New User",
                PasswordHash = "hash3",
                Role = "Regular User"
            };

            await _repository.CreateAsync(newUser);
            
            var savedUser = await _context.Users.FindAsync("usr-3");
            Assert.NotNull(savedUser);
            Assert.Equal("new@test.com", savedUser.Email);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllUsers()
        {
            var users = await _repository.GetAllAsync();
            
            Assert.NotNull(users);
            Assert.Equal(2, users.Count());
            Assert.Contains(users, u => u.Id == "usr-1");
            Assert.Contains(users, u => u.Id == "usr-2");
        }

        [Fact]
        public async Task GetByIdAsync_ExistingId_ReturnsUser()
        {
            var result = await _repository.GetByIdAsync("usr-1");
            Assert.NotNull(result);
            Assert.Equal("Admin User", result.Name);
        }

        [Fact]
        public async Task GetByIdAsync_NonExistingId_ReturnsNull()
        {
            var result = await _repository.GetByIdAsync("nonexistent");
            Assert.Null(result);
        }

        [Fact]
        public async Task GetByIdAsync_NullId_ReturnsNull()
        {
            var result = await _repository.GetByIdAsync(null!);
            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateAsync_Succeeds()
        {
            var user = await _context.Users.FindAsync("usr-1");
            user!.Name = "Super Admin";
            await _repository.UpdateAsync(user);

            var updated = await _context.Users.FindAsync("usr-1");
            Assert.Equal("Super Admin", updated!.Name);
        }

        [Fact]
        public async Task GetAllAsync_WithSearchQuery_ReturnsMatching()
        {
            var results = await _repository.GetAllAsync("Admin");
            Assert.Single(results);
            Assert.Equal("usr-1", results.First().Id);
        }

        [Fact]
        public async Task GetByEmailAsync_NullOrEmpty_ReturnsNull()
        {
            var result = await _repository.GetByEmailAsync("");
            Assert.Null(result);
        }

        [Fact]
        public async Task ExistsByEmailAsync_NullOrEmpty_ReturnsFalse()
        {
            var result = await _repository.ExistsByEmailAsync("");
            Assert.False(result);
        }
    }
}
