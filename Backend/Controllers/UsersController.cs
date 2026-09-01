using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Repositories;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UsersController(IUserRepository userRepository)
        {
            _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<UserDto>))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetUsers([FromQuery] string? search)
        {
            var users = await _userRepository.GetAllAsync(search);
            
            var userDtos = users.Select(u => new UserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = User.IsInRole("Administrator") ? u.Email : string.Empty,
                Role = u.Role
            });

            return Ok(userDtos);
        }

        [HttpPut("{id}/role")]
        [Authorize(Roles = Backend.Models.UserRoles.Administrator)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateRoleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Role) || (dto.Role != Backend.Models.UserRoles.Administrator && dto.Role != Backend.Models.UserRoles.RegularUser))
            {
                return BadRequest(new { message = "Invalid role specified." });
            }

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            user.Role = dto.Role;
            await _userRepository.UpdateAsync(user);

            return Ok(new UserDto { Id = user.Id, Name = user.Name, Email = user.Email, Role = user.Role });
        }
    }

    public class UpdateRoleDto
    {
        public string Role { get; set; } = string.Empty;
    }
}
