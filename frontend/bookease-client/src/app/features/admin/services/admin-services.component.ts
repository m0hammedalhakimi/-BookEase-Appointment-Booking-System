import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ServiceDto } from '../../../core/models/service.model';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="services-page">
      <div class="page-header">
        <h1>إدارة الخدمات</h1>
        <button class="btn-add" (click)="openForm()">+ إضافة خدمة</button>
      </div>
      @if (loading()) { <div class="loading">جاري التحميل...</div> }
      @else {
        <div class="services-list">
          @for (service of services(); track service.id) {
            <div class="service-card" [class.inactive]="!service.isActive">
              <div class="service-info">
                <h3>{{ service.name }}</h3>
                <p>{{ service.description }}</p>
                <div class="meta">
                  <span class="badge">{{ service.durationMinutes }} دقيقة</span>
                  <span class="status" [class.active]="service.isActive">{{ service.isActive ? 'نشط' : 'غير نشط' }}</span>
                </div>
              </div>
              <div class="service-actions">
                <button class="btn-edit" (click)="editService(service)">تعديل</button>
                <button class="btn-toggle" [class.deactivate]="service.isActive" (click)="toggleStatus(service)">{{ service.isActive ? 'تعطيل' : 'تفعيل' }}</button>
              </div>
            </div>
          } @empty { <div class="empty">لا توجد خدمات</div> }
        </div>
      }
      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ editingService() ? 'تعديل الخدمة' : 'إضافة خدمة جديدة' }}</h2>
            <form [formGroup]="serviceForm" (ngSubmit)="saveService()">
              <div class="form-group">
                <label>اسم الخدمة</label>
                <input type="text" formControlName="name" placeholder="اسم الخدمة">
                @if (serviceForm.get('name')?.touched && serviceForm.get('name')?.invalid) { <span class="error">الاسم مطلوب</span> }
              </div>
              <div class="form-group"><label>الوصف</label><textarea formControlName="description" rows="3" placeholder="وصف الخدمة"></textarea></div>
              <div class="form-group">
                <label>المدة (بالدقائق)</label>
                <input type="number" formControlName="durationMinutes" min="1" dir="ltr">
                @if (serviceForm.get('durationMinutes')?.touched && serviceForm.get('durationMinutes')?.invalid) { <span class="error">المدة مطلوبة ويجب أن تكون أكبر من صفر</span> }
              </div>
              <div class="form-group checkbox"><label><input type="checkbox" formControlName="isActive"> خدمة نشطة</label></div>
              @if (formError()) { <div class="error-msg">{{ formError() }}</div> }
              <div class="form-actions">
                <button type="button" class="btn-cancel-form" (click)="closeForm()">إلغاء</button>
                <button type="submit" class="btn-save" [disabled]="serviceForm.invalid || saving()">{{ saving() ? 'جاري الحفظ...' : 'حفظ' }}</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.5rem; color: #1f2937; }
    .btn-add { background: #1a56db; color: white; padding: 0.6rem 1.2rem; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
    .btn-add:hover { background: #1e40af; }
    .services-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .service-card { display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 10px; padding: 1.25rem; border: 1px solid #e5e7eb; }
    .service-card.inactive { opacity: 0.6; }
    .service-info h3 { font-size: 1.05rem; margin-bottom: 0.3rem; }
    .service-info p { color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .meta { display: flex; gap: 0.5rem; align-items: center; }
    .badge { background: #f3f4f6; padding: 0.15rem 0.5rem; border-radius: 10px; font-size: 0.8rem; color: #4b5563; }
    .status { font-size: 0.8rem; font-weight: 600; color: #dc2626; }
    .status.active { color: #16a34a; }
    .service-actions { display: flex; gap: 0.5rem; }
    .btn-edit { background: #eff6ff; color: #1a56db; padding: 0.4rem 0.8rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
    .btn-toggle { background: #f0fdf4; color: #16a34a; padding: 0.4rem 0.8rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
    .btn-toggle.deactivate { background: #fef2f2; color: #dc2626; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .modal { background: white; border-radius: 12px; padding: 2rem; width: 90%; max-width: 450px; }
    .modal h2 { margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.3rem; font-size: 0.9rem; color: #374151; }
    .form-group input, .form-group textarea { width: 100%; padding: 0.6rem 0.75rem; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #1a56db; }
    .checkbox label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .error { color: #dc2626; font-size: 0.8rem; }
    .error-msg { background: #fef2f2; color: #dc2626; padding: 0.5rem; border-radius: 6px; text-align: center; margin-bottom: 0.5rem; }
    .form-actions { display: flex; gap: 0.75rem; }
    .btn-cancel-form { flex: 1; padding: 0.6rem; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; }
    .btn-save { flex: 1; padding: 0.6rem; background: #1a56db; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-save:disabled { background: #9ca3af; }
    .loading, .empty { text-align: center; color: #6b7280; padding: 2rem; }
  `]
})
export class AdminServicesComponent implements OnInit {
  services = signal<ServiceDto[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingService = signal<ServiceDto | null>(null);
  saving = signal(false);
  formError = signal('');
  serviceForm: FormGroup;

  constructor(private adminApi: AdminApiService, private fb: FormBuilder) {
    this.serviceForm = this.fb.group({ name: ['', Validators.required], description: [''], durationMinutes: [30, [Validators.required, Validators.min(1)]], isActive: [true] });
  }

  ngOnInit() { this.loadServices(); }

  loadServices() {
    this.loading.set(true);
    this.adminApi.getAllServices().subscribe({ next: (data) => { this.services.set(data); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  openForm(service?: ServiceDto) {
    this.editingService.set(service || null);
    if (service) { this.serviceForm.patchValue(service); } else { this.serviceForm.reset({ durationMinutes: 30, isActive: true }); }
    this.showForm.set(true); this.formError.set('');
  }

  editService(service: ServiceDto) { this.openForm(service); }
  closeForm() { this.showForm.set(false); this.editingService.set(null); }

  saveService() {
    this.saving.set(true); this.formError.set('');
    const formValue = this.serviceForm.value;
    const request = this.editingService() ? this.adminApi.updateService(this.editingService()!.id, formValue) : this.adminApi.createService(formValue);
    request.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.loadServices(); },
      error: (err) => { this.saving.set(false); this.formError.set(err.error?.detail || 'حدث خطأ'); }
    });
  }

  toggleStatus(service: ServiceDto) {
    this.adminApi.updateServiceStatus(service.id, !service.isActive).subscribe({ next: () => this.loadServices() });
  }
}
