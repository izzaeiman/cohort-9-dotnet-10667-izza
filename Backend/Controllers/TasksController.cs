using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly Backend.Data.ApplicationDbContext _context;

        public TasksController(ITaskService taskService, Backend.Data.ApplicationDbContext context)
        {
            _taskService = taskService ?? throw new ArgumentNullException(nameof(taskService));
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        /// <summary>
        /// Retrieves tasks accessible to the authenticated user.
        /// Administrators receive all tasks; Regular Users receive assigned tasks.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<TaskDto>))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetTasks([FromQuery] TaskQueryDto query)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            var tasks = await _taskService.GetTasksAsync(userId, userRole, query);
            return Ok(tasks);
        }

        /// <summary>
        /// Retrieves a specific task by ID if authorized.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(TaskDto))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTaskById(int id)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            var task = await _taskService.GetTaskByIdAsync(id, userId, userRole);
            if (task == null)
            {
                return NotFound(new { message = $"Task with ID {id} was not found or access is restricted." });
            }

            return Ok(task);
        }

        /// <summary>
        /// Creates a new task. Validates assigned user existence and enforces assignment permissions.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(TaskDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> CreateTask([FromBody] TaskInputDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetUserId();
            var userRole = GetUserRole();

            try
            {
                var createdTask = await _taskService.CreateTaskAsync(dto, userId, userRole);
                return CreatedAtAction(nameof(GetTaskById), new { id = createdTask.Id }, createdTask);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Updates an existing task by ID.
        /// </summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(TaskDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskInputDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetUserId();
            var userRole = GetUserRole();

            try
            {
                var updatedTask = await _taskService.UpdateTaskAsync(id, dto, userId, userRole);
                if (updatedTask == null)
                {
                    return NotFound(new { message = $"Task with ID {id} was not found." });
                }

                return Ok(updatedTask);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a task by ID if authorized.
        /// </summary>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            try
            {
                var deleted = await _taskService.DeleteTaskAsync(id, userId, userRole);
                if (!deleted)
                {
                    return NotFound(new { message = $"Task with ID {id} was not found." });
                }

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }

        private string GetUserRole()
        {
            return User.FindFirstValue(ClaimTypes.Role) ?? UserRoles.RegularUser;
        }

        [HttpGet("export")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ExportTasks([FromQuery] string format = "csv")
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            var tasks = await _taskService.GetTasksAsync(userId, userRole, new TaskQueryDto());

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("Task ID,Title,Description,Status,Priority,Category,Assigned User,Due Date,Created Date,Updated Date");

            foreach (var t in tasks)
            {
                var title = t.Title.Replace("\"", "\"\"");
                var desc = (t.Description ?? "").Replace("\"", "\"\"");
                var dueDateStr = t.DueDate.HasValue ? t.DueDate.Value.ToString("yyyy-MM-dd HH:mm:ss") : "";
                var createdStr = t.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                var updatedStr = t.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss");

                sb.AppendLine($"\"{t.Id}\",\"{title}\",\"{desc}\",\"{t.Status}\",\"{t.Priority}\",\"{t.Category}\",\"{t.AssignedUserName}\",\"{dueDateStr}\",\"{createdStr}\",\"{updatedStr}\"");
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"tasks_export_{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
        }

        [HttpPost("import")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ImportTasks(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No CSV file provided." });
            }

            var userId = GetUserId();
            var errors = new List<string>();
            var tasksToInsert = new List<TaskItem>();

            using (var reader = new System.IO.StreamReader(file.OpenReadStream()))
            {
                var lineCount = 0;
                string? line;
                while ((line = await reader.ReadLineAsync()) != null)
                {
                    lineCount++;
                    if (lineCount == 1 && (line.Contains("title", StringComparison.OrdinalIgnoreCase) || line.Contains("task id", StringComparison.OrdinalIgnoreCase)))
                    {
                        // Skip header row
                        continue;
                    }

                    if (string.IsNullOrWhiteSpace(line)) continue;

                    if (TryParseTaskFromCsv(line, lineCount, userId, errors, out var task) && task != null)
                    {
                        tasksToInsert.Add(task);
                    }
                }
            }

            if (errors.Count > 0)
            {
                return BadRequest(new { message = "Import completed with errors:", errors = errors });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await _context.Tasks.AddRangeAsync(tasksToInsert);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = $"Successfully imported {tasksToInsert.Count} tasks.", count = tasksToInsert.Count });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { message = "Database transaction failed during import.", error = ex.Message });
            }
        }

        private static bool TryParseTaskFromCsv(string line, int lineCount, string userId, List<string> errors, out TaskItem? task)
        {
            task = null;
            if (string.IsNullOrWhiteSpace(line)) return false;

            var parts = ParseCsvLine(line);
            if (parts.Count < 1)
            {
                errors.Add($"Row {lineCount}: Invalid column count.");
                return false;
            }

            var title = parts[0].Trim();
            var desc = parts.Count > 1 ? parts[1].Trim() : "";
            var categoryStr = parts.Count > 2 ? parts[2].Trim() : "General";
            var priorityStr = parts.Count > 3 ? parts[3].Trim() : "Medium";
            var statusStr = parts.Count > 4 ? parts[4].Trim() : "Pending";

            if (string.IsNullOrWhiteSpace(title))
            {
                errors.Add($"Row {lineCount}: Title is required.");
            }

            if (!Enum.TryParse<TaskCategoryEnum>(categoryStr, true, out var category))
            {
                errors.Add($"Row {lineCount}: Invalid category '{categoryStr}'. Allowed values: General, Frontend, Backend, UiUxDesign, DevOps, Database, FullStack.");
            }

            if (!Enum.TryParse<TaskPriorityEnum>(priorityStr, true, out var priority))
            {
                errors.Add($"Row {lineCount}: Invalid priority '{priorityStr}'. Allowed values: Low, Medium, High, Critical.");
            }

            if (!Enum.TryParse<TaskStatusEnum>(statusStr, true, out var status))
            {
                errors.Add($"Row {lineCount}: Invalid status '{statusStr}'. Allowed values: Pending, InProgress, Completed, Cancelled.");
            }

            if (errors.Any(e => e.StartsWith($"Row {lineCount}:")))
            {
                return false;
            }

            task = new TaskItem
            {
                Title = title,
                Description = desc,
                Category = category,
                Priority = priority,
                Status = status,
                AssignedUserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            return true;
        }

        private static List<string> ParseCsvLine(string line)
        {
            var result = new List<string>();
            var inQuotes = false;
            var current = new System.Text.StringBuilder();

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ',' && !inQuotes)
                {
                    result.Add(current.ToString());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }
            result.Add(current.ToString());
            return result;
        }
    }
}
