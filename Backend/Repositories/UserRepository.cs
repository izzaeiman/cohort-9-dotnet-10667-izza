using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        /// <summary>
        /// Finds a user by email. Incoming email must already be normalized (trimmed + lowercase)
        /// before calling this method. Emails are stored normalized so no column-side ToLower() is needed.
        /// </summary>
        public async Task<User?> GetByEmailAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return null;

            // Finding #6: normalize incoming value; compare against the already-normalized stored value
            // directly rather than calling ToLower() on the DB column (which may prevent index usage).
            var normalizedEmail = email.Trim().ToLowerInvariant();
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        }

        public async Task<User?> GetByIdAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            return await _context.Users.FindAsync(id);
        }

        /// <summary>
        /// Checks whether a user with the given email already exists.
        /// Incoming email must already be normalized.
        /// </summary>
        public async Task<bool> ExistsByEmailAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;

            // Finding #6: compare stored normalized email directly
            var normalizedEmail = email.Trim().ToLowerInvariant();
            return await _context.Users
                .AnyAsync(u => u.Email == normalizedEmail);
        }

        /// <summary>
        /// Persists a new User entity. Translates a unique-email DB constraint violation
        /// into an application-level InvalidOperationException (Finding #7).
        /// All other DB failures are re-thrown unchanged.
        /// </summary>
        public async Task<User> CreateAsync(User user)
        {
            if (user == null) throw new ArgumentNullException(nameof(user));

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
                // Finding #7: translate only duplicate-email unique constraint violations.
                // SQL Server unique constraint violation error number is 2627 or 2601.
                if (ex.InnerException is SqlException sqlEx &&
                    (sqlEx.Number == 2627 || sqlEx.Number == 2601))
                {
                    throw new InvalidOperationException("User with this email already exists.", ex);
                }

                // Re-throw all other DB failures unchanged
                throw;
            }

            return user;
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _context.Users.ToListAsync();
        }
    }
}
