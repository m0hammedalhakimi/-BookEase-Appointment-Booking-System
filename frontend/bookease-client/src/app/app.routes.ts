import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent) },
      { path: 'booking', loadComponent: () => import('./features/public/booking/booking.component').then(m => m.BookingComponent) },
      { path: 'manage-booking', loadComponent: () => import('./features/public/manage-booking/manage-booking.component').then(m => m.ManageBookingComponent) },
    ]
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'appointments', loadComponent: () => import('./features/admin/appointments/admin-appointments.component').then(m => m.AdminAppointmentsComponent) },
      { path: 'services', loadComponent: () => import('./features/admin/services/admin-services.component').then(m => m.AdminServicesComponent) },
      { path: 'business-hours', loadComponent: () => import('./features/admin/business-hours/admin-business-hours.component').then(m => m.AdminBusinessHoursComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
