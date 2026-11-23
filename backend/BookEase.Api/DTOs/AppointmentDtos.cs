namespace BookEase.Api.DTOs;

public class CreateAppointmentRequest
{
    public int ServiceId { get; set; }
    public DateTimeOffset StartAtUtc { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? Notes { get; set; }
}

public class AppointmentDto
{
    public int Id { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? Notes { get; set; }
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public DateTimeOffset StartAtUtc { get; set; }
    public DateTimeOffset EndAtUtc { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public class BookingConfirmationDto
{
    public string BookingReference { get; set; } = string.Empty;
    public string ManagementCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public DateTimeOffset StartAtUtc { get; set; }
    public DateTimeOffset EndAtUtc { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class VerifyBookingRequest
{
    public string BookingReference { get; set; } = string.Empty;
    public string ManagementCode { get; set; } = string.Empty;
}

public class RescheduleRequest
{
    public DateTimeOffset NewStartAtUtc { get; set; }
    public string ManagementCode { get; set; } = string.Empty;
}

public class CancelRequest
{
    public string ManagementCode { get; set; } = string.Empty;
}

public class AppointmentStatusUpdateRequest
{
    public string Status { get; set; } = string.Empty;
}

public class AppointmentListResponse
{
    public List<AppointmentDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
