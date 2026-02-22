import { useMemo } from 'react';
import { calculateTotalHours, calculateHoursDifference } from '@/lib/utils';
import type { DaySchedule } from '@/types';

interface ProgressCircleProps {
  days: DaySchedule[];
}

export function ProgressCircle({ days }: ProgressCircleProps) {
  const totalHours = useMemo(() => calculateTotalHours(days), [days]);
  const difference = useMemo(() => calculateHoursDifference(days), [days]);
  const percentage = useMemo(() => (totalHours / 40) * 100, [totalHours]);

  // Determine status color and message
  const isComplete = totalHours === 40;
  const isOver = totalHours > 40;
  const isUnder = totalHours < 40;

  const statusColor = isComplete
    ? '#84CC16' // Sage green for complete
    : isOver
      ? '#3B82F6' // Blue for over
      : '#F97316'; // Orange for under

  const statusText = isComplete
    ? 'On Track!'
    : isOver
      ? `+${totalHours - 40}h Extra`
      : `Missing ${Math.abs(difference)}h`;

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative w-48 h-48">
        {/* Background circle */}
        <svg
          className="absolute inset-0 w-full h-full transform -rotate-90"
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={statusColor}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-foreground">
            {Math.min(totalHours, 40).toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">of 40 hours</div>
        </div>
      </div>

      {/* Status message */}
      <div className="text-center">
        <p
          className="text-lg font-semibold"
          style={{ color: statusColor }}
        >
          {statusText}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {isComplete
            ? 'Great job! Your week is planned perfectly.'
            : isOver
              ? 'You have extra hours planned this week.'
              : `Plan ${Math.abs(difference)} more hours to reach your goal.`}
        </p>
      </div>

      {/* Weekly breakdown */}
      <div className="w-full max-w-xs">
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <div
              key={day.day}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold transition-all"
                style={{
                  backgroundColor:
                    day.plannedHours === 0
                      ? '#F3F4F6'
                      : day.plannedHours >= 8
                        ? '#84CC16'
                        : '#FBBF24',
                  color:
                    day.plannedHours === 0
                      ? '#9CA3AF'
                      : day.plannedHours >= 8
                        ? '#FFFFFF'
                        : '#FFFFFF',
                }}
              >
                {day.plannedHours > 0 ? day.plannedHours.toFixed(0) : '—'}
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {day.day.substring(0, 1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
