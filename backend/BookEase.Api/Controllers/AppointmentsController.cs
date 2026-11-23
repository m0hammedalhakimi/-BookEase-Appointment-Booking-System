using BookEase.Api.DTOs;
using BookEase.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookEase.Api.Controllers;

[ApiController]
[Route("api/appointments")]
public class AppointmentsController : ControllerBase
{
    private readonly AppointmentService _appointmentService;

    public AppointmentsController(AppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpPost]
    public async Task<ActionResult<BookingConfirmationDto>> CreateAppointment(
        [FromBody] CreateAppointmentRequest request)
    {
        try
        {
            var result = await _appointmentService.CreateAppointmentAsync(request);
            return CreatedAtAction(nameof(CreateAppointment), result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ProblemDetails { Title = "Booking Conflict", Detail = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ProblemDetails { Title = "Validation Error", Detail = ex.Message });
        }
    }

    [HttpPost("manage/verify")]
    public async Task<ActionResult<AppointmentDto>> VerifyBooking(
        [FromBody] VerifyBookingRequest request)
    {
        var result = await _appointmentService.VerifyAndGetAppointmentAsync(
            request.BookingReference, request.ManagementCode);

        if (result == null)
            return Unauthorized(new ProblemDetails { Title = "Verification Failed", Detail = "Invalid booking reference or management code." });

        return Ok(result);
    }

    [HttpGet("manage/{reference}")]
    public ActionResult GetByReference(string reference)
    {
        return BadRequest(new ProblemDetails
        {
            Title = "Verification Required",
            Detail = "Use POST /api/appointments/manage/verify to access appointment details."
        });
    }

    [HttpPut("manage/{reference}/reschedule")]
    public async Task<ActionResult<AppointmentDto>> RescheduleAppointment(
        string reference, [FromBody] RescheduleRequest request)
    {
        try
        {
            var result = await _appointmentService.RescheduleAppointmentAsync(reference, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new ProblemDetails { Title = "Unauthorized", Detail = "Invalid management code." });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ProblemDetails { Title = "Reschedule Error", Detail = ex.Message });
        }
    }

    [HttpPost("manage/{reference}/cancel")]
    public async Task<ActionResult<AppointmentDto>> CancelAppointment(
        string reference, [FromBody] CancelRequest request)
    {
        try
        {
            var result = await _appointmentService.CancelAppointmentAsync(reference, request.ManagementCode);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new ProblemDetails { Title = "Unauthorized", Detail = "Invalid management code." });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ProblemDetails { Title = "Cancellation Error", Detail = ex.Message });
        }
    }
}
