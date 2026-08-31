using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Repositories
{
    public class TaskRepository : ITaskRepository
    {
        private readonly ApplicationDbContext _context;

        public TaskRepository(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        public async Task<IEnumerable<TaskItem>> GetAllAsync(TaskQueryDto dto)
        {
            var query = _context.Tasks
                .AsNoTracking()
                .Include(t => t.AssignedUser)
                .Include(t => t.Project)
                .AsQueryable();

            query = ApplyFilters(query, dto);

            return await query
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskItem>> GetByAssignedUserIdAsync(string userId, TaskQueryDto dto)
        {
            if (string.IsNullOrWhiteSpace(userId)) return new List<TaskItem>();

            var query = _context.Tasks
                .AsNoTracking()
                .Include(t => t.AssignedUser)
                .Include(t => t.Project)
                .Where(t => t.AssignedUserId == userId)
                .AsQueryable();

            query = ApplyFilters(query, dto);

            return await query
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        private static IQueryable<TaskItem> ApplyFilters(IQueryable<TaskItem> query, TaskQueryDto dto)
        {
            if (dto == null) return query;

            if (!string.IsNullOrWhiteSpace(dto.Search))
            {
                var searchTerm = $"%{dto.Search}%";
                query = query.Where(t => 
                    EF.Functions.Like(t.Title, searchTerm) || 
                    EF.Functions.Like(t.Description, searchTerm) ||
                    (t.AssignedUser != null && EF.Functions.Like(t.AssignedUser.Name, searchTerm)));
            }

            if (dto.Status.HasValue)
            {
                query = query.Where(t => t.Status == dto.Status.Value);
            }

            if (dto.Priority.HasValue)
            {
                query = query.Where(t => t.Priority == dto.Priority.Value);
            }

            if (dto.Category.HasValue)
            {
                query = query.Where(t => t.Category == dto.Category.Value);
            }

            if (!string.IsNullOrWhiteSpace(dto.AssignedUserId))
            {
                query = query.Where(t => t.AssignedUserId == dto.AssignedUserId);
            }

            if (dto.DueDateFrom.HasValue)
            {
                query = query.Where(t => t.DueDate != null && t.DueDate.Value >= dto.DueDateFrom.Value);
            }

            if (dto.DueDateTo.HasValue)
            {
                query = query.Where(t => t.DueDate != null && t.DueDate.Value <= dto.DueDateTo.Value);
            }

            return query;
        }

        public async Task<TaskItem?> GetByIdAsync(int id)
        {
            return await _context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.Project)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<TaskItem> CreateAsync(TaskItem task)
        {
            ArgumentNullException.ThrowIfNull(task);

            await _context.Tasks.AddAsync(task);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(task.AssignedUserId))
            {
                await _context.Entry(task).Reference(t => t.AssignedUser).LoadAsync();
            }

            return task;
        }

        public async Task<TaskItem> UpdateAsync(TaskItem task)
        {
            ArgumentNullException.ThrowIfNull(task);

            _context.Tasks.Update(task);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(task.AssignedUserId))
            {
                await _context.Entry(task).Reference(t => t.AssignedUser).LoadAsync();
            }

            return task;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return false;

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
