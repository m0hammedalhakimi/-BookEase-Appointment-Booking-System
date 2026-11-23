import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AvailabilityResponse } from '../models/availability.model';

@Injectable({ providedIn: 'root' })
export class AvailabilityApiService {
  private readonly baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getAvailability(serviceId: number, date: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(
      `${this.baseUrl}/availability?serviceId=${serviceId}&date=${date}`
    );
  }
}
