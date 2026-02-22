/**
 * Warm Productivity Dashboard Design System
 * Color Palette:
 * - Primary: Warm Orange (#F97316) - Progress, positive states
 * - Success: Sage Green (#84CC16) - Completed days
 * - Neutral: Soft Blue (#3B82F6) - Information
 * - Warning: Amber (#FBBF24) - Adjustments needed
 * - Background: Warm Off-white (#FFFAF5)
 * - Card: White (#FFFFFF)
 * - Text: Charcoal (#1F2937)
 */

export interface DaySchedule {
  day: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  plannedHours: number;
  loginTime: string; // HH:MM format
  logoutTime: string; // HH:MM format
  selectedArrivalBusId?: string;
  selectedDepartureBusId?: string;
  notes?: string;
}

export interface BusSchedule {
  id: string;
  name: string;
  time: string; // HH:MM format
  type: 'arrival' | 'departure'; // Type of bus
  route?: string;
  notes?: string;
}

export interface WeeklyPlan {
  week: number;
  year: number;
  days: DaySchedule[];
  busTimetable: BusSchedule[];
}

export interface HourRedistribution {
  fromDay: string;
  toDay: string;
  hours: number;
}

export interface BusRecommendation {
  busId: string;
  name: string;
  time: string;
  type: 'arrival' | 'departure';
  minutesUntil: number;
  isClosest: boolean;
}
