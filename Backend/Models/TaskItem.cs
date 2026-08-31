using System;

namespace Backend.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public TaskStatusEnum Status { get; set; } = TaskStatusEnum.Pending;
        public TaskPriorityEnum Priority { get; set; } = TaskPriorityEnum.Medium;
        public TaskCategoryEnum Category { get; set; } = TaskCategoryEnum.General;
        public DateTime? DueDate { get; set; }
        public int? TimeLimit { get; set; }
        
        public string? AssignedUserId { get; set; }
        public User? AssignedUser { get; set; }
        
        public string? ProjectId { get; set; }
        public Project? Project { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
