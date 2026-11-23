using System.Security.Cryptography;
using BookEase.Api.Configuration;
using BookEase.Api.Data;
using BookEase.Api.DTOs;
using BookEase.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BookEase.Api.Services;

public class AppointmentService
{
    private readonly ApplicationDbContext _context;
    private readonly BusinessSettings _businessSettings;
    private readonly TimeZoneInfo _businessTimeZone;

    public AppointmentService(ApplicationDbContext context, IOptions<BusinessSettings> businessSettings)
    {
        _context = context;
        _businessSettings = businessSettings.Value;
        _businessTimeZone = TimeZoneInfo.FindSystemTimeZoneById(_businessSettings.TimeZoneId);
    }

    public async Task<AvailabilityResponse> GetAvailableSlotsAsync(int serviceId, string dateString)
    {
        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == serviceId && s.IsActive);
        if (service == null)
            throw new InvalidOperationException("Service not found or inactive.");

        if (!DateOnly.TryParseExact(dateString, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out var requestedDate))
            throw new ArgumentException("Invalid date format. Use yyyy-MM-dd.");

        var dayOfWeek = requestedDate.DayOfWeek;
        var businessHour = await _context.BusinessHours.FirstOrDefaultAsync(b => b.DayOfWeek == dayOfWeek);

        if (businessHour == null || !businessHour.IsOpen)
        {
            return new AvailabilityResponse
            {
                Date = dateString,
                ServiceId = serviceId,
                ServiceName = service.Name,
                DurationMinutes = service.DurationMinutes,
                BusinessTimeZone = _businessSettings.TimeZoneId,
                AvailableSlots = new List<TimeSlotDto>()
            };
        }

        var openDateTime = new DateTime(requestedDate.Year, requestedDate.Month, requestedDate.Day,
            businessHour.OpeningTime.Hours, businessHour.OpeningTime.Minutes, 0);
        var closeDateTime = new DateTime(requestedDate.Year, requestedDate.Month, requestedDate.Day,
            businessHour.ClosingTime.Hours, businessHour.ClosingTime.Minutes, 0);

        var openUtc = new DateTimeOffset(openDateTime, _businessTimeZone.GetUtcOffset(openDateTime)).ToUniversalTime();
        var closeUtc = new DateTimeOffset(closeDateTime, _businessTimeZone.GetUtcOffset(closeDateTime)).ToUniversalTime();

        var nowUtc = DateTimeOffset.UtcNow;

        var existingAppointments = await _context.Appointments
            .Where(a => a.StartAtUtc < closeUtc && a.EndAtUtc > openUtc
                && (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed))
            .Select(a => new { a.StartAtUtc, a.EndAtUtc })
            .ToListAsync();

        var slotInterval = TimeSpan.FromMinutes(_businessSettings.SlotIntervalMinutes);
        var serviceDuration = TimeSpan.FromMinutes(service.DurationMinutes);
        var slots = new List<TimeSlotDto>();

        var currentSlotUtc = openUtc;
        while (currentSlotUtc + serviceDuration <= closeUtc)
        {
            if (currentSlotUtc > nowUtc)
            {
                var slotEndUtc = currentSlotUtc + serviceDuration;

                var hasConflict = existingAppointments.Any(a =>
                    a.StartAtUtc < slotEndUtc && a.EndAtUtc > currentSlotUtc);

                if (!hasConflict)
                {
                    var localStart = TimeZoneInfo.ConvertTimeFromUtc(currentSlotUtc.UtcDateTime, _businessTimeZone);
                    var localEnd = TimeZoneInfo.ConvertTimeFromUtc(slotEndUtc.UtcDateTime, _businessTimeZone);

                    slots.Add(new TimeSlotDto
                    {
                        StartTime = localStart.ToString("HH:mm"),
                        EndTime = localEnd.ToString("HH:mm"),
                        StartAtUtc = currentSlotUtc,
                        EndAtUtc = slotEndUtc
                    });
                }
            }

            currentSlotUtc += slotInterval;
        }

