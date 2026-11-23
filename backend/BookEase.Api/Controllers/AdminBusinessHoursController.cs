using BookEase.Api.DTOs;
using BookEase.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookEase.Api.Controllers;

[ApiController]
[Route("api/admin/business-hours")]
[Authorize]
public class AdminBusinessHoursController : ControllerBase
{
    private readonly BusinessHourService _businessHourService;

    public AdminBusinessHoursController(BusinessHourService businessHourService)
    {
        _businessHourService = businessHourService;
    }

    [HttpGet]
    public async Task<ActionResult<List<BusinessHourDto>>> GetBusinessHours()
    {
        var hours = await _businessHourService.GetAllAsync();
        return Ok(hours);
    }

    [HttpPut]
    public async Task<ActionResult<List<BusinessHourDto>>> UpdateBusinessHours(
        [FromBody] UpdateBusinessHoursRequest request)
    {
        try
        {
            var hours = await _businessHourService.UpdateAllAsync(request);
            return Ok(hours);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ProblemDetails { Title = "Validation Error", Detail = ex.Message });
        }
    }
}
