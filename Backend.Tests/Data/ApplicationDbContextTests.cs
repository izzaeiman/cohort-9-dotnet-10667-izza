using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Xunit;

namespace Backend.Tests.Data
{
    public class ApplicationDbContextTests
    {
        [Fact]
        public void Can_Create_Context_And_Save_Data()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: "Test_Database")
                .Options;

            using (var context = new ApplicationDbContext(options))
            {
                var user = new User { Id = "usr-1", Name = "Test", Email = "test@test.com", PasswordHash = "hash", Role = "Administrator" };
                context.Users.Add(user);
                
                var task = new TaskItem { Id = 1, Title = "Test Task", Status = TaskStatusEnum.Pending, Priority = TaskPriorityEnum.Low, Category = TaskCategoryEnum.General, AssignedUserId = user.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
                context.Tasks.Add(task);
                
                context.SaveChanges();
            }

            using (var context = new ApplicationDbContext(options))
            {
                Assert.Equal(1, context.Users.Count());
                Assert.Equal(1, context.Tasks.Count());
            }
        }
    }
}
