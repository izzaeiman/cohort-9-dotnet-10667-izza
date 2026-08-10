using System.Threading.Tasks;
using LoginFeature.Models;

namespace LoginFeature.Repositories
{
    /// <summary>
    /// Abstract repository implementation for user resolution.
    /// Acts as the target adapter for EF Core ApplicationDbContext user persistence (Day 2).
    /// </summary>
    public class InMemoryUserRepository : IUserRepository
    {
        public Task<User?> GetByEmailAsync(string email)
        {
            // Note: EF Core DbContext SQL Server persistence attaches in Day 2 database layer.
            // Returns null when no user record exists in repository.
            return Task.FromResult<User?>(null);
        }
    }
}
