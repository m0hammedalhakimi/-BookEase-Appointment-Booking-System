using BookEase.Api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BookEase.Api.Data;

public class ApplicationDbContext : IdentityDbContext<IdentityUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Service> Services => Set<Service>();
    public DbSet<BusinessHour> BusinessHours => Set<BusinessHour>();
    public DbSet<Appointment> Appointments => Set<Appointment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.DurationMinutes).IsRequired();
            entity.HasIndex(e => e.IsActive);
        });

        modelBuilder.Entity<BusinessHour>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.DayOfWeek).IsUnique();
            entity.Property(e => e.OpeningTime).IsRequired();
            entity.Property(e => e.ClosingTime).IsRequired();
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.BookingReference).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => e.BookingReference).IsUnique();
            entity.Property(e => e.ManagementCodeHash).IsRequired().HasMaxLength(256);
            entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CustomerPhone).IsRequired().HasMaxLength(30);
            entity.Property(e => e.CustomerEmail).HasMaxLength(200);
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.Status).IsRequired();
            entity.HasIndex(e => e.StartAtUtc);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ServiceId);
            entity.HasIndex(e => new { e.StartAtUtc, e.EndAtUtc, e.Status });

            entity.HasOne(e => e.Service)
                .WithMany(s => s.Appointments)
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
