using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public class TaskService : ITaskService
    {
        private readonly ITaskRepository _taskRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<TaskService> _logger;

        public TaskService(
            ITaskRepository taskRepository,
            IUserRepository userRepository,
            ILogger<TaskService> logger)
        {
            _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));
            _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        private static void ValidateIdentity(string currentUserId, string currentUserRole)
        {
            if (string.IsNullOrWhiteSpace(currentUserId))
            {
                throw new ArgumentException("User ID cannot be null, empty, or whitespace.", nameof(currentUserId));
            }
            if (string.IsNullOrWhiteSpace(currentUserRole))
            {
                throw new ArgumentException("User role cannot be null, empty, or whitespace.", nameof(currentUserRole));
            }
        }

        public async Task<IEnumerable<TaskDto>> GetTasksAsync(string currentUserId, string currentUserRole, TaskQueryDto query)
        {
            ValidateIdentity(currentUserId, currentUserRole);

            _logger.LogInformation("Retrieving tasks for UserId: {UserId}, Role: {Role}", currentUserId, currentUserRole);

            IEnumerable<TaskItem> tasks;
            if (currentUserRole == UserRoles.Administrator)
            {
                tasks = await _taskRepository.GetAllAsync(query);
            }
            else
            {
                // For a regular user, do not allow AssignedUserId in the query to override their authorization scope.
                // The GetByAssignedUserIdAsync method already enforces the top-level boundary.
                tasks = await _taskRepository.GetByAssignedUserIdAsync(currentUserId, query);
            }

            return tasks.Select(MapToTaskDto);
        }

        public async Task<TaskDto?> GetTaskByIdAsync(int id, string currentUserId, string currentUserRole)
        {
            ValidateIdentity(currentUserId, currentUserRole);

            var task = await _taskRepository.GetByIdAsync(id);
            if (task == null)
            {
                _logger.LogWarning("Task search failed: Task ID {TaskId} not found.", id);
                return null;
            }

            if (currentUserRole != UserRoles.Administrator && task.AssignedUserId != currentUserId)
            {
                _logger.LogWarning(
                    "Forbidden task access attempt: UserId {UserId} attempted to view Task ID {TaskId}.",
                    currentUserId, id);
                return null;
            }

            return MapToTaskDto(task);
        }

        public async Task<TaskDto> CreateTaskAsync(CreateTaskDto dto, string currentUserId, string currentUserRole)
        {
            ValidateIdentity(currentUserId, currentUserRole);

            if (dto == null) throw new ArgumentNullException(nameof(dto));

            if (string.IsNullOrWhiteSpace(dto.Title))
                throw new ArgumentException("Task title cannot be null, empty, or whitespace.", nameof(dto));

            string? targetAssignedUserId = dto.AssignedUserId;
            if (string.IsNullOrWhiteSpace(targetAssignedUserId))
            {
                targetAssignedUserId = currentUserId;
            }

            if (currentUserRole != UserRoles.Administrator && targetAssignedUserId != currentUserId)
            {
                _logger.LogWarning(
                    "Forbidden task creation attempt: Regular User {UserId} attempted to assign task to {AssignedUserId}.",
                    currentUserId, targetAssignedUserId);
                throw new UnauthorizedAccessException("Regular users cannot assign tasks to other users.");
            }

            var assignedUser = await _userRepository.GetByIdAsync(targetAssignedUserId);
            if (assignedUser == null)
            {
                _logger.LogWarning(
                    "Task creation failed: Assigned user ID '{AssignedUserId}' does not exist.",
                    targetAssignedUserId);
                throw new ArgumentException($"Assigned user with ID '{targetAssignedUserId}' does not exist.");
            }

            var newTask = new TaskItem
            {
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim() ?? string.Empty,
                Status = dto.Status,
                Priority = dto.Priority,
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim(),
                DueDate = dto.DueDate,
                AssignedUserId = targetAssignedUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var created = await _taskRepository.CreateAsync(newTask);
            _logger.LogInformation(
                "Task created successfully: Task ID {TaskId}, Title '{Title}', AssignedTo {AssignedUserId}.",
                created.Id, created.Title, created.AssignedUserId);

            return MapToTaskDto(created);
        }

        public async Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskDto dto, string currentUserId, string currentUserRole)
        {
            ValidateIdentity(currentUserId, currentUserRole);

            if (dto == null) throw new ArgumentNullException(nameof(dto));

            if (string.IsNullOrWhiteSpace(dto.Title))
                throw new ArgumentException("Task title cannot be null, empty, or whitespace.", nameof(dto));

            var existingTask = await _taskRepository.GetByIdAsync(id);
            if (existingTask == null)
            {
                _logger.LogWarning("Task update failed: Task ID {TaskId} not found.", id);
                return null;
            }

            if (currentUserRole != UserRoles.Administrator && existingTask.AssignedUserId != currentUserId)
            {
                _logger.LogWarning(
                    "Forbidden task update attempt: UserId {UserId} attempted to update Task ID {TaskId}.",
                    currentUserId, id);
                throw new UnauthorizedAccessException("You do not have permission to update this task.");
            }

            string? targetAssignedUserId = string.IsNullOrWhiteSpace(dto.AssignedUserId)
                ? existingTask.AssignedUserId
                : dto.AssignedUserId;

            if (string.IsNullOrWhiteSpace(targetAssignedUserId))
            {
                throw new ArgumentException("Task must have a valid assignee.", nameof(dto));
            }

            if (currentUserRole != UserRoles.Administrator && targetAssignedUserId != currentUserId)
            {
                _logger.LogWarning(
                    "Forbidden task re-assignment attempt: Regular User {UserId} attempted to assign Task ID {TaskId} to {AssignedUserId}.",
                    currentUserId, id, targetAssignedUserId);
                throw new UnauthorizedAccessException("Regular users cannot reassign tasks to other users.");
            }

            var assignedUser = await _userRepository.GetByIdAsync(targetAssignedUserId);
            if (assignedUser == null)
            {
                _logger.LogWarning(
                    "Task update failed: Assigned user ID '{AssignedUserId}' does not exist.",
                    targetAssignedUserId);
                throw new ArgumentException($"Assigned user with ID '{targetAssignedUserId}' does not exist.");
            }

            existingTask.Title = dto.Title.Trim();
            existingTask.Description = dto.Description?.Trim() ?? string.Empty;
            existingTask.Status = dto.Status;
            existingTask.Priority = dto.Priority;
            existingTask.Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim();
            existingTask.DueDate = dto.DueDate;
            existingTask.AssignedUserId = targetAssignedUserId;
            existingTask.UpdatedAt = DateTime.UtcNow;

            var updated = await _taskRepository.UpdateAsync(existingTask);
            _logger.LogInformation(
                "Task updated successfully: Task ID {TaskId}, UpdatedAt {UpdatedAt}.",
                updated.Id, updated.UpdatedAt);

            return MapToTaskDto(updated);
        }

        public async Task<bool> DeleteTaskAsync(int id, string currentUserId, string currentUserRole)
        {
            ValidateIdentity(currentUserId, currentUserRole);

            var existingTask = await _taskRepository.GetByIdAsync(id);
            if (existingTask == null)
            {
                _logger.LogWarning("Task deletion failed: Task ID {TaskId} not found.", id);
                return false;
            }

            if (currentUserRole != UserRoles.Administrator && existingTask.AssignedUserId != currentUserId)
            {
                _logger.LogWarning(
                    "Forbidden task deletion attempt: UserId {UserId} attempted to delete Task ID {TaskId}.",
                    currentUserId, id);
                throw new UnauthorizedAccessException("You do not have permission to delete this task.");
            }

            var deleted = await _taskRepository.DeleteAsync(id);
            if (deleted)
            {
                _logger.LogInformation("Task deleted successfully: Task ID {TaskId}.", id);
            }

            return deleted;
        }

        private static TaskDto MapToTaskDto(TaskItem task)
        {
            return new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Status = task.Status,
                Priority = task.Priority,
                Category = task.Category,
                DueDate = task.DueDate,
                AssignedUserId = task.AssignedUserId,
                AssignedUserName = task.AssignedUser?.Name,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt
            };
        }
    }
}
