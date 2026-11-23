using BookEase.Api.DTOs;
using BookEase.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookEase.Api.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize]
public class AdminDashboardController : ControllerBase
{
    private readonly AdminAppointmentService _adminAppointmentService;

    public AdminDashboardController(AdminAppointmentService adminAppointmentService)
    {
        _adminAppointmentService = adminAppointmentService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary()
    {
        var summary = await _adminAppointmentService.GetDashboardSummaryAsync();
        return Ok(summary);
    }
}
