using BookEase.Api.Data;
using BookEase.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace BookEase.Api.Services;

public class BusinessHourService
{
    private readonly ApplicationDbContext _context;

    public BusinessHourService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<BusinessHourDto>> GetAllAsync()
    {
        return await _context.BusinessHours
            .OrderBy(b => b.DayOfWeek)
            .Select(b => new BusinessHourDto
            {
                Id = b.Id,
                DayOfWeek = (int)b.DayOfWeek,
                IsOpen = b.IsOpen,
                OpeningTime = b.OpeningTime.ToString(@"hh\:mm"),
                ClosingTime = b.ClosingTime.ToString(@"hh\:mm")
            })
            .ToListAsync();
    }

    public async Task<List<BusinessHourDto>> UpdateAllAsync(UpdateBusinessHoursRequest request)
    {
        foreach (var item in request.Hours)
        {
            if (item.DayOfWeek < 0 || item.DayOfWeek > 6)
                throw new ArgumentException($"Invalid day of week: {item.DayOfWeek}");

            if (item.IsOpen)
            {
                if (!TimeSpan.TryParse(item.OpeningTime, out var opening))
                    throw new ArgumentException($"Invalid opening time for day {item.DayOfWeek}");

                if (!TimeSpan.TryParse(item.ClosingTime, out var closing))
                    throw new ArgumentException($"Invalid closing time for day {item.DayOfWeek}");

                if (closing <= opening)
                    throw new ArgumentException($"Closing time must be after opening time for day {item.DayOfWeek}");
            }
        }

        foreach (var item in request.Hours)
        {
            var dayOfWeek = (DayOfWeek)item.DayOfWeek;
            var existing = await _context.BusinessHours.FirstOrDefaultAsync(b => b.DayOfWeek == dayOfWeek);

            if (existing != null)
            {
                existing.IsOpen = item.IsOpen;
                if (item.IsOpen)
                {
                    existing.OpeningTime = TimeSpan.Parse(item.OpeningTime);
                    existing.ClosingTime = TimeSpan.Parse(item.ClosingTime);
                }
            }
        }

        await _context.SaveChangesAsync();
        return await GetAllAsync();
    }
}
