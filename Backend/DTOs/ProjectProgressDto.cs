using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class ProjectProgressDto
    {
        public int Id { get; set; }
        public string ProjectId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateProjectProgressDto
    {
        [Required]
        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
        public string Description { get; set; } = string.Empty;
    }

    public class UpdateProjectProgressDto
    {
        [Required]
        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
        public string Description { get; set; } = string.Empty;
    }
}