import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ServiceDto,
  CreateServiceRequest,
  UpdateServiceRequest
} from '../models/service.model';
import {
  AppointmentDto,
  AppointmentListResponse,
  AppointmentStatusUpdateRequest
} from '../models/appointment.model';
import { BusinessHourDto, UpdateBusinessHoursRequest } from '../models/business-hour.model';
import { DashboardSummaryDto } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly baseUrl = 'http://localhost:5000/api/admin';

  constructor(private http: HttpClient) {}

  getDashboardSummary(): Observable<DashboardSummaryDto> {
    return this.http.get<DashboardSummaryDto>(`${this.baseUrl}/dashboard/summary`);
  }

  getAppointments(params: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    serviceId?: number;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Observable<AppointmentListResponse> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    if (params.serviceId) httpParams = httpParams.set('serviceId', params.serviceId.toString());
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());

    return this.http.get<AppointmentListResponse>(`${this.baseUrl}/appointments`, { params: httpParams });
  }

  getAppointmentById(id: number): Observable<AppointmentDto> {
    return this.http.get<AppointmentDto>(`${this.baseUrl}/appointments/${id}`);
  }

  updateAppointmentStatus(id: number, request: AppointmentStatusUpdateRequest): Observable<AppointmentDto> {
    return this.http.put<AppointmentDto>(`${this.baseUrl}/appointments/${id}/status`, request);
  }

  getAllServices(): Observable<ServiceDto[]> {
    return this.http.get<ServiceDto[]>(`${this.baseUrl}/services`);
  }

  createService(request: CreateServiceRequest): Observable<ServiceDto> {
    return this.http.post<ServiceDto>(`${this.baseUrl}/services`, request);
  }

  updateService(id: number, request: UpdateServiceRequest): Observable<ServiceDto> {
    return this.http.put<ServiceDto>(`${this.baseUrl}/services/${id}`, request);
  }

  updateServiceStatus(id: number, isActive: boolean): Observable<ServiceDto> {
    return this.http.patch<ServiceDto>(`${this.baseUrl}/services/${id}/status`, { isActive });
  }

  getBusinessHours(): Observable<BusinessHourDto[]> {
    return this.http.get<BusinessHourDto[]>(`${this.baseUrl}/business-hours`);
  }

  updateBusinessHours(request: UpdateBusinessHoursRequest): Observable<BusinessHourDto[]> {
    return this.http.put<BusinessHourDto[]>(`${this.baseUrl}/business-hours`, request);
  }
}
