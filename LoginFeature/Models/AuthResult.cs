namespace LoginFeature.Models
{
    /// <summary>
    /// Represents the result of an authentication attempt.
    /// </summary>
    public class AuthResult
    {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public string? UserId { get; set; }
        public string? Email { get; set; }
    }
}
