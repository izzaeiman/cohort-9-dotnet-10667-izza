using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Backend.Models;

namespace Backend.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAdminUserAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbInitializer");

            try
            {
                await context.Database.MigrateAsync();

                var adminEmail = (configuration["InitialAdmin:Email"] ?? "admin@workflow.local").Trim().ToLowerInvariant();
                var adminPassword = configuration["InitialAdmin:Password"] ?? "AdminPassword123!";
                var adminName = configuration["InitialAdmin:Name"] ?? "System Administrator";

                var existingAdmin = await context.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
                var hasher = new PasswordHasher<User>();

                if (existingAdmin == null)
                {
                    var adminUser = new User
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = adminName,
                        Email = adminEmail,
                        Role = UserRoles.Administrator
                    };
                    adminUser.PasswordHash = hasher.HashPassword(adminUser, adminPassword);

                    await context.Users.AddAsync(adminUser);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Successfully seeded initial Admin user: {Email}", adminEmail);

                    await SeedDefaultProjectsAsync(context, adminUser.Id, logger);
                }
                else
                {
                    existingAdmin.Role = UserRoles.Administrator;
                    existingAdmin.PasswordHash = hasher.HashPassword(existingAdmin, adminPassword);
                    context.Users.Update(existingAdmin);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Updated existing Admin user: {Email}", adminEmail);

                    await SeedDefaultProjectsAsync(context, existingAdmin.Id, logger);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while seeding the initial Admin user.");
            }
        }

        private static async Task SeedDefaultProjectsAsync(ApplicationDbContext context, string adminUserId, ILogger logger)
        {
            if (!await context.Projects.AnyAsync())
            {
                var defaultProject = new Project
                {
                    Id = "default-project-id-1111",
                    Name = "Task Management System SaaS",
                    Description = "The default software engineering workspace project.",
                    LeadUserId = adminUserId
                };
                var secondProject = new Project
                {
                    Id = "default-project-id-2222",
                    Name = "Internal Tools",
                    Description = "Internal infrastructure and tooling development.",
                    LeadUserId = adminUserId
                };
                await context.Projects.AddRangeAsync(defaultProject, secondProject);
                await context.SaveChangesAsync();
                logger.LogInformation("Successfully seeded default projects.");
            }
        }
    }
}
