export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  expiresAt: string;
}

export interface AdminUserDto {
  id: string;
  username: string;
}

export interface DashboardSummaryDto {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  completedAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  recentBookings: import('./appointment.model').AppointmentDto[];
  statusDistribution: StatusDistributionItem[];
  todaySchedule: import('./appointment.model').AppointmentDto[];
}

export interface StatusDistributionItem {
  status: string;
  count: number;
}
