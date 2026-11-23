import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="container">
        <a routerLink="/" class="logo">
          <span class="logo-icon">📅</span>
          <span class="logo-text">BookEase</span>
        </a>
        <nav class="nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">الرئيسية</a>
          <a routerLink="/booking" routerLinkActive="active">حجز موعد</a>
          <a routerLink="/manage-booking" routerLinkActive="active">إدارة الحجز</a>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .header { background: #1a56db; color: white; padding: 0 1rem; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    .container { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .logo { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: white; font-size: 1.4rem; font-weight: 700; }
    .logo-icon { font-size: 1.6rem; }
    .nav { display: flex; gap: 0.25rem; }
    .nav a { color: rgba(255,255,255,0.85); text-decoration: none; padding: 0.5rem 1rem; border-radius: 8px; transition: all 0.2s; font-size: 0.95rem; }
    .nav a:hover { background: rgba(255,255,255,0.15); color: white; }
    .nav a.active { background: rgba(255,255,255,0.2); color: white; font-weight: 600; }
    @media (max-width: 600px) { .nav a { padding: 0.4rem 0.6rem; font-size: 0.85rem; } .logo { font-size: 1.1rem; } }
  `]
})
export class PublicHeaderComponent {}
