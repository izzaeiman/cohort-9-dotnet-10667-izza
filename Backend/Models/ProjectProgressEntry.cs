using System;

namespace Backend.Models
{
    public class ProjectProgressEntry
    {
        public int Id { get; set; }
        public string ProjectId { get; set; } = string.Empty;
        public Project? Project { get; set; }
        public string UserId { get; set; } = string.Empty;
        public User? User { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}