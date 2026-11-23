import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { DashboardSummaryDto } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>لوحة التحكم</h1>
      @if (loading()) { <div class="loading">جاري تحميل البيانات...</div> }
      @else if (summary()) {
        <div class="stats-grid">
          <div class="stat-card total"><span class="stat-value">{{ summary()!.totalAppointments }}</span><span class="stat-label">إجمالي المواعيد</span></div>
          <div class="stat-card pending"><span class="stat-value">{{ summary()!.pendingAppointments }}</span><span class="stat-label">قيد الانتظار</span></div>
          <div class="stat-card confirmed"><span class="stat-value">{{ summary()!.confirmedAppointments }}</span><span class="stat-label">مؤكدة</span></div>
          <div class="stat-card completed"><span class="stat-value">{{ summary()!.completedAppointments }}</span><span class="stat-label">مكتملة</span></div>
          <div class="stat-card cancelled"><span class="stat-value">{{ summary()!.cancelledAppointments }}</span><span class="stat-label">ملغاة</span></div>
          <div class="stat-card today"><span class="stat-value">{{ summary()!.todayAppointments }}</span><span class="stat-label">مواعيد اليوم</span></div>
          <div class="stat-card upcoming"><span class="stat-value">{{ summary()!.upcomingAppointments }}</span><span class="stat-label">قادمة</span></div>
        </div>
        <div class="dashboard-sections">
          <div class="section">
            <h2>مواعيد اليوم</h2>
            @if (summary()!.todaySchedule.length === 0) { <div class="empty">لا توجد مواعيد لهذا اليوم</div> }
            @else { <div class="schedule-list">@for (appt of summary()!.todaySchedule; track appt.id) {
              <div class="schedule-item"><span class="time" dir="ltr">{{ formatTime(appt.startAtUtc) }}</span><span class="name">{{ appt.customerName }}</span><span class="service">{{ appt.serviceName }}</span><span class="status-badge" [class]="appt.status.toLowerCase()">{{ getStatusLabel(appt.status) }}</span></div>
            }</div> }
          </div>
          <div class="section">
            <h2>آخر الحجوزات</h2>
            @if (summary()!.recentBookings.length === 0) { <div class="empty">لا توجد حجوزات حديثة</div> }
            @else { <div class="schedule-list">@for (appt of summary()!.recentBookings; track appt.id) {
              <div class="schedule-item"><span class="time" dir="ltr">{{ formatDate(appt.createdAtUtc) }}</span><span class="name">{{ appt.customerName }}</span><span class="service">{{ appt.serviceName }}</span><span class="status-badge" [class]="appt.status.toLowerCase()">{{ getStatusLabel(appt.status) }}</span></div>
            }</div> }
          </div>
          <div class="section">
            <h2>توزيع الحالات</h2>
            <div class="distribution-list">@for (item of summary()!.statusDistribution; track item.status) {
              <div class="dist-item"><span class="status-badge" [class]="item.status.toLowerCase()">{{ getStatusLabel(item.status) }}</span><div class="dist-bar-wrapper"><div class="dist-bar" [class]="item.status.toLowerCase()" [style.width.%]="getPercentage(item.count)"></div></div><span class="dist-count">{{ item.count }}</span></div>
            }</div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard h1 { font-size: 1.5rem; color: #1f2937; margin-bottom: 1.5rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: white; border-radius: 12px; padding: 1.25rem; text-align: center; border-top: 3px solid #e5e7eb; transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-value { display: block; font-size: 2rem; font-weight: 700; color: #1f2937; }
    .stat-label { color: #6b7280; font-size: 0.85rem; }
    .stat-card.total { border-top-color: #1a56db; } .stat-card.pending { border-top-color: #f59e0b; } .stat-card.confirmed { border-top-color: #3b82f6; } .stat-card.completed { border-top-color: #16a34a; } .stat-card.cancelled { border-top-color: #dc2626; } .stat-card.today { border-top-color: #8b5cf6; } .stat-card.upcoming { border-top-color: #06b6d4; }
    .dashboard-sections { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
    .section { background: white; border-radius: 12px; padding: 1.5rem; }
    .section h2 { font-size: 1.1rem; color: #1f2937; margin-bottom: 1rem; }
    .schedule-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .schedule-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0; border-bottom: 1px solid #f3f4f6; flex-wrap: wrap; }
    .schedule-item .time { color: #1a56db; font-weight: 600; font-size: 0.85rem; min-width: 70px; }
    .schedule-item .name { flex: 1; color: #1f2937; font-weight: 500; }
    .schedule-item .service { color: #6b7280; font-size: 0.85rem; }
    .status-badge { padding: 0.15rem 0.5rem; border-radius: 10px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
    .status-badge.pending { background: #fef3c7; color: #92400e; } .status-badge.confirmed { background: #dbeafe; color: #1e40af; } .status-badge.cancelled { background: #fef2f2; color: #dc2626; } .status-badge.completed { background: #f0fdf4; color: #166534; }
    .distribution-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .dist-item { display: flex; align-items: center; gap: 0.75rem; }
    .dist-bar-wrapper { flex: 1; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
    .dist-bar { height: 100%; border-radius: 4px; transition: width 0.5s; }
    .dist-bar.pending { background: #f59e0b; } .dist-bar.confirmed { background: #3b82f6; } .dist-bar.cancelled { background: #dc2626; } .dist-bar.completed { background: #16a34a; }
    .dist-count { font-weight: 600; color: #374151; min-width: 30px; text-align: center; }
    .empty { text-align: center; color: #9ca3af; padding: 1.5rem; }
    .loading { text-align: center; color: #6b7280; padding: 3rem; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  summary = signal<DashboardSummaryDto | null>(null);
  loading = signal(true);
  constructor(private adminApi: AdminApiService) {}
  ngOnInit() { this.adminApi.getDashboardSummary().subscribe({ next: (data) => { this.summary.set(data); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  getStatusLabel(status: string): string { return ({ 'Pending': 'قيد الانتظار', 'Confirmed': 'مؤكد', 'Cancelled': 'ملغي', 'Completed': 'مكتمل' } as Record<string, string>)[status] || status; }
  formatTime(utcDate: string): string { return new Date(utcDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }); }
  formatDate(utcDate: string): string { return new Date(utcDate).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }); }
  getPercentage(count: number): number { return (!this.summary() || this.summary()!.totalAppointments === 0) ? 0 : (count / this.summary()!.totalAppointments) * 100; }
}
