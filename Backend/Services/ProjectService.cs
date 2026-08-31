using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public class ProjectService : IProjectService
    {
        private readonly IProjectRepository _projectRepository;

        public ProjectService(IProjectRepository projectRepository)
        {
            _projectRepository = projectRepository ?? throw new ArgumentNullException(nameof(projectRepository));
        }

        public async Task<IEnumerable<ProjectDto>> GetAllProjectsAsync()
        {
            var projects = await _projectRepository.GetAllAsync();
            return projects.Select(MapToDto);
        }

        public async Task<ProjectDto?> GetProjectByIdAsync(string id)
        {
            var project = await _projectRepository.GetByIdAsync(id);
            return project != null ? MapToDto(project) : null;
        }

        public async Task<ProjectDto> CreateProjectAsync(CreateProjectDto createDto, string leadUserId)
        {
            var project = new Project
            {
                Name = createDto.Name,
                Description = createDto.Description,
                LeadUserId = leadUserId
            };

            var createdProject = await _projectRepository.CreateAsync(project);
            
            // To return Dto with LeadUserName populated, refetch
            createdProject = await _projectRepository.GetByIdAsync(createdProject.Id);
            return MapToDto(createdProject!);
        }

        public async Task UpdateProjectAsync(string id, CreateProjectDto updateDto, string userId)
        {
            var project = await _projectRepository.GetByIdAsync(id);
            if (project == null)
                throw new KeyNotFoundException($"Project with ID {id} not found.");

            // In a real app we might check if user is admin or lead user, but let's allow it for now.
            project.Name = updateDto.Name;
            project.Description = updateDto.Description;

            await _projectRepository.UpdateAsync(project);
        }

        public async Task DeleteProjectAsync(string id, string userId)
        {
            var project = await _projectRepository.GetByIdAsync(id);
            if (project == null) return;
            
            await _projectRepository.DeleteAsync(id);
        }

        private ProjectDto MapToDto(Project project)
        {
            return new ProjectDto
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                LeadUserId = project.LeadUserId,
                LeadUserName = project.LeadUser?.Name ?? string.Empty
            };
        }
    }
}
