import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Clock, Edit2, Check, X, AlertCircle } from 'lucide-react';
import type { DaySchedule, BusSchedule } from '@/types';
import {
  calculateLogoutTime,
  calculateHoursBetweenTimes,
  getBusRecommendations,
  isWorkingDay,
  formatTimeDifference,
  getTimeDifference,
} from '@/lib/utils';

interface DayCardProps {
  day: DaySchedule;
  busTimetable: BusSchedule[];
  onUpdate: (updates: Partial<DaySchedule>) => void;
  isAnimating?: boolean;
  onRedistributionNeeded?: (hours: number) => void;
}

export function DayCard({ day, busTimetable, onUpdate, isAnimating, onRedistributionNeeded }: DayCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    plannedHours: day.plannedHours,
    loginTime: day.loginTime,
    logoutTime: day.logoutTime,
  });

  const busRecommendations = day.loginTime && day.logoutTime ? getBusRecommendations(day, busTimetable) : { arrival: [], departure: [] };
  const isWorking = isWorkingDay(day.plannedHours);

  const handleHoursChange = (hours: number) => {
    if (editValues.loginTime) {
      const newLogoutTime = calculateLogoutTime(editValues.loginTime, hours);
      setEditValues({ ...editValues, plannedHours: hours, logoutTime: newLogoutTime });
    } else {
      setEditValues({ ...editValues, plannedHours: hours });
    }
  };

  const handleLoginTimeChange = (loginTime: string) => {
    if (loginTime && editValues.plannedHours > 0) {
      const newLogoutTime = calculateLogoutTime(loginTime, editValues.plannedHours);
      setEditValues({ ...editValues, loginTime, logoutTime: newLogoutTime });
    } else {
      setEditValues({ ...editValues, loginTime });
    }
  };

  const handleLogoutTimeChange = (logoutTime: string) => {
    if (editValues.loginTime && logoutTime) {
      const newHours = calculateHoursBetweenTimes(editValues.loginTime, logoutTime);
      setEditValues({ ...editValues, logoutTime, plannedHours: newHours });
    } else {
      setEditValues({ ...editValues, logoutTime });
    }
  };

  const handleSave = () => {
    onUpdate(editValues);
    
    // Suggest redistribution if hours < 6
    if (editValues.plannedHours > 0 && editValues.plannedHours < 6 && onRedistributionNeeded) {
      onRedistributionNeeded(6 - editValues.plannedHours);
    }
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({
      plannedHours: day.plannedHours,
      loginTime: day.loginTime,
      logoutTime: day.logoutTime,
    });
    setIsEditing(false);
  };

  const getDayColor = () => {
    if (day.plannedHours === 0) return 'bg-muted/50';
    if (day.plannedHours >= 8) return 'bg-green-50 border-green-200';
    if (day.plannedHours >= 6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-orange-50 border-orange-200';
  };

  const getStatusBadgeColor = () => {
    if (day.plannedHours === 0) return 'bg-gray-200 text-gray-700';
    if (day.plannedHours >= 8) return 'bg-green-200 text-green-700';
    if (day.plannedHours >= 6) return 'bg-yellow-200 text-yellow-700';
    return 'bg-orange-200 text-orange-700';
  };

  return (
    <Card
      className={`p-4 transition-all duration-300 ${getDayColor()} ${
        isAnimating ? 'animate-in fade-in slide-in-from-bottom-2' : ''
      }`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{day.day}</h3>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {!isEditing ? (
          <>
            {/* Display mode */}
            <div className="space-y-2">
              {day.plannedHours > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hours:</span>
                    <span className={`text-lg font-bold px-2 py-1 rounded ${getStatusBadgeColor()}`}>
                      {day.plannedHours.toFixed(1)}h
                    </span>
                  </div>

                  {day.loginTime && day.logoutTime && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">
                        {day.loginTime} - {day.logoutTime}
                      </span>
                    </div>
                  )}

                  {/* Warning for less than 6 hours */}
                  {day.plannedHours > 0 && day.plannedHours < 6 && (
                    <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-xs text-orange-700">
                          Less than 6 hours - consider redistributing
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Arrival Bus Recommendations */}
                  {busRecommendations.arrival.length > 0 && (
                    <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-600">Arrival Buses</span>
                      </div>
                      <div className="space-y-1">
                        {busRecommendations.arrival.slice(0, 2).map((bus) => (
                          <div key={bus.busId} className="text-xs text-foreground">
                            <p className={`font-medium ${bus.isClosest ? 'text-blue-700' : ''}`}>
                              {bus.name}
                            </p>
                            <p className="text-muted-foreground">
                              Arrives at {bus.time}
                              {bus.minutesUntil >= 0 && ` (${formatTimeDifference(bus.minutesUntil)} before login)`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Departure Bus Recommendations */}
                  {busRecommendations.departure.length > 0 && (
                    <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-semibold text-green-600">Departure Buses</span>
                      </div>
                      <div className="space-y-1">
                        {busRecommendations.departure.slice(0, 2).map((bus) => (
                          <div key={bus.busId} className="text-xs text-foreground">
                            <p className={`font-medium ${bus.isClosest ? 'text-green-700' : ''}`}>
                              {bus.name}
                            </p>
                            <p className="text-muted-foreground">
                              Departs at {bus.time}
                              {bus.minutesUntil >= 0 && ` (in ${formatTimeDifference(bus.minutesUntil)})`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">No work scheduled</p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Edit mode */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Planned Hours</label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={editValues.plannedHours}
                  onChange={(e) => handleHoursChange(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Login Time</label>
                  <Input
                    type="time"
                    value={editValues.loginTime}
                    onChange={(e) => handleLoginTimeChange(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Logout Time</label>
                  <Input
                    type="time"
                    value={editValues.logoutTime}
                    onChange={(e) => handleLogoutTimeChange(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <p>💡 Change any field and the others will auto-adjust to keep consistency</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
