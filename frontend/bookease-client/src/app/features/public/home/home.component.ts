import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServiceApiService } from '../../../core/services/service-api.service';
import { ServiceDto } from '../../../core/models/service.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <h1>مرحباً بك في BookEase</h1>
      <p>نظام حجز المواعيد الذكي - احجز موعدك بسهولة وسرعة</p>
      <a routerLink="/booking" class="btn-primary">احجز موعدك الآن</a>
    </section>
    <section class="services-section">
      <h2>خدماتنا</h2>
      @if (loading()) {
        <div class="loading">جاري تحميل الخدمات...</div>
      } @else if (services().length === 0) {
        <div class="empty">لا توجد خدمات متاحة حالياً</div>
      } @else {
        <div class="services-grid">
          @for (service of services(); track service.id) {
            <div class="service-card">
              <div class="service-icon">✨</div>
              <h3>{{ service.name }}</h3>
              <p class="description">{{ service.description }}</p>
              <div class="duration"><span>⏱️</span><span>{{ service.durationMinutes }} دقيقة</span></div>
              <a [routerLink]="['/booking']" [queryParams]="{serviceId: service.id}" class="btn-book">احجز الآن</a>
            </div>
          }
        </div>
      }
    </section>
    <section class="manage-section">
      <div class="manage-card">
        <h2>لديك حجز مسبق؟</h2>
        <p>يمكنك الاطلاع على تفاصيل حجزك أو إعادة جدولته أو إلغائه</p>
        <a routerLink="/manage-booking" class="btn-secondary">إدارة الحجز</a>
      </div>
    </section>
  `,
  styles: [`
    .hero { text-align: center; padding: 3rem 1rem; background: linear-gradient(135deg, #1a56db 0%, #1e40af 100%); color: white; border-radius: 16px; margin-bottom: 3rem; }
    .hero h1 { font-size: 2.2rem; margin-bottom: 0.75rem; }
    .hero p { font-size: 1.15rem; opacity: 0.9; margin-bottom: 1.5rem; }
    .btn-primary { display: inline-block; background: white; color: #1a56db; padding: 0.75rem 2rem; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 1.05rem; transition: transform 0.2s, box-shadow 0.2s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .services-section { margin-bottom: 3rem; }
    .services-section h2 { font-size: 1.6rem; margin-bottom: 1.5rem; color: #1f2937; text-align: center; }
    .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
    .service-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; text-align: center; transition: box-shadow 0.2s, transform 0.2s; }
    .service-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-2px); }
    .service-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .service-card h3 { font-size: 1.2rem; color: #1f2937; margin-bottom: 0.5rem; }
    .description { color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.6; }
    .duration { display: flex; align-items: center; justify-content: center; gap: 0.4rem; color: #4b5563; margin-bottom: 1rem; font-size: 0.9rem; }
    .btn-book { display: inline-block; background: #1a56db; color: white; padding: 0.5rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
    .btn-book:hover { background: #1e40af; }
    .manage-section { margin-bottom: 2rem; }
    .manage-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 2rem; text-align: center; }
    .manage-card h2 { color: #166534; font-size: 1.3rem; margin-bottom: 0.5rem; }
    .manage-card p { color: #4b5563; margin-bottom: 1rem; }
    .btn-secondary { display: inline-block; background: #16a34a; color: white; padding: 0.6rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
    .btn-secondary:hover { background: #15803d; }
    .loading, .empty { text-align: center; padding: 2rem; color: #6b7280; }
  `]
})
export class HomeComponent implements OnInit {
  services = signal<ServiceDto[]>([]);
  loading = signal(true);

  constructor(private serviceApi: ServiceApiService) {}

  ngOnInit() {
    this.serviceApi.getActiveServices().subscribe({
      next: (data) => { this.services.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
