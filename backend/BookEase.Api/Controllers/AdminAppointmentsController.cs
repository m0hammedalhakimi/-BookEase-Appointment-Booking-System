using BookEase.Api.DTOs;
using BookEase.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookEase.Api.Controllers;

[ApiController]
[Route("api/admin/appointments")]
[Authorize]
public class AdminAppointmentsController : ControllerBase
{
    private readonly AdminAppointmentService _adminAppointmentService;

    public AdminAppointmentsController(AdminAppointmentService adminAppointmentService)
    {
        _adminAppointmentService = adminAppointmentService;
    }

    [HttpGet]
    public async Task<ActionResult<AppointmentListResponse>> GetAppointments(
        [FromQuery] string? search,
        [FromQuery] string? dateFrom,
        [FromQuery] string? dateTo,
        [FromQuery] int? serviceId,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _adminAppointmentService.GetAppointmentsAsync(
            search, dateFrom, dateTo, serviceId, status, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AppointmentDto>> GetAppointment(int id)
    {
        var appointment = await _adminAppointmentService.GetAppointmentByIdAsync(id);
        if (appointment == null)
            return NotFound();
        return Ok(appointment);
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult<AppointmentDto>> UpdateStatus(
        int id, [FromBody] AppointmentStatusUpdateRequest request)
    {
        try
        {
            var result = await _adminAppointmentService.UpdateAppointmentStatusAsync(id, request.Status);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails { Title = "Status Update Error", Detail = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid Status", Detail = ex.Message });
        }
    }
}
