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
                .Where(t => t.AssignedUserId == userId)
                .AsQueryable();

            query = ApplyFilters(query, dto);

            return await query
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        private IQueryable<TaskItem> ApplyFilters(IQueryable<TaskItem> query, TaskQueryDto dto)
        {
            if (dto == null) return query;

            if (!string.IsNullOrWhiteSpace(dto.Search))
            {
                var searchTerm = dto.Search.ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(searchTerm) || t.Description.ToLower().Contains(searchTerm));
            }

            if (dto.Status.HasValue)
            {
                query = query.Where(t => t.Status == dto.Status.Value);
            }

            if (dto.Priority.HasValue)
            {
                query = query.Where(t => t.Priority == dto.Priority.Value);
            }

            if (!string.IsNullOrWhiteSpace(dto.Category))
            {
                query = query.Where(t => t.Category == dto.Category);
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
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<TaskItem> CreateAsync(TaskItem task)
        {
            if (task == null) throw new ArgumentNullException(nameof(task));

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
            if (task == null) throw new ArgumentNullException(nameof(task));

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
