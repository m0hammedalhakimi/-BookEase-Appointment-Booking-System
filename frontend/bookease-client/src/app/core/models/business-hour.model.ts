export interface BusinessHourDto {
  id: number;
  dayOfWeek: number;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
}

export interface UpdateBusinessHoursRequest {
  hours: BusinessHourItem[];
}

export interface BusinessHourItem {
  dayOfWeek: number;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
}
