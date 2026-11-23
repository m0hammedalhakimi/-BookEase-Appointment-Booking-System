import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ServiceApiService } from '../../../core/services/service-api.service';
import { AvailabilityApiService } from '../../../core/services/availability-api.service';
import { AppointmentApiService } from '../../../core/services/appointment-api.service';
import { ServiceDto } from '../../../core/models/service.model';
import { TimeSlotDto } from '../../../core/models/availability.model';
import { BookingConfirmationDto } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="booking-container">
      <div class="steps-indicator">
        @for (step of stepLabels; track $index) {
          <div class="step" [class.active]="currentStep() >= $index" [class.current]="currentStep() === $index">
            <div class="step-number">{{ $index + 1 }}</div>
            <span class="step-label">{{ step }}</span>
          </div>
        }
      </div>

      @switch (currentStep()) {
        @case (0) {
          <div class="step-content">
            <h2>اختر الخدمة</h2>
            @if (loadingServices()) {
              <div class="loading">جاري تحميل الخدمات...</div>
            } @else {
              <div class="services-list">
                @for (service of services(); track service.id) {
                  <div class="service-option" [class.selected]="selectedService()?.id === service.id" (click)="selectService(service)">
                    <div class="service-info">
                      <h3>{{ service.name }}</h3>
                      <p>{{ service.description }}</p>
                      <span class="badge">{{ service.durationMinutes }} دقيقة</span>
                    </div>
                    <div class="check-mark" [class.visible]="selectedService()?.id === service.id">✓</div>
                  </div>
                }
              </div>
              <div class="actions">
                <button class="btn-next" [disabled]="!selectedService()" (click)="nextStep()">التالي</button>
              </div>
            }
          </div>
        }
        @case (1) {
          <div class="step-content">
            <h2>اختر التاريخ</h2>
            <div class="date-picker-wrapper">
              <input type="date" class="date-input" [min]="minDate" [value]="selectedDate()" (change)="onDateChange($event)">
            </div>
            <div class="actions">
              <button class="btn-back" (click)="prevStep()">السابق</button>
              <button class="btn-next" [disabled]="!selectedDate()" (click)="loadAvailability()">التالي</button>
            </div>
          </div>
        }
        @case (2) {
          <div class="step-content">
            <h2>اختر الوقت</h2>
            @if (loadingSlots()) {
              <div class="loading">جاري تحميل المواعيد المتاحة...</div>
            } @else if (availableSlots().length === 0) {
              <div class="empty-state">
                <p>لا توجد مواعيد متاحة في هذا التاريخ</p>
                <button class="btn-back" (click)="prevStep()">اختر تاريخاً آخر</button>
              </div>
            } @else {
              <div class="slots-grid">
                @for (slot of availableSlots(); track slot.startAtUtc) {
                  <button class="slot-btn" [class.selected]="selectedSlot()?.startAtUtc === slot.startAtUtc" (click)="selectSlot(slot)">
                    {{ slot.startTime }} - {{ slot.endTime }}
                  </button>
                }
              </div>
              <div class="actions">
                <button class="btn-back" (click)="prevStep()">السابق</button>
                <button class="btn-next" [disabled]="!selectedSlot()" (click)="nextStep()">التالي</button>
              </div>
            }
          </div>
        }
        @case (3) {
          <div class="step-content">
            <h2>بيانات العميل</h2>
            <form [formGroup]="customerForm" class="customer-form">
              <div class="form-group">
                <label for="customerName">الاسم الكامل *</label>
                <input id="customerName" type="text" formControlName="customerName" placeholder="أدخل اسمك الكامل">
                @if (customerForm.get('customerName')?.touched && customerForm.get('customerName')?.invalid) {
                  <span class="error">الاسم مطلوب</span>
                }
              </div>
              <div class="form-group">
                <label for="customerPhone">رقم الهاتف *</label>
                <input id="customerPhone" type="tel" formControlName="customerPhone" placeholder="05xxxxxxxx" dir="ltr">
                @if (customerForm.get('customerPhone')?.touched && customerForm.get('customerPhone')?.invalid) {
                  <span class="error">رقم الهاتف مطلوب</span>
                }
              </div>
              <div class="form-group">
                <label for="customerEmail">البريد الإلكتروني (اختياري)</label>
                <input id="customerEmail" type="email" formControlName="customerEmail" placeholder="email&#64;example.com" dir="ltr">
              </div>
              <div class="form-group">
                <label for="notes">ملاحظات (اختياري)</label>
                <textarea id="notes" formControlName="notes" rows="3" placeholder="أي ملاحظات إضافية"></textarea>
              </div>
            </form>
            <div class="actions">
              <button class="btn-back" (click)="prevStep()">السابق</button>
              <button class="btn-next" [disabled]="customerForm.invalid" (click)="nextStep()">مراجعة الحجز</button>
            </div>
          </div>
        }
        @case (4) {
          <div class="step-content">
            <h2>تأكيد الحجز</h2>
            <div class="summary-card">
              <div class="summary-row"><span class="label">الخدمة:</span><span class="value">{{ selectedService()?.name }}</span></div>
              <div class="summary-row"><span class="label">التاريخ:</span><span class="value">{{ selectedDate() }}</span></div>
              <div class="summary-row"><span class="label">الوقت:</span><span class="value">{{ selectedSlot()?.startTime }} - {{ selectedSlot()?.endTime }}</span></div>
              <div class="summary-row"><span class="label">المدة:</span><span class="value">{{ selectedService()?.durationMinutes }} دقيقة</span></div>
              <div class="summary-row"><span class="label">الاسم:</span><span class="value">{{ customerForm.get('customerName')?.value }}</span></div>
              <div class="summary-row"><span class="label">الهاتف:</span><span class="value" dir="ltr">{{ customerForm.get('customerPhone')?.value }}</span></div>
            </div>
            @if (bookingError()) {
              <div class="error-banner">{{ bookingError() }}</div>
            }
            <div class="actions">
              <button class="btn-back" [disabled]="submitting()" (click)="prevStep()">السابق</button>
              <button class="btn-confirm" [disabled]="submitting()" (click)="submitBooking()">
                {{ submitting() ? 'جاري الحجز...' : 'تأكيد الحجز' }}
              </button>
            </div>
          </div>
        }
        @case (5) {
          <div class="step-content confirmation-page">
            <div class="success-icon">✅</div>
            <h2>تم الحجز بنجاح!</h2>
            <div class="confirmation-card">
              <div class="summary-row">
                <span class="label">رقم الحجز:</span>
                <span class="value ref-code">{{ confirmation()?.bookingReference }}</span>
                <button class="copy-btn" (click)="copyToClipboard(confirmation()?.bookingReference || '')">نسخ</button>
              </div>
              <div class="summary-row important">
                <span class="label">رمز الإدارة:</span>
                <span class="value ref-code">{{ confirmation()?.managementCode }}</span>
                <button class="copy-btn" (click)="copyToClipboard(confirmation()?.managementCode || '')">نسخ</button>
              </div>
              <div class="warning-box">⚠️ احفظ رقم الحجز ورمز الإدارة. ستحتاجهما لإدارة حجزك لاحقاً.</div>
              <div class="summary-row"><span class="label">الخدمة:</span><span class="value">{{ confirmation()?.serviceName }}</span></div>
              <div class="summary-row"><span class="label">الموعد:</span><span class="value">{{ formatDateTime(confirmation()?.startAtUtc) }}</span></div>
              <div class="summary-row"><span class="label">الحالة:</span><span class="value status-badge pending">قيد الانتظار</span></div>
            </div>
            <div class="actions">
              <a routerLink="/" class="btn-back">العودة للرئيسية</a>
              <a routerLink="/manage-booking" class="btn-next">إدارة الحجز</a>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .booking-container { max-width: 700px; margin: 0 auto; }
    .steps-indicator { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .step { display: flex; align-items: center; gap: 0.3rem; opacity: 0.4; transition: opacity 0.3s; }
    .step.active { opacity: 1; }
    .step.current .step-number { background: #1a56db; color: white; }
    .step-number { width: 28px; height: 28px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; }
    .step.active .step-number { background: #bbf7d0; color: #166534; }
    .step.current .step-number { background: #1a56db; color: white; }
    .step-label { font-size: 0.8rem; color: #4b5563; }
    .step-content { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 2rem; }
    .step-content h2 { font-size: 1.3rem; color: #1f2937; margin-bottom: 1.5rem; text-align: center; }
    .services-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .service-option { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .service-option:hover { border-color: #93c5fd; }
    .service-option.selected { border-color: #1a56db; background: #eff6ff; }
    .service-info h3 { font-size: 1rem; margin-bottom: 0.25rem; }
    .service-info p { font-size: 0.85rem; color: #6b7280; margin-bottom: 0.4rem; }
    .badge { background: #f3f4f6; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8rem; color: #4b5563; }
    .check-mark { font-size: 1.3rem; color: #1a56db; visibility: hidden; }
    .check-mark.visible { visibility: visible; }
    .date-picker-wrapper { text-align: center; margin: 1.5rem 0; }
    .date-input { padding: 0.75rem 1.5rem; font-size: 1.1rem; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; direction: ltr; }
    .date-input:focus { outline: none; border-color: #1a56db; }
    .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
    .slot-btn { padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; font-size: 0.95rem; transition: all 0.2s; direction: ltr; text-align: center; }
    .slot-btn:hover { border-color: #93c5fd; background: #eff6ff; }
    .slot-btn.selected { border-color: #1a56db; background: #1a56db; color: white; }
    .customer-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .form-group label { font-weight: 600; font-size: 0.9rem; color: #374151; }
    .form-group input, .form-group textarea { padding: 0.7rem 1rem; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; transition: border-color 0.2s; }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #1a56db; }
    .error { color: #dc2626; font-size: 0.8rem; }
    .summary-card { background: #f9fafb; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; gap: 0.5rem; }
    .summary-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 0.9rem; }
    .value { color: #1f2937; font-weight: 600; }
    .actions { display: flex; justify-content: space-between; gap: 1rem; margin-top: 1.5rem; }
    .btn-next, .btn-confirm { background: #1a56db; color: white; padding: 0.7rem 2rem; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; text-decoration: none; }
    .btn-next:hover, .btn-confirm:hover { background: #1e40af; }
    .btn-next:disabled, .btn-confirm:disabled { background: #9ca3af; cursor: not-allowed; }
    .btn-back { background: #f3f4f6; color: #374151; padding: 0.7rem 2rem; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; transition: background 0.2s; text-decoration: none; text-align: center; }
    .btn-back:hover { background: #e5e7eb; }
    .btn-confirm { background: #16a34a; }
    .btn-confirm:hover { background: #15803d; }
    .confirmation-page { text-align: center; }
    .success-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    .ref-code { font-family: monospace; font-size: 1.1rem; letter-spacing: 1px; color: #1a56db; }
    .copy-btn { background: #eff6ff; color: #1a56db; border: 1px solid #bfdbfe; padding: 0.2rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .warning-box { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 0.75rem; margin: 0.75rem 0; font-size: 0.9rem; color: #92400e; }
    .summary-row.important { background: #fef3c7; padding: 0.75rem; border-radius: 6px; margin: 0.25rem 0; }
    .error-banner { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; text-align: center; }
    .loading, .empty-state { text-align: center; padding: 2rem; color: #6b7280; }
    .status-badge { padding: 0.2rem 0.75rem; border-radius: 12px; font-size: 0.85rem; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .confirmation-card { background: #f9fafb; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; text-align: right; }
    @media (max-width: 600px) { .step-content { padding: 1.25rem; } .slots-grid { grid-template-columns: repeat(2, 1fr); } .steps-indicator { gap: 0.3rem; } .step-label { display: none; } }
  `]
})
export class BookingComponent implements OnInit {
  stepLabels = ['الخدمة', 'التاريخ', 'الوقت', 'البيانات', 'التأكيد'];
  currentStep = signal(0);
  services = signal<ServiceDto[]>([]);
  loadingServices = signal(true);
  selectedService = signal<ServiceDto | null>(null);
  selectedDate = signal('');
  availableSlots = signal<TimeSlotDto[]>([]);
  loadingSlots = signal(false);
  selectedSlot = signal<TimeSlotDto | null>(null);
  submitting = signal(false);
  bookingError = signal('');
  confirmation = signal<BookingConfirmationDto | null>(null);
  customerForm: FormGroup;
  minDate: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private serviceApi: ServiceApiService,
    private availabilityApi: AvailabilityApiService,
    private appointmentApi: AppointmentApiService
  ) {
    this.customerForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', Validators.required],
      customerEmail: [''],
      notes: ['']
    });
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.serviceApi.getActiveServices().subscribe({
      next: (data) => {
        this.services.set(data);
        this.loadingServices.set(false);
        const preselectedId = this.route.snapshot.queryParamMap.get('serviceId');
        if (preselectedId) {
          const found = data.find(s => s.id === +preselectedId);
          if (found) { this.selectedService.set(found); this.currentStep.set(1); }
        }
      },
      error: () => this.loadingServices.set(false)
    });
  }

  selectService(service: ServiceDto) { this.selectedService.set(service); }

  onDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedDate.set(input.value);
    this.selectedSlot.set(null);
    this.availableSlots.set([]);
  }

  loadAvailability() {
    if (!this.selectedService() || !this.selectedDate()) return;
    this.loadingSlots.set(true);
    this.currentStep.set(2);
    this.availabilityApi.getAvailability(this.selectedService()!.id, this.selectedDate()).subscribe({
      next: (resp) => { this.availableSlots.set(resp.availableSlots); this.loadingSlots.set(false); },
      error: () => { this.availableSlots.set([]); this.loadingSlots.set(false); }
    });
  }

  selectSlot(slot: TimeSlotDto) { this.selectedSlot.set(slot); }
  nextStep() { this.currentStep.update(s => s + 1); }
  prevStep() { this.currentStep.update(s => Math.max(0, s - 1)); }

  submitBooking() {
    if (!this.selectedService() || !this.selectedSlot()) return;
    this.submitting.set(true);
    this.bookingError.set('');
    this.appointmentApi.createAppointment({
      serviceId: this.selectedService()!.id,
      startAtUtc: this.selectedSlot()!.startAtUtc,
      customerName: this.customerForm.get('customerName')?.value,
      customerPhone: this.customerForm.get('customerPhone')?.value,
      customerEmail: this.customerForm.get('customerEmail')?.value || undefined,
      notes: this.customerForm.get('notes')?.value || undefined
    }).subscribe({
      next: (result) => { this.confirmation.set(result); this.submitting.set(false); this.currentStep.set(5); },
      error: (err) => { this.submitting.set(false); this.bookingError.set(err.error?.detail || 'حدث خطأ أثناء الحجز. يرجى المحاولة مرة أخرى.'); }
    });
  }

  formatDateTime(utcDate?: string): string {
    if (!utcDate) return '';
    return new Date(utcDate).toLocaleString('ar-SA', { dateStyle: 'full', timeStyle: 'short' });
  }

  copyToClipboard(text: string) { navigator.clipboard.writeText(text); }
}
