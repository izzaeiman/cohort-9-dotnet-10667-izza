namespace Backend.DTOs
{
    /// <summary>
    /// Returned on login/register. Token is NOT included — it is set as an HttpOnly cookie by the server.
    /// </summary>
    public class AuthResponseDto
    {
        public UserDto User { get; set; } = new UserDto();
    }
}
