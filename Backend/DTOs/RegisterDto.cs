using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "Name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [RegularExpression(@"^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{10,}$",
            ErrorMessage = "Password must be at least 10 characters and contain at least one number and one special character.")]
        public string Password { get; set; } = string.Empty;
    }
}
