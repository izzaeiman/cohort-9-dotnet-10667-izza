import re

with open('Program.cs', 'r', encoding='utf-8') as f:
    content = f.read()

# Add repositories and services
if 'builder.Services.AddScoped<IProjectRepository, ProjectRepository>();' not in content:
    content = content.replace(
        'builder.Services.AddScoped<IUserRepository, UserRepository>();',
        'builder.Services.AddScoped<IUserRepository, UserRepository>();\nbuilder.Services.AddScoped<IProjectRepository, ProjectRepository>();'
    )
    
if 'builder.Services.AddScoped<IProjectService, ProjectService>();' not in content:
    content = content.replace(
        'builder.Services.AddScoped<ITaskService, TaskService>();',
        'builder.Services.AddScoped<ITaskService, TaskService>();\nbuilder.Services.AddScoped<IProjectService, ProjectService>();'
    )

with open('Program.cs', 'w', encoding='utf-8') as f:
    f.write(content)
