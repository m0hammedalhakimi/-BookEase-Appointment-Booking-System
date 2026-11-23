namespace BookEase.Api.DTOs;

public class AvailabilityRequest
{
    public int ServiceId { get; set; }
    public string Date { get; set; } = string.Empty;
}

public class TimeSlotDto
{
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public DateTimeOffset StartAtUtc { get; set; }
    public DateTimeOffset EndAtUtc { get; set; }
}

public class AvailabilityResponse
{
    public string Date { get; set; } = string.Empty;
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public string BusinessTimeZone { get; set; } = string.Empty;
    public List<TimeSlotDto> AvailableSlots { get; set; } = new();
}
