using System;

namespace Backend.DTOs
{
    public class ProjectDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string LeadUserId { get; set; } = string.Empty;
        public string LeadUserName { get; set; } = string.Empty;
    }

    public class CreateProjectDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
