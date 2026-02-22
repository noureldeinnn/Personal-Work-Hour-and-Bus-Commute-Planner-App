import { useState, useEffect, useCallback } from 'react';
import type { DaySchedule, BusSchedule, WeeklyPlan } from '@/types';
import { calculateLogoutTime, calculateHoursBetweenTimes } from '@/lib/utils';

const STORAGE_KEY = 'weekly-plan';
const BUS_STORAGE_KEY = 'bus-timetable';

const DEFAULT_DAYS: DaySchedule[] = [
  { day: 'Sunday', plannedHours: 8, loginTime: '09:00', logoutTime: '17:00' },
  { day: 'Monday', plannedHours: 8, loginTime: '09:00', logoutTime: '17:00' },
  { day: 'Tuesday', plannedHours: 8, loginTime: '09:00', logoutTime: '17:00' },
  { day: 'Wednesday', plannedHours: 8, loginTime: '09:00', logoutTime: '17:00' },
  { day: 'Thursday', plannedHours: 8, loginTime: '09:00', logoutTime: '17:00' },
  { day: 'Friday', plannedHours: 0, loginTime: '', logoutTime: '' },
  { day: 'Saturday', plannedHours: 0, loginTime: '', logoutTime: '' },
];

const DEFAULT_BUS_TIMETABLE: BusSchedule[] = [
  { id: '1', name: 'Express Bus A', time: '08:00', type: 'arrival', route: 'Downtown' },
  { id: '2', name: 'Local Bus B', time: '08:30', type: 'arrival', route: 'Residential' },
  { id: '3', name: 'Express Bus C', time: '17:00', type: 'departure', route: 'Downtown' },
  { id: '4', name: 'Local Bus D', time: '17:30', type: 'departure', route: 'Residential' },
];

export function useWeeklyPlan() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const busStored = localStorage.getItem(BUS_STORAGE_KEY);
    
    if (stored) {
      try {
        const parsedPlan = JSON.parse(stored);
        // Load buses from persistent storage if available
        if (busStored) {
          try {
            parsedPlan.busTimetable = JSON.parse(busStored);
          } catch (error) {
            console.error('Failed to parse bus timetable:', error);
          }
        }
        setPlan(parsedPlan);
      } catch (error) {
        console.error('Failed to parse stored plan:', error);
        initializeDefaultPlan();
      }
    } else {
      initializeDefaultPlan();
    }
    setIsLoading(false);
  }, []);

  const initializeDefaultPlan = useCallback(() => {
    const now = new Date();
    const weekNumber = Math.ceil((now.getDate() - now.getDay() + 1) / 7);
    
    // Load persistent bus timetable if available
    let busTimetable = DEFAULT_BUS_TIMETABLE;
    const busStored = localStorage.getItem(BUS_STORAGE_KEY);
    if (busStored) {
      try {
        busTimetable = JSON.parse(busStored);
      } catch (error) {
        console.error('Failed to parse stored bus timetable:', error);
      }
    }

    const newPlan: WeeklyPlan = {
      week: weekNumber,
      year: now.getFullYear(),
      days: DEFAULT_DAYS,
      busTimetable,
    };
    setPlan(newPlan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlan));
    localStorage.setItem(BUS_STORAGE_KEY, JSON.stringify(busTimetable));
  }, []);

  const updateDay = useCallback((dayName: string, updates: Partial<DaySchedule>) => {
    setPlan((prevPlan) => {
      if (!prevPlan) return prevPlan;
      
      const updatedDays = prevPlan.days.map((day) => {
        if (day.day !== dayName) return day;
        
        let updatedDay = { ...day, ...updates };
        
        // If plannedHours changed, recalculate logoutTime
        if (updates.plannedHours !== undefined && updates.loginTime === undefined) {
          updatedDay.logoutTime = calculateLogoutTime(day.loginTime, updates.plannedHours);
        }
        
        // If loginTime changed, recalculate logoutTime based on current hours
        if (updates.loginTime !== undefined && updates.plannedHours === undefined) {
          updatedDay.logoutTime = calculateLogoutTime(
            updates.loginTime,
            updatedDay.plannedHours
          );
        }
        
        // If logoutTime changed, recalculate plannedHours
        if (updates.logoutTime !== undefined && updates.plannedHours === undefined) {
          updatedDay.plannedHours = calculateHoursBetweenTimes(
            updatedDay.loginTime,
            updates.logoutTime
          );
        }
        
        return updatedDay;
      });
      
      const updatedPlan = { ...prevPlan, days: updatedDays };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlan));
      return updatedPlan;
    });
  }, []);

  const updateBusTimetable = useCallback((busTimetable: BusSchedule[]) => {
    setPlan((prevPlan) => {
      if (!prevPlan) return prevPlan;
      const updatedPlan = { ...prevPlan, busTimetable };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlan));
      localStorage.setItem(BUS_STORAGE_KEY, JSON.stringify(busTimetable));
      return updatedPlan;
    });
  }, []);

  const addBus = useCallback((bus: Omit<BusSchedule, 'id'>) => {
    setPlan((prevPlan) => {
      if (!prevPlan) return prevPlan;
      const newBus: BusSchedule = {
        ...bus,
        id: Date.now().toString(),
      };
      const updatedBusTimetable = [...prevPlan.busTimetable, newBus];
      const updatedPlan = {
        ...prevPlan,
        busTimetable: updatedBusTimetable,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlan));
      localStorage.setItem(BUS_STORAGE_KEY, JSON.stringify(updatedBusTimetable));
      return updatedPlan;
    });
  }, []);

  const removeBus = useCallback((busId: string) => {
    setPlan((prevPlan) => {
      if (!prevPlan) return prevPlan;
      const updatedBusTimetable = prevPlan.busTimetable.filter((bus) => bus.id !== busId);
      const updatedPlan = {
        ...prevPlan,
        busTimetable: updatedBusTimetable,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlan));
      localStorage.setItem(BUS_STORAGE_KEY, JSON.stringify(updatedBusTimetable));
      return updatedPlan;
    });
  }, []);

  const editBus = useCallback((busId: string, updates: Partial<BusSchedule>) => {
    setPlan((prevPlan) => {
      if (!prevPlan) return prevPlan;
      const updatedBusTimetable = prevPlan.busTimetable.map((bus) =>
        bus.id === busId ? { ...bus, ...updates } : bus
      );
      const updatedPlan = {
        ...prevPlan,
        busTimetable: updatedBusTimetable,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlan));
      localStorage.setItem(BUS_STORAGE_KEY, JSON.stringify(updatedBusTimetable));
      return updatedPlan;
    });
  }, []);

  const resetWeek = useCallback(() => {
    initializeDefaultPlan();
  }, [initializeDefaultPlan]);

  return {
    plan,
    isLoading,
    updateDay,
    updateBusTimetable,
    addBus,
    removeBus,
    editBus,
    resetWeek,
  };
}
