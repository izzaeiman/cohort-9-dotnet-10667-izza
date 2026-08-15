using System;
using System.ComponentModel.DataAnnotations;
using Backend.Models;

namespace Backend.DTOs
{
    public class UpdateTaskDto
    {
        [Required(ErrorMessage = "Title is required")]
        [StringLength(200, MinimumLength = 1, ErrorMessage = "Title must be between 1 and 200 characters")]
        public string Title { get; set; } = string.Empty;

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string? Description { get; set; }

        [EnumDataType(typeof(TaskStatusEnum), ErrorMessage = "Invalid status value")]
        public TaskStatusEnum Status { get; set; } = TaskStatusEnum.Pending;

        [EnumDataType(typeof(TaskPriorityEnum), ErrorMessage = "Invalid priority value")]
        public TaskPriorityEnum Priority { get; set; } = TaskPriorityEnum.Medium;

        [StringLength(100, ErrorMessage = "Category cannot exceed 100 characters")]
        public string Category { get; set; } = "General";

        public DateTime? DueDate { get; set; }

        public string? AssignedUserId { get; set; }
    }
}
