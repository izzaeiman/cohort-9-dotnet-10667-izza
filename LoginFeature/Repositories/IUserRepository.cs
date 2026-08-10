using System.Threading.Tasks;
using LoginFeature.Models;

namespace LoginFeature.Repositories
{
    /// <summary>
    /// Repository abstraction for user persistence operations.
    /// Full EF Core SQL Server implementation will be attached in Day 2 database layer.
    /// </summary>
    public interface IUserRepository
    {
        /// <summary>
        /// Retrieves a user entity by email address.
        /// </summary>
        Task<User?> GetByEmailAsync(string email);
    }
}
