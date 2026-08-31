using System;
using System.ComponentModel.DataAnnotations;
using Backend.Models;

namespace Backend.DTOs
{
    public class TaskInputDto
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

        [EnumDataType(typeof(TaskCategoryEnum), ErrorMessage = "Invalid category value")]
        public TaskCategoryEnum Category { get; set; } = TaskCategoryEnum.General;

        [FutureDate]
        public DateTime? DueDate { get; set; }

        public string? AssignedUserId { get; set; }
        public string? ProjectId { get; set; }
        public int? TimeLimit { get; set; }
    }

    public class FutureDateAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is DateTime dt && dt.ToUniversalTime().Date < DateTime.UtcNow.Date)
                return new ValidationResult("Due date cannot be in the past.");
            return ValidationResult.Success;
        }
    }
}
