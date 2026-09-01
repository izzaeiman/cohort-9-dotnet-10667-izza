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
    public class AdminOverviewDto
    {
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int CancelledTasks { get; set; }
        public int TotalProjects { get; set; }
        public int ActiveUsers { get; set; }
    }

    public class TeamProgressItemDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public int Assigned { get; set; }
        public int Completed { get; set; }
        public int InProgress { get; set; }
        public int Overdue { get; set; }
        public double ProgressPercentage { get; set; }
    }

    public class AdminActivityLogDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string TaskTitle { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = UserRoles.Administrator)]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpGet("overview")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(AdminOverviewDto))]
        public async Task<IActionResult> GetOverview()
        {
            var now = DateTime.UtcNow;

            var totalTasks = await _context.Tasks.CountAsync();
            var completedTasks = await _context.Tasks.CountAsync(t => t.Status == TaskStatusEnum.Completed);
            var inProgressTasks = await _context.Tasks.CountAsync(t => t.Status == TaskStatusEnum.InProgress);
            var cancelledTasks = await _context.Tasks.CountAsync(t => t.Status == TaskStatusEnum.Cancelled);
            var overdueTasks = await _context.Tasks.CountAsync(t => t.DueDate.HasValue && t.DueDate.Value < now && t.Status != TaskStatusEnum.Completed && t.Status != TaskStatusEnum.Cancelled);

            var totalProjects = await _context.Projects.CountAsync();
            var activeUsers = await _context.Users.CountAsync();

            var overview = new AdminOverviewDto
            {
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                InProgressTasks = inProgressTasks,
                OverdueTasks = overdueTasks,
                CancelledTasks = cancelledTasks,
                TotalProjects = totalProjects,
                ActiveUsers = activeUsers
            };

            return Ok(overview);
        }

        [HttpGet("team-progress")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<TeamProgressItemDto>))]
        public async Task<IActionResult> GetTeamProgress()
        {
            var now = DateTime.UtcNow;
            var users = await _context.Users.ToListAsync();
            var tasks = await _context.Tasks.ToListAsync();

            var result = new List<TeamProgressItemDto>();

            foreach (var u in users)
            {
                var userTasks = tasks.Where(t => t.AssignedUserId == u.Id).ToList();
                var assigned = userTasks.Count;
                var completed = userTasks.Count(t => t.Status == TaskStatusEnum.Completed);
                var inProgress = userTasks.Count(t => t.Status == TaskStatusEnum.InProgress);
                var overdue = userTasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < now && t.Status != TaskStatusEnum.Completed && t.Status != TaskStatusEnum.Cancelled);

                double percentage = assigned > 0 ? Math.Round(((double)completed / assigned) * 100.0, 1) : 0.0;

                result.Add(new TeamProgressItemDto
                {
                    UserId = u.Id,
                    UserName = u.Name,
                    UserEmail = u.Email,
                    Assigned = assigned,
                    Completed = completed,
                    InProgress = inProgress,
                    Overdue = overdue,
                    ProgressPercentage = percentage
                });
            }

            return Ok(result.OrderByDescending(r => r.Assigned));
        }

        [HttpGet("activity")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<AdminActivityLogDto>))]
        public async Task<IActionResult> GetRecentActivity()
        {
            var activities = new List<AdminActivityLogDto>();

            var progressEntries = await _context.TaskProgressEntries
                .Include(p => p.User)
                .Include(p => p.Task)
                .OrderByDescending(p => p.CreatedAt)
                .Take(10)
                .ToListAsync();

            foreach (var pe in progressEntries)
            {
                activities.Add(new AdminActivityLogDto
                {
                    Id = $"act-pe-{pe.Id}",
                    UserName = pe.User != null ? pe.User.Name : "User",
                    TaskTitle = pe.Task != null ? pe.Task.Title : "Task",
                    Action = $"Added progress update: '{pe.Description}'",
                    Timestamp = pe.CreatedAt
                });
            }

            var recentTasks = await _context.Tasks
                .Include(t => t.AssignedUser)
                .OrderByDescending(t => t.CreatedAt)
                .Take(10)
                .ToListAsync();

            foreach (var t in recentTasks)
            {
                activities.Add(new AdminActivityLogDto
                {
                    Id = $"act-task-{t.Id}",
                    UserName = t.AssignedUser != null ? t.AssignedUser.Name : "Admin",
                    TaskTitle = t.Title,
                    Action = $"Created task ({t.Category} • {t.Priority} priority)",
                    Timestamp = t.CreatedAt
                });
            }

            var sortedLogs = activities.OrderByDescending(a => a.Timestamp).Take(15).ToList();
            return Ok(sortedLogs);
        }
    }
}
