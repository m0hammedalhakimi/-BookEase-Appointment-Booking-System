import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="logo">📅 BookEase</span>
          <span class="subtitle">لوحة التحكم</span>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active">
            <span class="nav-icon">📊</span> الرئيسية
          </a>
          <a routerLink="/admin/appointments" routerLinkActive="active">
            <span class="nav-icon">📋</span> المواعيد
          </a>
          <a routerLink="/admin/services" routerLinkActive="active">
            <span class="nav-icon">⚙️</span> الخدمات
          </a>
          <a routerLink="/admin/business-hours" routerLinkActive="active">
            <span class="nav-icon">🕐</span> ساعات العمل
          </a>
        </nav>
        <div class="sidebar-footer">
          <a routerLink="/" class="back-link"><span class="nav-icon">🌐</span> الموقع العام</a>
          <button class="logout-btn" (click)="logout()"><span class="nav-icon">🚪</span> تسجيل الخروج</button>
        </div>
      </aside>
      <main class="admin-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .admin-layout { display: flex; min-height: 100vh; }
    .sidebar { width: 240px; background: #1f2937; color: white; display: flex; flex-direction: column; position: fixed; top: 0; right: 0; bottom: 0; z-index: 50; }
    .sidebar-header { padding: 1.25rem; border-bottom: 1px solid #374151; }
    .logo { font-size: 1.3rem; font-weight: 700; display: block; }
    .subtitle { font-size: 0.8rem; color: #9ca3af; }
    .sidebar-nav { flex: 1; padding: 1rem 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
    .sidebar-nav a { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 0.75rem; color: #d1d5db; text-decoration: none; border-radius: 8px; transition: all 0.2s; font-size: 0.9rem; }
    .sidebar-nav a:hover { background: #374151; color: white; }
    .sidebar-nav a.active { background: #1a56db; color: white; }
    .nav-icon { font-size: 1.1rem; }
    .sidebar-footer { padding: 0.75rem; border-top: 1px solid #374151; }
    .back-link { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; color: #9ca3af; text-decoration: none; border-radius: 6px; font-size: 0.85rem; }
    .back-link:hover { color: white; }
    .logout-btn { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem 0.75rem; background: none; border: none; color: #f87171; cursor: pointer; border-radius: 6px; font-size: 0.85rem; }
    .logout-btn:hover { background: #374151; }
    .admin-main { flex: 1; margin-right: 240px; padding: 2rem; background: #f3f4f6; min-height: 100vh; }
    @media (max-width: 768px) {
      .sidebar { width: 60px; }
      .sidebar-header .subtitle, .sidebar-nav a span:not(.nav-icon), .back-link span:not(.nav-icon), .logout-btn span:not(.nav-icon) { display: none; }
      .logo { font-size: 1rem; }
      .admin-main { margin-right: 60px; }
    }
  `]
})
export class AdminLayoutComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
