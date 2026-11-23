using BookEase.Api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BookEase.Api.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await context.Database.MigrateAsync();

        if (!await context.Services.AnyAsync())
        {
            context.Services.AddRange(
                new Service
                {
                    Name = "قص شعر رجالي",
                    Description = "قص وتصفيف الشعر للرجال مع غسيل وتجفيف",
                    DurationMinutes = 30,
                    IsActive = true,
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                    UpdatedAtUtc = DateTimeOffset.UtcNow
                },
                new Service
                {
                    Name = "حلاقة ذقن",
                    Description = "حلاقة الذقن بالموس مع تنظيف وترطيب البشرة",
                    DurationMinutes = 30,
                    IsActive = true,
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                    UpdatedAtUtc = DateTimeOffset.UtcNow
                },
                new Service
                {
                    Name = "صبغة شعر",
                    Description = "صبغ الشعر باللون المطلوب مع العناية بالشعر",
                    DurationMinutes = 60,
                    IsActive = true,
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                    UpdatedAtUtc = DateTimeOffset.UtcNow
                },
                new Service
                {
                    Name = "تنظيف بشرة",
                    Description = "تنظيف عميق للبشرة مع ماسك وترطيب",
                    DurationMinutes = 45,
                    IsActive = true,
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                    UpdatedAtUtc = DateTimeOffset.UtcNow
                },
                new Service
                {
                    Name = "مساج رأس",
                    Description = "جلسة مساج للرأس والرقبة للاسترخاء",
                    DurationMinutes = 30,
                    IsActive = false,
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                    UpdatedAtUtc = DateTimeOffset.UtcNow
                }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.BusinessHours.AnyAsync())
        {
            context.BusinessHours.AddRange(
                new BusinessHour { DayOfWeek = DayOfWeek.Sunday, IsOpen = true, OpeningTime = new TimeSpan(9, 0, 0), ClosingTime = new TimeSpan(17, 0, 0) },
                new BusinessHour { DayOfWeek = DayOfWeek.Monday, IsOpen = true, OpeningTime = new TimeSpan(9, 0, 0), ClosingTime = new TimeSpan(17, 0, 0) },
                new BusinessHour { DayOfWeek = DayOfWeek.Tuesday, IsOpen = true, OpeningTime = new TimeSpan(9, 0, 0), ClosingTime = new TimeSpan(17, 0, 0) },
                new BusinessHour { DayOfWeek = DayOfWeek.Wednesday, IsOpen = true, OpeningTime = new TimeSpan(9, 0, 0), ClosingTime = new TimeSpan(17, 0, 0) },
                new BusinessHour { DayOfWeek = DayOfWeek.Thursday, IsOpen = true, OpeningTime = new TimeSpan(9, 0, 0), ClosingTime = new TimeSpan(17, 0, 0) },
                new BusinessHour { DayOfWeek = DayOfWeek.Friday, IsOpen = false, OpeningTime = new TimeSpan(0, 0, 0), ClosingTime = new TimeSpan(0, 0, 0) },
                new BusinessHour { DayOfWeek = DayOfWeek.Saturday, IsOpen = true, OpeningTime = new TimeSpan(10, 0, 0), ClosingTime = new TimeSpan(14, 0, 0) }
            );
            await context.SaveChangesAsync();
        }

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        var adminUser = await userManager.FindByNameAsync("admin");
        if (adminUser == null)
        {
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var adminPassword = config["AdminSeed:Password"] ?? "Admin@123456";

            adminUser = new IdentityUser
            {
                UserName = "admin",
                Email = "admin@bookease.local",
                EmailConfirmed = true
            };

            await userManager.CreateAsync(adminUser, adminPassword);
        }
    }
}
