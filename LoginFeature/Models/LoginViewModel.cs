namespace LoginFeature.Models
{
    /// <summary>
    /// View model for the Login Page form.
    /// </summary>
    public class LoginViewModel
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool RememberMe { get; set; }
    }
}
