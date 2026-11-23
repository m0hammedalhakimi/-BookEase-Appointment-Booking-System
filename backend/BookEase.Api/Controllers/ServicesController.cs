using BookEase.Api.DTOs;
using BookEase.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookEase.Api.Controllers;

[ApiController]
[Route("api/services")]
public class ServicesController : ControllerBase
{
    private readonly ServiceManagementService _serviceManagement;

    public ServicesController(ServiceManagementService serviceManagement)
    {
        _serviceManagement = serviceManagement;
    }

    [HttpGet]
    public async Task<ActionResult<List<ServiceDto>>> GetActiveServices()
    {
        var services = await _serviceManagement.GetAllServicesAsync(activeOnly: true);
        return Ok(services);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ServiceDto>> GetService(int id)
    {
        var service = await _serviceManagement.GetServiceByIdAsync(id);
        if (service == null || !service.IsActive)
            return NotFound();
        return Ok(service);
    }
}
