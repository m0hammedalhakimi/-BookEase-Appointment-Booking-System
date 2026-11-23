export interface TimeSlotDto {
  startTime: string;
  endTime: string;
  startAtUtc: string;
  endAtUtc: string;
}

export interface AvailabilityResponse {
  date: string;
  serviceId: number;
  serviceName: string;
  durationMinutes: number;
  businessTimeZone: string;
  availableSlots: TimeSlotDto[];
}
