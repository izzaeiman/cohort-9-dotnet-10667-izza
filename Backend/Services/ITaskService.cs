using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Services
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskDto>> GetTasksAsync(string currentUserId, string currentUserRole, TaskQueryDto query);
        Task<TaskDto?> GetTaskByIdAsync(int id, string currentUserId, string currentUserRole);
        Task<TaskDto> CreateTaskAsync(TaskInputDto dto, string currentUserId, string currentUserRole);
        Task<TaskDto?> UpdateTaskAsync(int id, TaskInputDto dto, string currentUserId, string currentUserRole);
        Task<bool> DeleteTaskAsync(int id, string currentUserId, string currentUserRole);
    }
}
