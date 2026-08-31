using System.Collections.Generic;

namespace Backend.Models
{
    public class Project
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        // Navigation properties
        public string LeadUserId { get; set; } = string.Empty;
        public User? LeadUser { get; set; }
    }
}
