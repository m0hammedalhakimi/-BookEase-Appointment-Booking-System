export interface CreateAppointmentRequest {
  serviceId: number;
  startAtUtc: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
}

export interface AppointmentDto {
  id: number;
  bookingReference: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  serviceId: number;
  serviceName: string;
  durationMinutes: number;
  startAtUtc: string;
  endAtUtc: string;
  status: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface BookingConfirmationDto {
  bookingReference: string;
  managementCode: string;
  customerName: string;
  serviceName: string;
  durationMinutes: number;
  startAtUtc: string;
  endAtUtc: string;
  status: string;
}

export interface VerifyBookingRequest {
  bookingReference: string;
  managementCode: string;
}

export interface RescheduleRequest {
  newStartAtUtc: string;
  managementCode: string;
}

export interface CancelRequest {
  managementCode: string;
}

export interface AppointmentListResponse {
  items: AppointmentDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AppointmentStatusUpdateRequest {
  status: string;
}
