using BookEase.Api.Data;
using BookEase.Api.DTOs;
using BookEase.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace BookEase.Api.Services;

public class ServiceManagementService
{
    private readonly ApplicationDbContext _context;

    public ServiceManagementService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ServiceDto>> GetAllServicesAsync(bool activeOnly = false)
    {
        var query = _context.Services.AsQueryable();
        if (activeOnly)
            query = query.Where(s => s.IsActive);

        return await query
            .OrderBy(s => s.Name)
            .Select(s => new ServiceDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                DurationMinutes = s.DurationMinutes,
                IsActive = s.IsActive,
                CreatedAtUtc = s.CreatedAtUtc,
                UpdatedAtUtc = s.UpdatedAtUtc
            })
            .ToListAsync();
    }

    public async Task<ServiceDto?> GetServiceByIdAsync(int id)
    {
        var service = await _context.Services.FindAsync(id);
        if (service == null) return null;

        return new ServiceDto
        {
            Id = service.Id,
            Name = service.Name,
            Description = service.Description,
            DurationMinutes = service.DurationMinutes,
            IsActive = service.IsActive,
            CreatedAtUtc = service.CreatedAtUtc,
            UpdatedAtUtc = service.UpdatedAtUtc
        };
    }

    public async Task<ServiceDto> CreateServiceAsync(CreateServiceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Service name is required.");

        if (request.DurationMinutes <= 0)
            throw new ArgumentException("Duration must be greater than zero.");

        var service = new Service
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            DurationMinutes = request.DurationMinutes,
            IsActive = request.IsActive,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();

        return new ServiceDto
        {
            Id = service.Id,
            Name = service.Name,
            Description = service.Description,
            DurationMinutes = service.DurationMinutes,
            IsActive = service.IsActive,
            CreatedAtUtc = service.CreatedAtUtc,
            UpdatedAtUtc = service.UpdatedAtUtc
        };
    }

    public async Task<ServiceDto> UpdateServiceAsync(int id, UpdateServiceRequest request)
    {
        var service = await _context.Services.FindAsync(id);
        if (service == null)
            throw new InvalidOperationException("Service not found.");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Service name is required.");

        if (request.DurationMinutes <= 0)
            throw new ArgumentException("Duration must be greater than zero.");

        service.Name = request.Name.Trim();
        service.Description = request.Description?.Trim() ?? string.Empty;
        service.DurationMinutes = request.DurationMinutes;
        service.IsActive = request.IsActive;
        service.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        return new ServiceDto
        {
            Id = service.Id,
            Name = service.Name,
            Description = service.Description,
            DurationMinutes = service.DurationMinutes,
            IsActive = service.IsActive,
            CreatedAtUtc = service.CreatedAtUtc,
            UpdatedAtUtc = service.UpdatedAtUtc
        };
    }

    public async Task<ServiceDto> UpdateServiceStatusAsync(int id, bool isActive)
    {
        var service = await _context.Services.FindAsync(id);
        if (service == null)
            throw new InvalidOperationException("Service not found.");

        service.IsActive = isActive;
        service.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();

        return new ServiceDto
        {
            Id = service.Id,
            Name = service.Name,
            Description = service.Description,
            DurationMinutes = service.DurationMinutes,
            IsActive = service.IsActive,
            CreatedAtUtc = service.CreatedAtUtc,
            UpdatedAtUtc = service.UpdatedAtUtc
        };
    }
}
