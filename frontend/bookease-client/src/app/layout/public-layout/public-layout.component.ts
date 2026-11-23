import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicHeaderComponent } from '../public-header/public-header.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, PublicHeaderComponent],
  template: `
    <app-public-header />
    <main class="main-content">
      <router-outlet />
    </main>
    <footer class="footer">
      <p>&copy; 2024 BookEase - نظام حجز المواعيد</p>
    </footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .main-content { flex: 1; padding: 2rem 1rem; max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .footer { text-align: center; padding: 1.5rem; color: #6b7280; font-size: 0.875rem; border-top: 1px solid #e5e7eb; }
  `]
})
export class PublicLayoutComponent {}
