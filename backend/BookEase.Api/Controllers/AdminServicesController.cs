using BookEase.Api.DTOs;
using BookEase.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookEase.Api.Controllers;

[ApiController]
[Route("api/admin/services")]
[Authorize]
public class AdminServicesController : ControllerBase
{
    private readonly ServiceManagementService _serviceManagement;

    public AdminServicesController(ServiceManagementService serviceManagement)
    {
        _serviceManagement = serviceManagement;
    }

    [HttpGet]
    public async Task<ActionResult<List<ServiceDto>>> GetAllServices()
    {
        var services = await _serviceManagement.GetAllServicesAsync();
        return Ok(services);
    }

    [HttpPost]
    public async Task<ActionResult<ServiceDto>> CreateService([FromBody] CreateServiceRequest request)
    {
        try
        {
            var service = await _serviceManagement.CreateServiceAsync(request);
            return CreatedAtAction(nameof(CreateService), service);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ProblemDetails { Title = "Validation Error", Detail = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ServiceDto>> UpdateService(int id, [FromBody] UpdateServiceRequest request)
    {
        try
        {
            var service = await _serviceManagement.UpdateServiceAsync(id, request);
            return Ok(service);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new ProblemDetails { Title = "Not Found", Detail = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ProblemDetails { Title = "Validation Error", Detail = ex.Message });
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<ServiceDto>> UpdateServiceStatus(
        int id, [FromBody] ServiceStatusRequest request)
    {
        try
        {
            var service = await _serviceManagement.UpdateServiceStatusAsync(id, request.IsActive);
            return Ok(service);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new ProblemDetails { Title = "Not Found", Detail = ex.Message });
        }
    }
}
