using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/tasks/{taskId}/progress")]
    [Authorize]
    public class TaskProgressController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TaskProgressController(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<TaskProgressDto>))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetProgressEntries(int taskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
            if (task == null) return NotFound(new { message = "Task not found." });

            var isAdmin = userRole == UserRoles.Administrator;
            if (!isAdmin && task.AssignedUserId != userId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You are not authorized to view progress for this task." });
            }

            var entries = await _context.TaskProgressEntries
                .Include(p => p.User)
                .Where(p => p.TaskId == taskId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new TaskProgressDto
                {
                    Id = p.Id,
                    TaskId = p.TaskId,
                    UserId = p.UserId,
                    UserName = p.User != null ? p.User.Name : "Unknown User",
                    Description = p.Description,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();

            return Ok(entries);
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(TaskProgressDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> CreateProgressEntry(int taskId, [FromBody] CreateTaskProgressDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
            if (task == null) return NotFound(new { message = "Task not found." });

            var isAdmin = userRole == UserRoles.Administrator;
            if (!isAdmin && task.AssignedUserId != userId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only add progress updates to tasks assigned to you." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

            var entry = new TaskProgressEntry
            {
                TaskId = taskId,
                UserId = userId,
                Description = dto.Description.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.TaskProgressEntries.AddAsync(entry);
            await _context.SaveChangesAsync();

            var result = new TaskProgressDto
            {
                Id = entry.Id,
                TaskId = entry.TaskId,
                UserId = entry.UserId,
                UserName = user != null ? user.Name : "Unknown User",
                Description = entry.Description,
                CreatedAt = entry.CreatedAt,
                UpdatedAt = entry.UpdatedAt
            };

            return CreatedAtAction(nameof(GetProgressEntries), new { taskId = taskId }, result);
        }

        [HttpPut("{progressId}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(TaskProgressDto))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> UpdateProgressEntry(int taskId, int progressId, [FromBody] UpdateTaskProgressDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var entry = await _context.TaskProgressEntries
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == progressId && p.TaskId == taskId);

            if (entry == null) return NotFound(new { message = "Progress entry not found." });

            var isAdmin = userRole == UserRoles.Administrator;
            if (!isAdmin && entry.UserId != userId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only edit your own progress entries." });
            }

            entry.Description = dto.Description.Trim();
            entry.UpdatedAt = DateTime.UtcNow;

            _context.TaskProgressEntries.Update(entry);
            await _context.SaveChangesAsync();

            var result = new TaskProgressDto
            {
                Id = entry.Id,
                TaskId = entry.TaskId,
                UserId = entry.UserId,
                UserName = entry.User != null ? entry.User.Name : "Unknown User",
                Description = entry.Description,
                CreatedAt = entry.CreatedAt,
                UpdatedAt = entry.UpdatedAt
            };

            return Ok(result);
        }

        [HttpDelete("{progressId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DeleteProgressEntry(int taskId, int progressId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var entry = await _context.TaskProgressEntries.FirstOrDefaultAsync(p => p.Id == progressId && p.TaskId == taskId);
            if (entry == null) return NotFound(new { message = "Progress entry not found." });

            var isAdmin = userRole == UserRoles.Administrator;
            if (!isAdmin && entry.UserId != userId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only delete your own progress entries." });
            }

            _context.TaskProgressEntries.Remove(entry);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Progress entry deleted successfully." });
        }
    }
}
