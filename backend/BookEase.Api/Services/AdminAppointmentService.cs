using BookEase.Api.Configuration;
using BookEase.Api.Data;
using BookEase.Api.DTOs;
using BookEase.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BookEase.Api.Services;

public class AdminAppointmentService
{
    private readonly ApplicationDbContext _context;
    private readonly BusinessSettings _businessSettings;

    public AdminAppointmentService(ApplicationDbContext context, IOptions<BusinessSettings> businessSettings)
    {
        _context = context;
        _businessSettings = businessSettings.Value;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(_businessSettings.TimeZoneId);
        var nowUtc = DateTimeOffset.UtcNow;
        var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(nowUtc.UtcDateTime, tz).Date;

        var todayStartUtc = new DateTimeOffset(todayLocal, tz.GetUtcOffset(todayLocal)).ToUniversalTime();
        var todayEndUtc = todayStartUtc.AddDays(1);

        var allAppointments = await _context.Appointments.ToListAsync();

        var totalAppointments = allAppointments.Count;
        var pendingAppointments = allAppointments.Count(a => a.Status == AppointmentStatus.Pending);
        var confirmedAppointments = allAppointments.Count(a => a.Status == AppointmentStatus.Confirmed);
        var cancelledAppointments = allAppointments.Count(a => a.Status == AppointmentStatus.Cancelled);
        var completedAppointments = allAppointments.Count(a => a.Status == AppointmentStatus.Completed);

        var todayAppointments = allAppointments.Count(a =>
            a.StartAtUtc >= todayStartUtc && a.StartAtUtc < todayEndUtc
            && a.Status != AppointmentStatus.Cancelled);

        var upcomingAppointments = allAppointments.Count(a =>
            a.StartAtUtc > nowUtc
            && a.Status != AppointmentStatus.Cancelled);

        var recentBookings = await _context.Appointments
            .Include(a => a.Service)
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(5)
            .ToListAsync();

        var todaySchedule = await _context.Appointments
            .Include(a => a.Service)
            .Where(a => a.StartAtUtc >= todayStartUtc && a.StartAtUtc < todayEndUtc
                && a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.StartAtUtc)
            .ToListAsync();

        var statusDistribution = allAppointments
            .GroupBy(a => a.Status)
            .Select(g => new StatusDistributionItem
            {
                Status = g.Key.ToString(),
                Count = g.Count()
            })
            .ToList();

        return new DashboardSummaryDto
        {
            TotalAppointments = totalAppointments,
            PendingAppointments = pendingAppointments,
            ConfirmedAppointments = confirmedAppointments,
            CancelledAppointments = cancelledAppointments,
            CompletedAppointments = completedAppointments,
            TodayAppointments = todayAppointments,
            UpcomingAppointments = upcomingAppointments,
            RecentBookings = recentBookings.Select(MapToDto).ToList(),
            StatusDistribution = statusDistribution,
            TodaySchedule = todaySchedule.Select(MapToDto).ToList()
        };
    }

    public async Task<AppointmentListResponse> GetAppointmentsAsync(
        string? search, string? dateFrom, string? dateTo,
        int? serviceId, string? status, int page = 1, int pageSize = 10)
    {
        var query = _context.Appointments.Include(a => a.Service).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.Trim().ToLower();
            query = query.Where(a =>
                a.CustomerName.ToLower().Contains(searchTerm) ||
                a.BookingReference.ToLower().Contains(searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(dateFrom) && DateTimeOffset.TryParse(dateFrom, out var fromDate))
            query = query.Where(a => a.StartAtUtc >= fromDate);

        if (!string.IsNullOrWhiteSpace(dateTo) && DateTimeOffset.TryParse(dateTo, out var toDate))
            query = query.Where(a => a.StartAtUtc <= toDate.AddDays(1));

        if (serviceId.HasValue)
            query = query.Where(a => a.ServiceId == serviceId.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<AppointmentStatus>(status, true, out var statusEnum))
            query = query.Where(a => a.Status == statusEnum);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.StartAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new AppointmentListResponse
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AppointmentDto?> GetAppointmentByIdAsync(int id)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.Id == id);

        return appointment == null ? null : MapToDto(appointment);
    }

    public async Task<AppointmentDto> UpdateAppointmentStatusAsync(int id, string newStatus)
    {
        if (!Enum.TryParse<AppointmentStatus>(newStatus, true, out var statusEnum))
            throw new ArgumentException("Invalid status.");

        var appointment = await _context.Appointments
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appointment == null)
            throw new InvalidOperationException("Appointment not found.");

        var validTransitions = new Dictionary<AppointmentStatus, AppointmentStatus[]>
        {
            { AppointmentStatus.Pending, new[] { AppointmentStatus.Confirmed, AppointmentStatus.Cancelled } },
            { AppointmentStatus.Confirmed, new[] { AppointmentStatus.Completed, AppointmentStatus.Cancelled } },
            { AppointmentStatus.Cancelled, Array.Empty<AppointmentStatus>() },
            { AppointmentStatus.Completed, Array.Empty<AppointmentStatus>() }
        };

        if (!validTransitions.ContainsKey(appointment.Status) ||
            !validTransitions[appointment.Status].Contains(statusEnum))
        {
            throw new InvalidOperationException(
                $"Cannot transition from {appointment.Status} to {statusEnum}.");
        }

        appointment.Status = statusEnum;
        appointment.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();

        return MapToDto(appointment);
    }

    private static AppointmentDto MapToDto(Appointment a) => new()
    {
        Id = a.Id,
        BookingReference = a.BookingReference,
        CustomerName = a.CustomerName,
        CustomerPhone = a.CustomerPhone,
        CustomerEmail = a.CustomerEmail,
        Notes = a.Notes,
        ServiceId = a.ServiceId,
        ServiceName = a.Service?.Name ?? string.Empty,
        DurationMinutes = a.Service?.DurationMinutes ?? 0,
        StartAtUtc = a.StartAtUtc,
        EndAtUtc = a.EndAtUtc,
        Status = a.Status.ToString(),
        CreatedAtUtc = a.CreatedAtUtc,
        UpdatedAtUtc = a.UpdatedAtUtc
    };
}
