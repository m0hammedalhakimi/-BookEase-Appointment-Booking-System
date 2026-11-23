namespace BookEase.Api.Configuration;

public class JwtSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 480;
}

public class BusinessSettings
{
    public string TimeZoneId { get; set; } = "Asia/Riyadh";
    public int SlotIntervalMinutes { get; set; } = 30;
}

public class AdminSeedSettings
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