        return new AvailabilityResponse
        {
            Date = dateString,
            ServiceId = serviceId,
            ServiceName = service.Name,
            DurationMinutes = service.DurationMinutes,
            BusinessTimeZone = _businessSettings.TimeZoneId,
            AvailableSlots = slots
        };
    }

    public async Task<BookingConfirmationDto> CreateAppointmentAsync(CreateAppointmentRequest request)
    {
        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.IsActive);
        if (service == null)
            throw new InvalidOperationException("Service not found or inactive.");

        if (string.IsNullOrWhiteSpace(request.CustomerName))
            throw new ArgumentException("Customer name is required.");

        if (string.IsNullOrWhiteSpace(request.CustomerPhone))
            throw new ArgumentException("Phone number is required.");

        var endAtUtc = request.StartAtUtc.Add(TimeSpan.FromMinutes(service.DurationMinutes));

        if (request.StartAtUtc <= DateTimeOffset.UtcNow)
            throw new InvalidOperationException("Cannot book appointments in the past.");

        var localStart = TimeZoneInfo.ConvertTimeFromUtc(request.StartAtUtc.UtcDateTime, _businessTimeZone);
        var dayOfWeek = localStart.DayOfWeek;

        var businessHour = await _context.BusinessHours.FirstOrDefaultAsync(b => b.DayOfWeek == dayOfWeek);
        if (businessHour == null || !businessHour.IsOpen)
            throw new InvalidOperationException("Business is closed on the selected day.");

        var localStartTime = localStart.TimeOfDay;
        var localEnd = TimeZoneInfo.ConvertTimeFromUtc(endAtUtc.UtcDateTime, _businessTimeZone);
        var localEndTime = localEnd.TimeOfDay;

        if (localStartTime < businessHour.OpeningTime || localEndTime > businessHour.ClosingTime)
            throw new InvalidOperationException("Appointment time is outside business hours.");

        var bookingReference = GenerateBookingReference();
        var managementCode = GenerateManagementCode();
        var managementCodeHash = HashManagementCode(managementCode);

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                "EXEC sp_getapplock @Resource = 'BookingLock', @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 5000");

            var hasConflict = await _context.Appointments.AnyAsync(a =>
                a.StartAtUtc < endAtUtc && a.EndAtUtc > request.StartAtUtc
                && (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed));

            if (hasConflict)
                throw new InvalidOperationException("The selected time slot is no longer available.");

            var appointment = new Appointment
            {
                BookingReference = bookingReference,
                ManagementCodeHash = managementCodeHash,
                CustomerName = request.CustomerName.Trim(),
                CustomerPhone = request.CustomerPhone.Trim(),
                CustomerEmail = request.CustomerEmail?.Trim(),
                Notes = request.Notes?.Trim(),
                ServiceId = service.Id,
                StartAtUtc = request.StartAtUtc,
                EndAtUtc = endAtUtc,
                Status = AppointmentStatus.Pending,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BookingConfirmationDto
            {
                BookingReference = bookingReference,
                ManagementCode = managementCode,
                CustomerName = appointment.CustomerName,
                ServiceName = service.Name,
                DurationMinutes = service.DurationMinutes,
                StartAtUtc = appointment.StartAtUtc,
                EndAtUtc = appointment.EndAtUtc,
                Status = appointment.Status.ToString()
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<AppointmentDto?> VerifyAndGetAppointmentAsync(string bookingReference, string managementCode)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.BookingReference == bookingReference);

        if (appointment == null)
            return null;

        if (!VerifyManagementCode(managementCode, appointment.ManagementCodeHash))
            return null;

        return MapToDto(appointment);
    }

    public async Task<AppointmentDto> RescheduleAppointmentAsync(string bookingReference, RescheduleRequest request)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.BookingReference == bookingReference);

        if (appointment == null)
            throw new InvalidOperationException("Appointment not found.");

        if (!VerifyManagementCode(request.ManagementCode, appointment.ManagementCodeHash))
            throw new UnauthorizedAccessException("Invalid management code.");

        if (appointment.Status == AppointmentStatus.Cancelled || appointment.Status == AppointmentStatus.Completed)
            throw new InvalidOperationException("This appointment cannot be rescheduled.");

        if (appointment.StartAtUtc <= DateTimeOffset.UtcNow)
            throw new InvalidOperationException("Past appointments cannot be rescheduled.");

        if (request.NewStartAtUtc <= DateTimeOffset.UtcNow)
            throw new InvalidOperationException("Cannot reschedule to a past time.");

        var service = appointment.Service;
        if (!service.IsActive)
            throw new InvalidOperationException("The service for this appointment is no longer active.");

        var newEndAtUtc = request.NewStartAtUtc.Add(TimeSpan.FromMinutes(service.DurationMinutes));

        var localStart = TimeZoneInfo.ConvertTimeFromUtc(request.NewStartAtUtc.UtcDateTime, _businessTimeZone);
        var dayOfWeek = localStart.DayOfWeek;

        var businessHour = await _context.BusinessHours.FirstOrDefaultAsync(b => b.DayOfWeek == dayOfWeek);
        if (businessHour == null || !businessHour.IsOpen)
            throw new InvalidOperationException("Business is closed on the selected day.");

        var localEnd = TimeZoneInfo.ConvertTimeFromUtc(newEndAtUtc.UtcDateTime, _businessTimeZone);
        if (localStart.TimeOfDay < businessHour.OpeningTime || localEnd.TimeOfDay > businessHour.ClosingTime)
            throw new InvalidOperationException("Appointment time is outside business hours.");

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                "EXEC sp_getapplock @Resource = 'BookingLock', @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 5000");

            var hasConflict = await _context.Appointments.AnyAsync(a =>
                a.Id != appointment.Id
                && a.StartAtUtc < newEndAtUtc && a.EndAtUtc > request.NewStartAtUtc
                && (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed));

            if (hasConflict)
                throw new InvalidOperationException("The selected time slot is no longer available.");

            appointment.StartAtUtc = request.NewStartAtUtc;
            appointment.EndAtUtc = newEndAtUtc;
            appointment.UpdatedAtUtc = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return MapToDto(appointment);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<AppointmentDto> CancelAppointmentAsync(string bookingReference, string managementCode)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.BookingReference == bookingReference);

        if (appointment == null)
            throw new InvalidOperationException("Appointment not found.");

        if (!VerifyManagementCode(managementCode, appointment.ManagementCodeHash))
            throw new UnauthorizedAccessException("Invalid management code.");

        if (appointment.Status == AppointmentStatus.Cancelled)
            throw new InvalidOperationException("Appointment is already cancelled.");

        if (appointment.Status == AppointmentStatus.Completed)
            throw new InvalidOperationException("Completed appointments cannot be cancelled.");

        if (appointment.StartAtUtc <= DateTimeOffset.UtcNow)
            throw new InvalidOperationException("Past appointments cannot be cancelled.");

        appointment.Status = AppointmentStatus.Cancelled;
        appointment.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();

        return MapToDto(appointment);
    }

    private static string GenerateBookingReference()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var bytes = RandomNumberGenerator.GetBytes(8);
        var result = new char[8];
        for (int i = 0; i < 8; i++)
            result[i] = chars[bytes[i] % chars.Length];
        return "BK-" + new string(result);
    }

    private static string GenerateManagementCode()
    {
        var bytes = RandomNumberGenerator.GetBytes(16);
        return Convert.ToBase64String(bytes)
            .Replace("+", "")
            .Replace("/", "")
            .Replace("=", "")
            .Substring(0, 16);
    }

    private static string HashManagementCode(string code)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(code));
        return Convert.ToBase64String(hashBytes);
    }

    private static bool VerifyManagementCode(string code, string storedHash)
    {
        var hash = HashManagementCode(code);
        return hash == storedHash;
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
