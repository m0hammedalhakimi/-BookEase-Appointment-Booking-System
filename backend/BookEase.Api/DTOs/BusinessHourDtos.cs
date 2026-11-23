namespace BookEase.Api.DTOs;

public class BusinessHourDto
{
    public int Id { get; set; }
    public int DayOfWeek { get; set; }
    public bool IsOpen { get; set; }
    public string OpeningTime { get; set; } = string.Empty;
    public string ClosingTime { get; set; } = string.Empty;
}

public class UpdateBusinessHoursRequest
{
    public List<BusinessHourItem> Hours { get; set; } = new();
}

public class BusinessHourItem
{
    public int DayOfWeek { get; set; }
    public bool IsOpen { get; set; }
    public string OpeningTime { get; set; } = string.Empty;
    public string ClosingTime { get; set; } = string.Empty;
}
