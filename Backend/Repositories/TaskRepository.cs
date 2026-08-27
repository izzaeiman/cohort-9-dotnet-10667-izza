using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Repositories
{
    public class TaskRepository : ITaskRepository
    {
        private readonly ApplicationDbContext _context;

        public TaskRepository(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        public async Task<IEnumerable<TaskItem>> GetAllAsync()
        {
            return await _context.Tasks
                .AsNoTracking()
                .Include(t => t.AssignedUser)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskItem>> GetByAssignedUserIdAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId)) return new List<TaskItem>();

            return await _context.Tasks
                .AsNoTracking()
                .Include(t => t.AssignedUser)
                .Where(t => t.AssignedUserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
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
