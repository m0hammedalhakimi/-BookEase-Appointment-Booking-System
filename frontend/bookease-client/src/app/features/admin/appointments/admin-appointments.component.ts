import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { AppointmentDto } from '../../../core/models/appointment.model';
import { ServiceDto } from '../../../core/models/service.model';

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="appointments-page">
      <h1>إدارة المواعيد</h1>
      <div class="filters">
        <input type="text" placeholder="بحث بالاسم أو رقم الحجز..." [(ngModel)]="searchTerm" (input)="onSearch()">
        <input type="date" [(ngModel)]="dateFrom" (change)="loadAppointments()" dir="ltr">
        <input type="date" [(ngModel)]="dateTo" (change)="loadAppointments()" dir="ltr">
        <select [(ngModel)]="statusFilter" (change)="loadAppointments()">
          <option value="">كل الحالات</option>
          <option value="Pending">قيد الانتظار</option>
          <option value="Confirmed">مؤكد</option>
          <option value="Completed">مكتمل</option>
          <option value="Cancelled">ملغي</option>
        </select>
        <select [(ngModel)]="serviceFilter" (change)="loadAppointments()">
          <option [ngValue]="null">كل الخدمات</option>
          @for (s of allServices(); track s.id) {
            <option [ngValue]="s.id">{{ s.name }}</option>
          }
        </select>
      </div>
      @if (loading()) {
        <div class="loading">جاري التحميل...</div>
      } @else {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>رقم الحجز</th>
                <th>العميل</th>
                <th>الخدمة</th>
                <th>الموعد</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              @for (appt of appointments(); track appt.id) {
                <tr>
                  <td dir="ltr" class="ref">{{ appt.bookingReference }}</td>
                  <td>{{ appt.customerName }}</td>
                  <td>{{ appt.serviceName }}</td>
                  <td dir="ltr">{{ formatDateTime(appt.startAtUtc) }}</td>
                  <td><span class="status-badge" [class]="appt.status.toLowerCase()">{{ getStatusLabel(appt.status) }}</span></td>
                  <td class="actions-cell">
                    @if (appt.status === 'Pending') { <button class="action-btn confirm" (click)="updateStatus(appt, 'Confirmed')">تأكيد</button> }
                    @if (appt.status === 'Confirmed') { <button class="action-btn complete" (click)="updateStatus(appt, 'Completed')">إكمال</button> }
                    @if (appt.status === 'Pending' || appt.status === 'Confirmed') { <button class="action-btn cancel" (click)="updateStatus(appt, 'Cancelled')">إلغاء</button> }
                    <button class="action-btn detail" (click)="viewDetail(appt)">تفاصيل</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">لا توجد مواعيد</td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button [disabled]="currentPage <= 1" (click)="goToPage(currentPage - 1)">السابق</button>
          <span>صفحة {{ currentPage }} من {{ totalPages() }}</span>
          <button [disabled]="currentPage >= totalPages()" (click)="goToPage(currentPage + 1)">التالي</button>
        </div>
      }
      @if (selectedAppointment()) {
        <div class="modal-overlay" (click)="selectedAppointment.set(null)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>تفاصيل الموعد</h2>
            <div class="detail-grid">
              <div><strong>رقم الحجز:</strong> <span dir="ltr">{{ selectedAppointment()!.bookingReference }}</span></div>
              <div><strong>العميل:</strong> {{ selectedAppointment()!.customerName }}</div>
              <div><strong>الهاتف:</strong> <span dir="ltr">{{ selectedAppointment()!.customerPhone }}</span></div>
              <div><strong>البريد:</strong> <span dir="ltr">{{ selectedAppointment()!.customerEmail || 'غير محدد' }}</span></div>
              <div><strong>الخدمة:</strong> {{ selectedAppointment()!.serviceName }}</div>
              <div><strong>المدة:</strong> {{ selectedAppointment()!.durationMinutes }} دقيقة</div>
              <div><strong>الموعد:</strong> {{ formatDateTime(selectedAppointment()!.startAtUtc) }}</div>
              <div><strong>الحالة:</strong> <span class="status-badge" [class]="selectedAppointment()!.status.toLowerCase()">{{ getStatusLabel(selectedAppointment()!.status) }}</span></div>
              @if (selectedAppointment()!.notes) { <div><strong>ملاحظات:</strong> {{ selectedAppointment()!.notes }}</div> }
            </div>
            <button class="btn-close" (click)="selectedAppointment.set(null)">إغلاق</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .appointments-page h1 { font-size: 1.5rem; color: #1f2937; margin-bottom: 1.5rem; }
    .filters { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .filters input, .filters select { padding: 0.6rem 0.75rem; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; background: white; }
    .filters input:first-child { flex: 1; min-width: 200px; }
    .filters input:focus, .filters select:focus { outline: none; border-color: #1a56db; }
    .table-wrapper { background: white; border-radius: 12px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 700px; }
    th { background: #f9fafb; padding: 0.75rem 1rem; text-align: right; font-size: 0.85rem; color: #6b7280; font-weight: 600; white-space: nowrap; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem; }
    .ref { font-family: monospace; color: #1a56db; }
    .status-badge { padding: 0.15rem 0.5rem; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.confirmed { background: #dbeafe; color: #1e40af; }
    .status-badge.cancelled { background: #fef2f2; color: #dc2626; }
    .status-badge.completed { background: #f0fdf4; color: #166534; }
    .actions-cell { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .action-btn { padding: 0.25rem 0.5rem; border: none; border-radius: 4px; font-size: 0.8rem; cursor: pointer; font-weight: 500; }
    .action-btn.confirm { background: #dbeafe; color: #1e40af; }
    .action-btn.complete { background: #f0fdf4; color: #166534; }
    .action-btn.cancel { background: #fef2f2; color: #dc2626; }
    .action-btn.detail { background: #f3f4f6; color: #374151; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1rem; color: #6b7280; }
    .pagination button { padding: 0.4rem 1rem; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer; font-size: 0.85rem; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
    .empty { text-align: center; color: #9ca3af; padding: 2rem; }
    .loading { text-align: center; color: #6b7280; padding: 3rem; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .modal { background: white; border-radius: 12px; padding: 2rem; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
    .modal h2 { margin-bottom: 1rem; }
    .detail-grid { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.5rem; }
    .detail-grid div { padding: 0.4rem 0; border-bottom: 1px solid #f3f4f6; }
    .btn-close { width: 100%; padding: 0.6rem; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; }
  `]
})
export class AdminAppointmentsComponent implements OnInit {
  appointments = signal<AppointmentDto[]>([]);
  allServices = signal<ServiceDto[]>([]);
  loading = signal(true);
  selectedAppointment = signal<AppointmentDto | null>(null);
  searchTerm = '';
  dateFrom = '';
  dateTo = '';
  statusFilter = '';
  serviceFilter: number | null = null;
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  private searchTimeout: any;

  constructor(private adminApi: AdminApiService) {}

  ngOnInit() {
    this.adminApi.getAllServices().subscribe(s => this.allServices.set(s));
    this.loadAppointments();
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadAppointments(), 400);
  }

  loadAppointments() {
    this.loading.set(true);
    this.adminApi.getAppointments({
      search: this.searchTerm || undefined,
      dateFrom: this.dateFrom || undefined,
      dateTo: this.dateTo || undefined,
      serviceId: this.serviceFilter || undefined,
      status: this.statusFilter || undefined,
      page: this.currentPage,
      pageSize: this.pageSize
    }).subscribe({
      next: (data) => { this.appointments.set(data.items); this.totalCount = data.totalCount; this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }
  goToPage(page: number) { this.currentPage = page; this.loadAppointments(); }

  updateStatus(appt: AppointmentDto, newStatus: string) {
    this.adminApi.updateAppointmentStatus(appt.id, { status: newStatus }).subscribe({ next: () => this.loadAppointments() });
  }

  viewDetail(appt: AppointmentDto) { this.selectedAppointment.set(appt); }
  getStatusLabel(status: string): string { return ({ 'Pending': 'قيد الانتظار', 'Confirmed': 'مؤكد', 'Cancelled': 'ملغي', 'Completed': 'مكتمل' } as Record<string, string>)[status] || status; }
  formatDateTime(utcDate: string): string { return new Date(utcDate).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }); }
}
