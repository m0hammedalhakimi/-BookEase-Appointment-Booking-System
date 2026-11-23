namespace BookEase.Api.DTOs;

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
}

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
}

public class DashboardSummaryDto
{
    public int TotalAppointments { get; set; }
    public int PendingAppointments { get; set; }
    public int ConfirmedAppointments { get; set; }
    public int CancelledAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int TodayAppointments { get; set; }
    public int UpcomingAppointments { get; set; }
    public List<AppointmentDto> RecentBookings { get; set; } = new();
    public List<StatusDistributionItem> StatusDistribution { get; set; } = new();
    public List<AppointmentDto> TodaySchedule { get; set; } = new();
}

public class StatusDistributionItem
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}
