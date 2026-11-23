import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { LoginRequest, LoginResponse, AdminUserDto } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'http://localhost:5000/api/admin/auth';
  private readonly TOKEN_KEY = 'bookease_admin_token';

  private _isLoggedIn = signal(this.hasStoredToken());
  private _currentUser = signal<AdminUserDto | null>(null);

  isLoggedIn = computed(() => this._isLoggedIn());
  currentUser = computed(() => this._currentUser());

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this._isLoggedIn.set(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._isLoggedIn.set(false);
    this._currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): Observable<AdminUserDto | null> {
    return this.http.get<AdminUserDto>(`${this.baseUrl}/me`).pipe(
      tap(user => this._currentUser.set(user)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  private hasStoredToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
