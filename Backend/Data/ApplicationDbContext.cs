using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<TaskItem> Tasks => Set<TaskItem>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Entity Configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.Property(u => u.Name).IsRequired().HasMaxLength(100);
                entity.Property(u => u.Email).IsRequired().HasMaxLength(150);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.PasswordHash).IsRequired();
                entity.Property(u => u.Role).IsRequired().HasMaxLength(50);
            });

            // TaskItem Entity Configuration
            modelBuilder.Entity<TaskItem>(entity =>
            {
                entity.HasKey(t => t.Id);
                entity.Property(t => t.Title).IsRequired().HasMaxLength(200);
                entity.Property(t => t.Description).HasMaxLength(2000);
                entity.Property(t => t.Category).HasMaxLength(100);

                // Store Enums as Strings for explicit readability
                entity.Property(t => t.Status)
                      .HasConversion<string>()
                      .HasMaxLength(50);

                entity.Property(t => t.Priority)
                      .HasConversion<string>()
                      .HasMaxLength(50);

                // User to Task relationship (1-to-many)
                entity.HasOne(t => t.AssignedUser)
                      .WithMany(u => u.Tasks)
                      .HasForeignKey(t => t.AssignedUserId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
