using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class ChangePasswordDto
    {
        [Required(ErrorMessage = "Current password is required")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "New password is required")]
        [RegularExpression(@"^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{10,}$",
            ErrorMessage = "Password must be at least 10 characters and contain at least one number and one special character.")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
