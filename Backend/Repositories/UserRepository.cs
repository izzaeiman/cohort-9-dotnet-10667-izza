using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Linq;

namespace Backend.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return null;

            var normalizedEmail = email.Trim().ToLowerInvariant();
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        }

        public async Task<User?> GetByIdAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            return await _context.Users.FindAsync(id);
        }

        public async Task<bool> ExistsByEmailAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;

            var normalizedEmail = email.Trim().ToLowerInvariant();
            return await _context.Users
                .AnyAsync(u => u.Email == normalizedEmail);
        }

        public async Task<User> CreateAsync(User user)
        {
            ArgumentNullException.ThrowIfNull(user);

            if (string.IsNullOrWhiteSpace(user.Id))
            {
                user.Id = Guid.NewGuid().ToString();
            }

            await _context.Users.AddAsync(user);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                if (ex.InnerException is SqlException sqlEx &&
                    (sqlEx.Number == 2627 || sqlEx.Number == 2601))
                {
                    throw new InvalidOperationException("User with this email already exists.", ex);
                }

                throw;
            }

            return user;
        }

        public async Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<User>> GetAllAsync(string? search = null)
        {
            var query = _context.Users.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = $"%{search}%";
                query = query.Where(u => 
                    EF.Functions.Like(u.Name, searchTerm) || 
                    EF.Functions.Like(u.Email, searchTerm));
            }

            return await query.ToListAsync();
        }
    }
}
