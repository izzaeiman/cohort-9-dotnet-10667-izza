using System.Collections.Generic;

namespace Backend.Models
{
    public class User
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Regular User";

        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    }
}
