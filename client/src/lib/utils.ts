import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DaySchedule, BusSchedule, BusRecommendation } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Warm Productivity Dashboard Design System
 * Color Palette:
 * - Primary: Warm Orange (#F97316) - Progress, positive states
 * - Success: Sage Green (#84CC16) - Completed days
 * - Neutral: Soft Blue (#3B82F6) - Information
 * - Warning: Amber (#FBBF24) - Adjustments needed
 */

/**
 * Calculate total hours from all days
 */
export function calculateTotalHours(days: DaySchedule[]): number {
  return days.reduce((sum, day) => sum + day.plannedHours, 0);
}

/**
 * Calculate hours deficit/surplus relative to 40-hour goal
 */
export function calculateHoursDifference(days: DaySchedule[]): number {
  const total = calculateTotalHours(days);
  return 40 - total;
}

/**
 * Check if weekly goal is met
 */
export function isGoalMet(days: DaySchedule[]): boolean {
  return calculateTotalHours(days) === 40;
}

/**
 * Convert time string (HH:MM) to minutes for comparison
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Calculate worked hours between start and end time
 */
export function calculateWorkedHours(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  if (endMinutes < startMinutes) {
    // Handle case where end time is next day
    return (1440 - startMinutes + endMinutes) / 60;
  }
  
  return (endMinutes - startMinutes) / 60;
}

/**
 * Calculate logout time based on login time and hours
 */
export function calculateLogoutTime(loginTime: string, hours: number): string {
  const loginMinutes = timeToMinutes(loginTime);
  const logoutMinutes = loginMinutes + (hours * 60);
  return minutesToTime(logoutMinutes % 1440);
}

/**
 * Calculate hours between login and logout times
 */
export function calculateHoursBetweenTimes(loginTime: string, logoutTime: string): number {
  return calculateWorkedHours(loginTime, logoutTime);
}

/**
 * Find arrival bus recommendations (buses before or at login time)
 */
export function findArrivalBuses(
  loginTime: string,
  busTimetable: BusSchedule[]
): BusRecommendation[] {
  const arrivalBuses = busTimetable.filter(bus => bus.type === 'arrival' && bus.time);
  if (arrivalBuses.length === 0) return [];

  const loginMinutes = timeToMinutes(loginTime);
  
  return arrivalBuses
    .map(bus => {
      const busMinutes = timeToMinutes(bus.time);
      const minutesDiff = loginMinutes - busMinutes;
      
      return {
        busId: bus.id,
        name: bus.name,
        time: bus.time,
        type: 'arrival' as const,
        minutesUntil: minutesDiff,
        isClosest: false,
      };
    })
    .filter(rec => rec.minutesUntil >= 0) // Only buses before or at login time
    .sort((a, b) => b.minutesUntil - a.minutesUntil) // Most recent first
    .map((rec, idx) => ({
      ...rec,
      isClosest: idx === 0,
    }));
}

/**
 * Find departure bus recommendations (buses at or after logout time)
 */
export function findDepartureBuses(
  logoutTime: string,
  busTimetable: BusSchedule[]
): BusRecommendation[] {
  const departureBuses = busTimetable.filter(bus => bus.type === 'departure' && bus.time);
  if (departureBuses.length === 0) return [];

  const logoutMinutes = timeToMinutes(logoutTime);
  
  return departureBuses
    .map(bus => {
      const busMinutes = timeToMinutes(bus.time);
      const minutesDiff = busMinutes - logoutMinutes;
      
      return {
        busId: bus.id,
        name: bus.name,
        time: bus.time,
        type: 'departure' as const,
        minutesUntil: minutesDiff,
        isClosest: false,
      };
    })
    .filter(rec => rec.minutesUntil >= 0) // Only buses at or after logout time
    .sort((a, b) => a.minutesUntil - b.minutesUntil) // Earliest first
    .map((rec, idx) => ({
      ...rec,
      isClosest: idx === 0,
    }));
}

/**
 * Get all bus recommendations for a day
 */
export function getBusRecommendations(
  day: DaySchedule,
  busTimetable: BusSchedule[]
): { arrival: BusRecommendation[]; departure: BusRecommendation[] } {
  return {
    arrival: findArrivalBuses(day.loginTime, busTimetable),
    departure: findDepartureBuses(day.logoutTime, busTimetable),
  };
}

/**
 * Calculate time difference in minutes between two times
 */
export function getTimeDifference(time1: string, time2: string): number {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);
  
  if (minutes2 < minutes1) {
    return (1440 - minutes1 + minutes2);
  }
  
  return minutes2 - minutes1;
}

/**
 * Format time difference to readable string
 */
export function formatTimeDifference(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Get day abbreviation
 */
export function getDayAbbreviation(day: string): string {
  return day.substring(0, 1);
}

/**
 * Get day index (0 = Sunday, 6 = Saturday)
 */
export function getDayIndex(day: string): number {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.indexOf(day);
}

/**
 * Check if a day is a working day (>= 6 hours)
 */
export function isWorkingDay(hours: number): boolean {
  return hours >= 6;
}

/**
 * Get workdays (Sunday to Thursday)
 */
export function getWorkdaysList(): string[] {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
}
