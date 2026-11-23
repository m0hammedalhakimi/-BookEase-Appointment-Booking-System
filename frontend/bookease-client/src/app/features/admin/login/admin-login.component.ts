import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-header"><span class="logo">📅</span><h1>BookEase</h1><p>تسجيل دخول المسؤول</p></div>
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group"><label for="username">اسم المستخدم</label><input id="username" type="text" formControlName="username" placeholder="admin" dir="ltr"></div>
          <div class="form-group"><label for="password">كلمة المرور</label><input id="password" type="password" formControlName="password" placeholder="كلمة المرور"></div>
          @if (error()) { <div class="error-msg">{{ error() }}</div> }
          <button type="submit" class="btn-login" [disabled]="loginForm.invalid || loading()">{{ loading() ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول' }}</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; }
    .login-card { background: white; border-radius: 16px; padding: 2.5rem; width: 100%; max-width: 400px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .login-header { text-align: center; margin-bottom: 2rem; }
    .login-header .logo { font-size: 3rem; }
    .login-header h1 { font-size: 1.5rem; color: #1f2937; margin: 0.5rem 0 0.25rem; }
    .login-header p { color: #6b7280; font-size: 0.9rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.3rem; font-size: 0.9rem; color: #374151; }
    .form-group input { width: 100%; padding: 0.7rem 1rem; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; }
    .form-group input:focus { outline: none; border-color: #1a56db; }
    .error-msg { background: #fef2f2; color: #dc2626; padding: 0.6rem; border-radius: 6px; text-align: center; margin-bottom: 1rem; font-size: 0.9rem; }
    .btn-login { width: 100%; padding: 0.75rem; background: #1a56db; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-login:hover { background: #1e40af; }
    .btn-login:disabled { background: #9ca3af; cursor: not-allowed; }
  `]
})
export class AdminLoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  error = signal('');

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({ username: ['', Validators.required], password: ['', Validators.required] });
  }

  onSubmit() {
    this.loading.set(true); this.error.set('');
    this.authService.login({ username: this.loginForm.get('username')?.value, password: this.loginForm.get('password')?.value }).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/admin/dashboard']); },
      error: () => { this.loading.set(false); this.error.set('اسم المستخدم أو كلمة المرور غير صحيحة'); }
    });
  }
}
