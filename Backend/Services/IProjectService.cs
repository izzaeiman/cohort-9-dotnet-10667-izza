using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.DTOs;
using Backend.Models;

namespace Backend.Services
{
    public interface IProjectService
    {
        Task<IEnumerable<ProjectDto>> GetAllProjectsAsync();
        Task<IEnumerable<ProjectDto>> GetProjectsAsync(string? userId = null, string? userRole = null);
        Task<ProjectDto?> GetProjectByIdAsync(string id);
        Task<ProjectDto> CreateProjectAsync(CreateProjectDto createDto, string leadUserId);
        Task UpdateProjectAsync(string id, CreateProjectDto updateDto, string userId);
        Task DeleteProjectAsync(string id, string userId);
    }
}
