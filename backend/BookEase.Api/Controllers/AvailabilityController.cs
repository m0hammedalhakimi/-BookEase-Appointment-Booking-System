using BookEase.Api.DTOs;
using BookEase.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookEase.Api.Controllers;

[ApiController]
[Route("api/availability")]
public class AvailabilityController : ControllerBase
{
    private readonly AppointmentService _appointmentService;

    public AvailabilityController(AppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpGet]
    public async Task<ActionResult<AvailabilityResponse>> GetAvailability(
        [FromQuery] int serviceId, [FromQuery] string date)
    {
        try
        {
            var result = await _appointmentService.GetAvailableSlotsAsync(serviceId, date);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid Request", Detail = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid Request", Detail = ex.Message });
        }
    }
}
