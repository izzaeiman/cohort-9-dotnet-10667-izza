using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Repositories
{
    public interface ITaskRepository
    {
        Task<IEnumerable<TaskItem>> GetAllAsync(TaskQueryDto query);
        Task<IEnumerable<TaskItem>> GetByAssignedUserIdAsync(string userId, TaskQueryDto query);
        Task<TaskItem?> GetByIdAsync(int id);
        Task<TaskItem> CreateAsync(TaskItem task);
        Task<TaskItem> UpdateAsync(TaskItem task);
        Task<bool> DeleteAsync(int id);
    }
}
