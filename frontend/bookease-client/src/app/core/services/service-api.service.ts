import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceDto } from '../models/service.model';

@Injectable({ providedIn: 'root' })
export class ServiceApiService {
  private readonly baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getActiveServices(): Observable<ServiceDto[]> {
    return this.http.get<ServiceDto[]>(`${this.baseUrl}/services`);
  }

  getServiceById(id: number): Observable<ServiceDto> {
    return this.http.get<ServiceDto>(`${this.baseUrl}/services/${id}`);
  }
}
