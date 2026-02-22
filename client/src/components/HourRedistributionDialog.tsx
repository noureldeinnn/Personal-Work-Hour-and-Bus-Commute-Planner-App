import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import type { DaySchedule } from '@/types';
import { calculateHoursDifference } from '@/lib/utils';

interface HourRedistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  days: DaySchedule[];
  onRedistribute: (fromDay: string, toDay: string, hours: number) => void;
  suggestedHours?: number;
}

export function HourRedistributionDialog({
  open,
  onOpenChange,
  days,
  onRedistribute,
  suggestedHours = 0,
}: HourRedistributionDialogProps) {
  const [selectedFromDay, setSelectedFromDay] = useState<string>('');
  const [selectedToDay, setSelectedToDay] = useState<string>('');
  const [hoursToMove, setHoursToMove] = useState<number>(0);

  const difference = useMemo(() => calculateHoursDifference(days), [days]);
  const isDeficit = difference > 0;
  const deficitHours = Math.abs(difference);

  const availableDays = useMemo(() => {
    return days.filter((day) => day.plannedHours > 0);
  }, [days]);

  const targetDays = useMemo(() => {
    return days.filter((day) => day.day !== selectedFromDay);
  }, [days, selectedFromDay]);

  const maxMovableHours = useMemo(() => {
    if (!selectedFromDay) return 0;
    const fromDay = days.find((d) => d.day === selectedFromDay);
    return fromDay?.plannedHours || 0;
  }, [days, selectedFromDay]);

  const handleRedistribute = () => {
    if (selectedFromDay && selectedToDay && hoursToMove > 0) {
      onRedistribute(selectedFromDay, selectedToDay, hoursToMove);
      setSelectedFromDay('');
      setSelectedToDay('');
      setHoursToMove(0);
      onOpenChange(false);
    }
  };

  const isValid = selectedFromDay && selectedToDay && hoursToMove > 0 && hoursToMove <= maxMovableHours;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redistribute Hours</DialogTitle>
          <DialogDescription>
            Move hours between days to meet your 40-hour weekly goal.
          </DialogDescription>
        </DialogHeader>

        {isDeficit && (
          <Card className="p-3 bg-orange-50 border-orange-200">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-orange-900">Missing {deficitHours} hours</p>
                <p className="text-orange-800">
                  Add hours to other days to reach your 40-hour goal.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">From Day</label>
            <Select value={selectedFromDay} onValueChange={setSelectedFromDay}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a day to remove hours from" />
              </SelectTrigger>
              <SelectContent>
                {availableDays.map((day) => (
                  <SelectItem key={day.day} value={day.day}>
                    {day.day} ({day.plannedHours}h)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">To Day</label>
            <Select value={selectedToDay} onValueChange={setSelectedToDay}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a day to add hours to" />
              </SelectTrigger>
              <SelectContent>
                {targetDays.map((day) => (
                  <SelectItem key={day.day} value={day.day}>
                    {day.day} ({day.plannedHours}h)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Hours to Move
              {maxMovableHours > 0 && (
                <span className="text-muted-foreground ml-2">
                  (max: {maxMovableHours}h)
                </span>
              )}
            </label>
            <Input
              type="number"
              min="0"
              max={maxMovableHours}
              step="0.5"
              value={hoursToMove}
              onChange={(e) => setHoursToMove(parseFloat(e.target.value) || 0)}
              className="mt-1"
              placeholder="0"
            />
          </div>

          {selectedFromDay && selectedToDay && hoursToMove > 0 && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-900">
                Move <span className="font-semibold">{hoursToMove}h</span> from{' '}
                <span className="font-semibold">{selectedFromDay}</span> to{' '}
                <span className="font-semibold">{selectedToDay}</span>
              </p>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRedistribute}
            disabled={!isValid}
            className="bg-primary hover:bg-primary/90"
          >
            Redistribute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
