using System;
using Backend.Models;

namespace Backend.DTOs
{
    public class TaskQueryDto
    {
        public string? Search { get; set; }
        public TaskStatusEnum? Status { get; set; }
        public TaskPriorityEnum? Priority { get; set; }
        public TaskCategoryEnum? Category { get; set; }
        public string? AssignedUserId { get; set; }
        public DateTime? DueDateFrom { get; set; }
        public DateTime? DueDateTo { get; set; }
    }
}
