using System;
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
    [Route("api/projects/{projectId}/progress")]
    [Authorize]
    public class ProjectProgressController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectProgressController(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpGet]
        public async Task<IActionResult> GetProgress(string projectId)
        {
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return NotFound(new { message = "Project not found." });

            var progress = await _context.ProjectProgressEntries
                .Where(pe => pe.ProjectId == projectId)
                .Include(pe => pe.User)
                .OrderByDescending(pe => pe.CreatedAt)
                .Select(pe => new ProjectProgressDto
                {
                    Id = pe.Id,
                    ProjectId = pe.ProjectId,
                    UserId = pe.UserId,
                    UserName = pe.User != null ? pe.User.Name : "Unknown User",
                    Description = pe.Description,
                    CreatedAt = pe.CreatedAt,
                    UpdatedAt = pe.UpdatedAt
                })
                .ToListAsync();

            return Ok(progress);
        }

        [HttpPost]
        public async Task<IActionResult> CreateProgress(string projectId, [FromBody] CreateProjectProgressDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return NotFound(new { message = "Project not found." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            var isAdmin = userRole == UserRoles.Administrator;

            // Check if user is project member (Lead, Admin, or assigned to a task in the project)
            var isLead = project.LeadUserId == userId;
            var isAssignedToTask = await _context.Tasks.AnyAsync(t => t.ProjectId == projectId && t.AssignedUserId == userId);

            if (!isAdmin && !isLead && !isAssignedToTask)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You are not a member of this project." });
            }

            var entry = new ProjectProgressEntry
            {
                ProjectId = projectId,
                UserId = userId!,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.ProjectProgressEntries.AddAsync(entry);
            await _context.SaveChangesAsync();

            // Fetch name for response
            var userName = await _context.Users.Where(u => u.Id == userId).Select(u => u.Name).FirstOrDefaultAsync();

            var responseDto = new ProjectProgressDto
            {
                Id = entry.Id,
                ProjectId = entry.ProjectId,
                UserId = entry.UserId,
                UserName = userName ?? "Unknown User",
                Description = entry.Description,
                CreatedAt = entry.CreatedAt,
                UpdatedAt = entry.UpdatedAt
            };

            return CreatedAtAction(nameof(GetProgress), new { projectId = entry.ProjectId }, responseDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProgress(string projectId, int id, [FromBody] UpdateProjectProgressDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var entry = await _context.ProjectProgressEntries.FirstOrDefaultAsync(pe => pe.Id == id && pe.ProjectId == projectId);
            if (entry == null) return NotFound(new { message = "Progress entry not found." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            var isAdmin = userRole == UserRoles.Administrator;

            if (entry.UserId != userId && !isAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You are not authorized to update this entry." });
            }

            entry.Description = dto.Description;
            entry.UpdatedAt = DateTime.UtcNow;

            _context.ProjectProgressEntries.Update(entry);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProgress(string projectId, int id)
        {
            var entry = await _context.ProjectProgressEntries.FirstOrDefaultAsync(pe => pe.Id == id && pe.ProjectId == projectId);
            if (entry == null) return NotFound(new { message = "Progress entry not found." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            var isAdmin = userRole == UserRoles.Administrator;

            if (entry.UserId != userId && !isAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You are not authorized to delete this entry." });
            }

            _context.ProjectProgressEntries.Remove(entry);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}