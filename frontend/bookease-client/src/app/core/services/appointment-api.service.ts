import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateAppointmentRequest,
  BookingConfirmationDto,
  AppointmentDto,
  VerifyBookingRequest,
  RescheduleRequest,
  CancelRequest
} from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentApiService {
  private readonly baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  createAppointment(request: CreateAppointmentRequest): Observable<BookingConfirmationDto> {
    return this.http.post<BookingConfirmationDto>(`${this.baseUrl}/appointments`, request);
  }

  verifyBooking(request: VerifyBookingRequest): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${this.baseUrl}/appointments/manage/verify`, request);
  }

  rescheduleAppointment(reference: string, request: RescheduleRequest): Observable<AppointmentDto> {
    return this.http.put<AppointmentDto>(
      `${this.baseUrl}/appointments/manage/${reference}/reschedule`, request
    );
  }

  cancelAppointment(reference: string, request: CancelRequest): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(
      `${this.baseUrl}/appointments/manage/${reference}/cancel`, request
    );
  }
}
