using System.Threading.Tasks;
using Backend.Models;

namespace Backend.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(string id);
        Task<bool> ExistsByEmailAsync(string email);
        Task<User> CreateAsync(User user);
    }
}
