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
using Backend.Models;

namespace Backend.Controllers
{
    public class NotificationItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "assignment" | "deadline"
        public DateTime Timestamp { get; set; }
        public int TaskId { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<NotificationItemDto>))]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var now = DateTime.UtcNow;
            var horizon = now.AddHours(48);

            // Fetch user tasks
            var userTasks = await _context.Tasks
                .Where(t => t.AssignedUserId == userId && t.Status != TaskStatusEnum.Completed && t.Status != TaskStatusEnum.Cancelled)
                .ToListAsync();

            var notifications = new List<NotificationItemDto>();

            foreach (var task in userTasks)
            {
                // 1. Task Assignment Notification
                notifications.Add(new NotificationItemDto
                {
                    Id = $"notif-assign-{task.Id}",
                    Title = "Task Assigned",
                    Message = $"Task '{task.Title}' is assigned to you.",
                    Type = "assignment",
                    Timestamp = task.CreatedAt,
                    TaskId = task.Id
                });

                DateTime? effectiveDueDate = task.DueDate;
                if (!effectiveDueDate.HasValue && task.TimeLimit.HasValue)
                {
                    effectiveDueDate = task.CreatedAt.AddDays(task.TimeLimit.Value);
                }

                // 2. Deadline Notification (Due within 48 hours)
                if (effectiveDueDate.HasValue && effectiveDueDate.Value >= now.AddDays(-1) && effectiveDueDate.Value <= horizon)
                {
                    var hoursRemaining = Math.Max(0, (int)(effectiveDueDate.Value - now).TotalHours);
                    notifications.Add(new NotificationItemDto
                    {
                        Id = $"notif-due-{task.Id}",
                        Title = "Task Due Soon",
                        Message = $"Task '{task.Title}' is due in {hoursRemaining} hours ({effectiveDueDate.Value:MMM dd, HH:mm}).",
                        Type = "deadline",
                        Timestamp = effectiveDueDate.Value,
                        TaskId = task.Id
                    });
                }
            }

            var sortedNotifs = notifications.OrderByDescending(n => n.Timestamp).Take(20).ToList();
            return Ok(sortedNotifs);
        }
    }
}
