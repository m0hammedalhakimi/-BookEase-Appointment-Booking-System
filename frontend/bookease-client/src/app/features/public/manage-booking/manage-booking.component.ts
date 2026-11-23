import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentApiService } from '../../../core/services/appointment-api.service';
import { AvailabilityApiService } from '../../../core/services/availability-api.service';
import { AppointmentDto } from '../../../core/models/appointment.model';
import { TimeSlotDto } from '../../../core/models/availability.model';

@Component({
  selector: 'app-manage-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="manage-container">
      @if (!appointment()) {
        <div class="verify-card">
          <h2>إدارة الحجز</h2>
          <p>أدخل رقم الحجز ورمز الإدارة للوصول إلى تفاصيل موعدك</p>
          <form [formGroup]="verifyForm" (ngSubmit)="verifyBooking()" class="verify-form">
            <div class="form-group"><label for="bookingRef">رقم الحجز</label><input id="bookingRef" type="text" formControlName="bookingReference" placeholder="BK-XXXXXXXX" dir="ltr"></div>
            <div class="form-group"><label for="mgmtCode">رمز الإدارة</label><input id="mgmtCode" type="password" formControlName="managementCode" placeholder="رمز الإدارة السري"></div>
            @if (verifyError()) { <div class="error-banner">{{ verifyError() }}</div> }
            <button type="submit" class="btn-primary" [disabled]="verifyForm.invalid || verifying()">{{ verifying() ? 'جاري التحقق...' : 'عرض الحجز' }}</button>
          </form>
        </div>
      } @else {
        <div class="appointment-card">
          <div class="card-header"><h2>تفاصيل الحجز</h2><span class="status-badge" [class]="appointment()!.status.toLowerCase()">{{ getStatusLabel(appointment()!.status) }}</span></div>
          <div class="details-grid">
            <div class="detail"><span class="label">رقم الحجز:</span><span class="value" dir="ltr">{{ appointment()!.bookingReference }}</span></div>
            <div class="detail"><span class="label">الخدمة:</span><span class="value">{{ appointment()!.serviceName }}</span></div>
            <div class="detail"><span class="label">التاريخ والوقت:</span><span class="value">{{ formatDateTime(appointment()!.startAtUtc) }}</span></div>
            <div class="detail"><span class="label">المدة:</span><span class="value">{{ appointment()!.durationMinutes }} دقيقة</span></div>
            <div class="detail"><span class="label">الاسم:</span><span class="value">{{ appointment()!.customerName }}</span></div>
            <div class="detail"><span class="label">الهاتف:</span><span class="value" dir="ltr">{{ appointment()!.customerPhone }}</span></div>
          </div>
          @if (canModify()) {
            <div class="action-buttons">
              @if (!showReschedule()) { <button class="btn-reschedule" (click)="showReschedule.set(true)">إعادة جدولة</button> }
              <button class="btn-cancel" (click)="confirmCancel()" [disabled]="cancelling()">{{ cancelling() ? 'جاري الإلغاء...' : 'إلغاء الحجز' }}</button>
            </div>
          }
          @if (showReschedule()) {
            <div class="reschedule-section">
              <h3>إعادة جدولة الموعد</h3>
              <div class="form-group"><label>اختر التاريخ الجديد</label><input type="date" class="date-input" [min]="minDate" (change)="onRescheduleDate($event)"></div>
              @if (loadingSlots()) { <div class="loading">جاري تحميل المواعيد...</div> }
              @else if (rescheduleSlots().length > 0) {
                <div class="slots-grid">
                  @for (slot of rescheduleSlots(); track slot.startAtUtc) {
                    <button class="slot-btn" [class.selected]="selectedNewSlot()?.startAtUtc === slot.startAtUtc" (click)="selectedNewSlot.set(slot)">{{ slot.startTime }} - {{ slot.endTime }}</button>
                  }
                </div>
                <button class="btn-primary" [disabled]="!selectedNewSlot() || rescheduling()" (click)="submitReschedule()">{{ rescheduling() ? 'جاري إعادة الجدولة...' : 'تأكيد الموعد الجديد' }}</button>
              }
              @if (rescheduleError()) { <div class="error-banner">{{ rescheduleError() }}</div> }
              <button class="btn-back" (click)="showReschedule.set(false)">إلغاء</button>
            </div>
          }
          @if (actionMessage()) { <div class="success-banner">{{ actionMessage() }}</div> }
          @if (actionError()) { <div class="error-banner">{{ actionError() }}</div> }
          <button class="btn-back" (click)="resetView()">عودة</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .manage-container { max-width: 600px; margin: 0 auto; }
    .verify-card, .appointment-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 2rem; }
    .verify-card h2, .appointment-card h2 { text-align: center; margin-bottom: 0.5rem; color: #1f2937; }
    .verify-card p { text-align: center; color: #6b7280; margin-bottom: 1.5rem; }
    .verify-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .form-group label { font-weight: 600; font-size: 0.9rem; color: #374151; }
    .form-group input { padding: 0.7rem 1rem; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; }
    .form-group input:focus { outline: none; border-color: #1a56db; }
    .btn-primary { background: #1a56db; color: white; padding: 0.75rem; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-primary:hover { background: #1e40af; }
    .btn-primary:disabled { background: #9ca3af; cursor: not-allowed; }
    .error-banner { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem; border-radius: 8px; text-align: center; }
    .success-banner { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 0.75rem; border-radius: 8px; text-align: center; margin-top: 1rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .status-badge { padding: 0.3rem 0.8rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.confirmed { background: #dbeafe; color: #1e40af; }
    .status-badge.cancelled { background: #fef2f2; color: #dc2626; }
    .status-badge.completed { background: #f0fdf4; color: #166534; }
    .details-grid { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
    .detail { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6; }
    .detail .label { color: #6b7280; }
    .detail .value { font-weight: 600; color: #1f2937; }
    .action-buttons { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .btn-reschedule { flex: 1; background: #1a56db; color: white; padding: 0.6rem; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; }
    .btn-cancel { flex: 1; background: #dc2626; color: white; padding: 0.6rem; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; }
    .btn-cancel:disabled { background: #9ca3af; }
    .btn-back { background: #f3f4f6; color: #374151; padding: 0.6rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; margin-top: 1rem; width: 100%; font-size: 0.95rem; }
    .reschedule-section { background: #f9fafb; border-radius: 10px; padding: 1.5rem; margin-bottom: 1rem; }
    .reschedule-section h3 { margin-bottom: 1rem; color: #1f2937; }
    .date-input { padding: 0.6rem 1rem; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; direction: ltr; width: 100%; box-sizing: border-box; }
    .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.5rem; margin: 1rem 0; }
    .slot-btn { padding: 0.6rem; border: 2px solid #e5e7eb; border-radius: 6px; background: white; cursor: pointer; font-size: 0.9rem; direction: ltr; }
    .slot-btn:hover { border-color: #93c5fd; }
    .slot-btn.selected { border-color: #1a56db; background: #1a56db; color: white; }
    .loading { text-align: center; color: #6b7280; padding: 1rem; }
  `]
})
export class ManageBookingComponent {
  verifyForm: FormGroup;
  appointment = signal<AppointmentDto | null>(null);
  verifying = signal(false);
  verifyError = signal('');
  managementCode = '';
  showReschedule = signal(false);
  rescheduleSlots = signal<TimeSlotDto[]>([]);
  selectedNewSlot = signal<TimeSlotDto | null>(null);
  loadingSlots = signal(false);
  rescheduling = signal(false);
  rescheduleError = signal('');
  cancelling = signal(false);
  actionMessage = signal('');
  actionError = signal('');
  minDate: string;

  constructor(private fb: FormBuilder, private appointmentApi: AppointmentApiService, private availabilityApi: AvailabilityApiService) {
    this.verifyForm = this.fb.group({ bookingReference: ['', Validators.required], managementCode: ['', Validators.required] });
    this.minDate = new Date().toISOString().split('T')[0];
  }

  verifyBooking() {
    this.verifying.set(true); this.verifyError.set('');
    this.managementCode = this.verifyForm.get('managementCode')?.value;
    this.appointmentApi.verifyBooking({ bookingReference: this.verifyForm.get('bookingReference')?.value, managementCode: this.managementCode }).subscribe({
      next: (data) => { this.appointment.set(data); this.verifying.set(false); },
      error: () => { this.verifyError.set('رقم الحجز أو رمز الإدارة غير صحيح'); this.verifying.set(false); }
    });
  }

  canModify(): boolean {
    const a = this.appointment();
    return !!a && (a.status === 'Pending' || a.status === 'Confirmed') && new Date(a.startAtUtc) > new Date();
  }

  onRescheduleDate(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.value || !this.appointment()) return;
    this.loadingSlots.set(true); this.selectedNewSlot.set(null);
    this.availabilityApi.getAvailability(this.appointment()!.serviceId, input.value).subscribe({
      next: (resp) => { this.rescheduleSlots.set(resp.availableSlots); this.loadingSlots.set(false); },
      error: () => { this.rescheduleSlots.set([]); this.loadingSlots.set(false); }
    });
  }

  submitReschedule() {
    if (!this.selectedNewSlot() || !this.appointment()) return;
    this.rescheduling.set(true); this.rescheduleError.set('');
    this.appointmentApi.rescheduleAppointment(this.appointment()!.bookingReference, { newStartAtUtc: this.selectedNewSlot()!.startAtUtc, managementCode: this.managementCode }).subscribe({
      next: (data) => { this.appointment.set(data); this.rescheduling.set(false); this.showReschedule.set(false); this.actionMessage.set('تم إعادة جدولة الموعد بنجاح'); this.rescheduleSlots.set([]); },
      error: (err) => { this.rescheduling.set(false); this.rescheduleError.set(err.error?.detail || 'فشل إعادة الجدولة'); }
    });
  }

  confirmCancel() {
    if (!confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) return;
    this.cancelling.set(true); this.actionError.set('');
    this.appointmentApi.cancelAppointment(this.appointment()!.bookingReference, { managementCode: this.managementCode }).subscribe({
      next: (data) => { this.appointment.set(data); this.cancelling.set(false); this.actionMessage.set('تم إلغاء الحجز بنجاح'); },
      error: (err) => { this.cancelling.set(false); this.actionError.set(err.error?.detail || 'فشل إلغاء الحجز'); }
    });
  }

  resetView() { this.appointment.set(null); this.verifyForm.reset(); this.managementCode = ''; this.actionMessage.set(''); this.actionError.set(''); this.showReschedule.set(false); }
  getStatusLabel(status: string): string { return ({ 'Pending': 'قيد الانتظار', 'Confirmed': 'مؤكد', 'Cancelled': 'ملغي', 'Completed': 'مكتمل' } as Record<string, string>)[status] || status; }
  formatDateTime(utcDate: string): string { return new Date(utcDate).toLocaleString('ar-SA', { dateStyle: 'full', timeStyle: 'short' }); }
}
