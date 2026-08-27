using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using LoginFeature.Models;

namespace LoginFeature.Repositories
{
    /// <summary>
    /// In-memory repository implementation for user resolution during development.
    /// </summary>
    public class InMemoryUserRepository : IUserRepository
    {
        private readonly List<User> _users;

        public InMemoryUserRepository()
        {
            var hasher = new PasswordHasher<User>();
            _users = new List<User>
            {
                new User
                {
                    Id = "usr-1",
                    Email = "izzaeiman@yahoo.com",
                    PasswordHash = hasher.HashPassword(null!, "Password123!")
                },
                new User
                {
                    Id = "usr-2",
                    Email = "izzaeiman@example.com",
                    PasswordHash = hasher.HashPassword(null!, "Password123!")
                },
                new User
                {
                    Id = "usr-3",
                    Email = "john.smith@example.com",
                    PasswordHash = hasher.HashPassword(null!, "Password123!")
                }
            };
        }

        public Task<User?> GetByEmailAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return Task.FromResult<User?>(null);
            }

            var user = _users.FirstOrDefault(u => string.Equals(u.Email, email.Trim(), StringComparison.OrdinalIgnoreCase));
            return Task.FromResult(user);
        }
    }
}
