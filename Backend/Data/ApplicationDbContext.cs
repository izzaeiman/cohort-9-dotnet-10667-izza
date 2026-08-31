using System;
using System.Threading;
using System.Threading.Tasks;
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
        public DbSet<Project> Projects => Set<Project>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<TaskProgressEntry> TaskProgressEntries => Set<TaskProgressEntry>();
        public DbSet<ProjectProgressEntry> ProjectProgressEntries => Set<ProjectProgressEntry>();

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
                entity.Property(t => t.Category)
                      .HasConversion(
                          v => TaskCategoryToString(v),
                          v => StringToTaskCategory(v)
                      )
                      .HasMaxLength(50);

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

                // Project to Task relationship (1-to-many)
                entity.HasOne(t => t.Project)
                      .WithMany()
                      .HasForeignKey(t => t.ProjectId)
                      .OnDelete(DeleteBehavior.SetNull);

                // Fix 4: Performance indexes for common query patterns
                entity.HasIndex(t => t.AssignedUserId).HasDatabaseName("IX_Tasks_AssignedUserId");
                entity.HasIndex(t => t.Status).HasDatabaseName("IX_Tasks_Status");
                entity.HasIndex(t => new { t.AssignedUserId, t.Status }).HasDatabaseName("IX_Tasks_AssignedUserId_Status");
            });

            // Project Entity Configuration
            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
                entity.Property(p => p.Description).HasMaxLength(2000);
                
                entity.HasOne(p => p.LeadUser)
                      .WithMany()
                      .HasForeignKey(p => p.LeadUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Fix 3: RefreshToken Entity Configuration
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(r => r.Id);
                entity.Property(r => r.UserId).IsRequired().HasMaxLength(450);
                entity.Property(r => r.TokenHash).IsRequired().HasMaxLength(100);
                entity.HasIndex(r => r.UserId).HasDatabaseName("IX_RefreshTokens_UserId");
                entity.HasIndex(r => r.TokenHash).IsUnique().HasDatabaseName("IX_RefreshTokens_TokenHash");
                entity.HasOne(r => r.User)
                      .WithMany()
                      .HasForeignKey(r => r.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // TaskProgressEntry Entity Configuration
            modelBuilder.Entity<TaskProgressEntry>(entity =>
            {
                entity.HasKey(pe => pe.Id);
                entity.Property(pe => pe.Description).IsRequired().HasMaxLength(2000);
                entity.HasOne(pe => pe.Task)
                      .WithMany()
                      .HasForeignKey(pe => pe.TaskId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(pe => pe.User)
                      .WithMany()
                      .HasForeignKey(pe => pe.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ProjectProgressEntry Entity Configuration
            modelBuilder.Entity<ProjectProgressEntry>(entity =>
            {
                entity.HasKey(pe => pe.Id);
                entity.Property(pe => pe.ProjectId).IsRequired().HasMaxLength(450);
                entity.Property(pe => pe.UserId).IsRequired().HasMaxLength(450);
                entity.Property(pe => pe.Description).IsRequired().HasMaxLength(2000);
                entity.HasOne(pe => pe.Project)
                      .WithMany()
                      .HasForeignKey(pe => pe.ProjectId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(pe => pe.User)
                      .WithMany()
                      .HasForeignKey(pe => pe.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var entries = ChangeTracker.Entries<TaskItem>();
            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                }
            }
            return base.SaveChangesAsync(cancellationToken);
        }

        private static string TaskCategoryToString(TaskCategoryEnum category) => category.ToString();

        private static TaskCategoryEnum StringToTaskCategory(string value)
        {
            return Enum.TryParse<TaskCategoryEnum>(value, true, out var result) ? result : TaskCategoryEnum.General;
        }
    }
}
