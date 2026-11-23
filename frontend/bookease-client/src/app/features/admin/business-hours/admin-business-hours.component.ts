import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { BusinessHourDto } from '../../../core/models/business-hour.model';

@Component({
  selector: 'app-admin-business-hours',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hours-page">
      <h1>ساعات العمل</h1>
      @if (loading()) { <div class="loading">جاري التحميل...</div> }
      @else {
        <div class="hours-card">
          @for (hour of hours(); track hour.dayOfWeek) {
            <div class="day-row">
              <span class="day-name">{{ getDayName(hour.dayOfWeek) }}</span>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="hour.isOpen">
                <span class="toggle-label">{{ hour.isOpen ? 'مفتوح' : 'مغلق' }}</span>
              </label>
              @if (hour.isOpen) {
                <div class="time-inputs">
                  <input type="time" [(ngModel)]="hour.openingTime" dir="ltr">
                  <span class="separator">-</span>
                  <input type="time" [(ngModel)]="hour.closingTime" dir="ltr">
                </div>
              } @else {
                <div class="closed-label">يوم إجازة</div>
              }
            </div>
          }
          @if (saveMessage()) { <div class="success-msg">{{ saveMessage() }}</div> }
          @if (saveError()) { <div class="error-msg">{{ saveError() }}</div> }
          <button class="btn-save" [disabled]="saving()" (click)="saveHours()">{{ saving() ? 'جاري الحفظ...' : 'حفظ التعديلات' }}</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .hours-page h1 { font-size: 1.5rem; color: #1f2937; margin-bottom: 1.5rem; }
    .hours-card { background: white; border-radius: 12px; padding: 1.5rem; }
    .day-row { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; flex-wrap: wrap; }
    .day-name { font-weight: 600; min-width: 80px; color: #1f2937; }
    .toggle { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; min-width: 90px; }
    .toggle input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
    .toggle-label { font-size: 0.85rem; color: #4b5563; }
    .time-inputs { display: flex; align-items: center; gap: 0.5rem; }
    .time-inputs input { padding: 0.4rem 0.5rem; border: 1.5px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; }
    .time-inputs input:focus { outline: none; border-color: #1a56db; }
    .separator { color: #6b7280; }
    .closed-label { color: #9ca3af; font-size: 0.85rem; font-style: italic; }
    .btn-save { width: 100%; padding: 0.75rem; background: #1a56db; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 1.5rem; }
    .btn-save:hover { background: #1e40af; }
    .btn-save:disabled { background: #9ca3af; }
    .success-msg { background: #f0fdf4; color: #166534; padding: 0.5rem; border-radius: 6px; text-align: center; margin-top: 1rem; }
    .error-msg { background: #fef2f2; color: #dc2626; padding: 0.5rem; border-radius: 6px; text-align: center; margin-top: 1rem; }
    .loading { text-align: center; color: #6b7280; padding: 3rem; }
  `]
})
export class AdminBusinessHoursComponent implements OnInit {
  hours = signal<BusinessHourDto[]>([]);
  loading = signal(true);
  saving = signal(false);
  saveMessage = signal('');
  saveError = signal('');
  private dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  constructor(private adminApi: AdminApiService) {}

  ngOnInit() {
    this.adminApi.getBusinessHours().subscribe({ next: (data) => { this.hours.set(data); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  getDayName(day: number): string { return this.dayNames[day] || ''; }

  saveHours() {
    this.saving.set(true); this.saveMessage.set(''); this.saveError.set('');
    this.adminApi.updateBusinessHours({
      hours: this.hours().map(h => ({ dayOfWeek: h.dayOfWeek, isOpen: h.isOpen, openingTime: h.openingTime, closingTime: h.closingTime }))
    }).subscribe({
      next: (data) => { this.hours.set(data); this.saving.set(false); this.saveMessage.set('تم حفظ التعديلات بنجاح'); },
      error: (err) => { this.saving.set(false); this.saveError.set(err.error?.detail || 'حدث خطأ أثناء الحفظ'); }
    });
  }
}
