export interface ServiceDto {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateServiceRequest {
  name: string;
  description: string;
  durationMinutes: number;
  isActive: boolean;
}

export interface UpdateServiceRequest {
  name: string;
  description: string;
  durationMinutes: number;
  isActive: boolean;
}
