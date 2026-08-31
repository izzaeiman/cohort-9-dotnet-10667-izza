using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Backend.Data;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Tests.Repositories
{
    public class RefreshTokenRepositoryTests
    {
        private readonly ApplicationDbContext _context;
        private readonly RefreshTokenRepository _repository;

        public RefreshTokenRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);
            _repository = new RefreshTokenRepository(_context);
        }

        [Fact]
        public async Task GetByTokenHashAsync_TokenFound_ReturnsToken()
        {
            // Arrange
            var token = new RefreshToken { Id = 1, TokenHash = "hash1", UserId = "u1", ExpiresAt = DateTimeOffset.UtcNow.AddDays(7), IsRevoked = false };
            await _context.RefreshTokens.AddAsync(token);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByTokenHashAsync("hash1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("u1", result.UserId);
        }

        [Fact]
        public async Task GetByTokenHashAsync_TokenRevoked_ReturnsNull()
        {
            // Arrange
            var token = new RefreshToken { Id = 2, TokenHash = "hash2", UserId = "u1", ExpiresAt = DateTimeOffset.UtcNow.AddDays(7), IsRevoked = true };
            await _context.RefreshTokens.AddAsync(token);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByTokenHashAsync("hash2");

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CreateAsync_Succeeds()
        {
            // Arrange
            var token = new RefreshToken { Id = 3, TokenHash = "hash3", UserId = "u1", ExpiresAt = DateTimeOffset.UtcNow.AddDays(7) };

            // Act
            var result = await _repository.CreateAsync(token);

            // Assert
            var created = await _context.RefreshTokens.FindAsync(3);
            Assert.NotNull(created);
        }

        [Fact]
        public async Task RevokeAsync_Succeeds()
        {
            // Arrange
            var token = new RefreshToken { Id = 4, TokenHash = "hash4", UserId = "u1", ExpiresAt = DateTimeOffset.UtcNow.AddDays(7), IsRevoked = false };
            await _context.RefreshTokens.AddAsync(token);
            await _context.SaveChangesAsync();

            // Act
            await _repository.RevokeAsync(token);

            // Assert
            var updated = await _context.RefreshTokens.FindAsync(4);
            Assert.True(updated!.IsRevoked);
        }

        [Fact]
        public async Task RevokeAllForUserAsync_RevokesActiveTokens()
        {
            // Arrange
            var t1 = new RefreshToken { Id = 5, TokenHash = "hash5", UserId = "u2", ExpiresAt = DateTimeOffset.UtcNow.AddDays(7), IsRevoked = false };
            var t2 = new RefreshToken { Id = 6, TokenHash = "hash6", UserId = "u2", ExpiresAt = DateTimeOffset.UtcNow.AddDays(7), IsRevoked = false };
            await _context.RefreshTokens.AddRangeAsync(t1, t2);
            await _context.SaveChangesAsync();

            // Act
            await _repository.RevokeAllForUserAsync("u2");

            // Assert
            var tokens = await _context.RefreshTokens.Where(r => r.UserId == "u2").ToListAsync();
            Assert.All(tokens, t => Assert.True(t.IsRevoked));
        }
    }
}
