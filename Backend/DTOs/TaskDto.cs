using System;
using Backend.Models;

namespace Backend.DTOs
{
    public class TaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public TaskStatusEnum Status { get; set; }
        public TaskPriorityEnum Priority { get; set; }
        public TaskCategoryEnum Category { get; set; } = TaskCategoryEnum.General;
        public DateTime? DueDate { get; set; }
        public string? AssignedUserId { get; set; }
        public string? AssignedUserName { get; set; }
        public string? ProjectId { get; set; }
        public string? ProjectName { get; set; }
        public int? TimeLimit { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
