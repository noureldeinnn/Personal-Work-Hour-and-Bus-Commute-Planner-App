import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressCircle } from '@/components/ProgressCircle';
import { DayCard } from '@/components/DayCard';
import { BusScheduleManager } from '@/components/BusScheduleManager';
import { HourRedistributionDialog } from '@/components/HourRedistributionDialog';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import { RotateCcw, Menu, X, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { calculateHoursDifference } from '@/lib/utils';

/**
 * Warm Productivity Dashboard Design System
 * Color Palette:
 * - Primary: Warm Orange (#F97316) - Progress, positive states
 * - Success: Sage Green (#84CC16) - Completed days
 * - Neutral: Soft Blue (#3B82F6) - Information
 * - Warning: Amber (#FBBF24) - Adjustments needed
 * - Background: Warm Off-white (#FFFAF5)
 */

export default function Home() {
  const { plan, isLoading, updateDay, addBus, removeBus, editBus, resetWeek } = useWeeklyPlan();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [animatingDays, setAnimatingDays] = useState<Set<string>>(new Set());
  const [showRedistributionDialog, setShowRedistributionDialog] = useState(false);
  const [redistributionHours, setRedistributionHours] = useState(0);

  useEffect(() => {
    if (plan?.days) {
      const newAnimatingDays = new Set(plan.days.map(d => d.day));
      setAnimatingDays(newAnimatingDays);
      const timer = setTimeout(() => setAnimatingDays(new Set()), 600);
      return () => clearTimeout(timer);
    }
  }, [plan?.days]);

  if (isLoading || !plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  const handleResetWeek = () => {
    if (confirm('Are you sure you want to reset this week? This action cannot be undone.')) {
      resetWeek();
      toast.success('Week reset to defaults');
    }
  };

  const handleRedistribute = (fromDay: string, toDay: string, hours: number) => {
    const fromDayData = plan.days.find(d => d.day === fromDay);
    const toDayData = plan.days.find(d => d.day === toDay);
    
    if (fromDayData && toDayData) {
      updateDay(fromDay, { plannedHours: Math.max(0, fromDayData.plannedHours - hours) });
      updateDay(toDay, { plannedHours: toDayData.plannedHours + hours });
      toast.success(`Moved ${hours}h from ${fromDay} to ${toDay}`);
    }
  };

  const handleRedistributionNeeded = (hours: number) => {
    setRedistributionHours(hours);
    setShowRedistributionDialog(true);
  };

  const difference = calculateHoursDifference(plan.days);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border shadow-warm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Work-Hour Planner</h1>
              <p className="text-sm text-muted-foreground">
                Week {plan.week} • {plan.year}
              </p>
            </div>
            <div className="hidden md:flex gap-2">
              {difference !== 0 && (
                <Button
                  onClick={() => setShowRedistributionDialog(true)}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Redistribute Hours
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleResetWeek}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Week
              </Button>
            </div>
            <button
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Progress Circle */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white shadow-warm-md sticky top-24">
              <ProgressCircle days={plan.days} />
            </Card>
          </div>

          {/* Middle Column - Weekly Days */}
          <div className="lg:col-span-2 space-y-6">
            {/* Days Grid */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Weekly Schedule</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plan.days.map((day) => (
                  <div
                    key={day.day}
                    className={animatingDays.has(day.day) ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : ''}
                  >
                    <DayCard
                      day={day}
                      busTimetable={plan.busTimetable}
                      onUpdate={(updates) => {
                        updateDay(day.day, updates);
                        toast.success(`${day.day} updated`);
                      }}
                      isAnimating={animatingDays.has(day.day)}
                      onRedistributionNeeded={handleRedistributionNeeded}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bus Schedule Section */}
            <Card className="p-6 bg-white shadow-warm-md">
              <BusScheduleManager
                busTimetable={plan.busTimetable}
                onAddBus={(bus) => {
                  addBus(bus);
                  toast.success(`${bus.name} added to timetable`);
                }}
                onRemoveBus={(busId) => {
                  removeBus(busId);
                  toast.success('Bus removed from timetable');
                }}
                onEditBus={(busId, updates) => {
                  editBus(busId, updates);
                  toast.success('Bus updated');
                }}
              />
            </Card>

            {/* Mobile Reset Button */}
            <div className="md:hidden space-y-2">
              {difference !== 0 && (
                <Button
                  onClick={() => setShowRedistributionDialog(true)}
                  className="w-full bg-primary hover:bg-primary/90 gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Redistribute Hours
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleResetWeek}
                className="w-full gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Week
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 top-16 bg-black/50 md:hidden z-30">
          <div className="bg-white p-4 space-y-2">
            {difference !== 0 && (
              <Button
                onClick={() => {
                  setShowRedistributionDialog(true);
                  setShowMobileMenu(false);
                }}
                className="w-full justify-start gap-2 bg-primary hover:bg-primary/90"
              >
                <Shuffle className="w-4 h-4" />
                Redistribute Hours
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                handleResetWeek();
                setShowMobileMenu(false);
              }}
              className="w-full justify-start gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Week
            </Button>
          </div>
        </div>
      )}

      {/* Hour Redistribution Dialog */}
      <HourRedistributionDialog
        open={showRedistributionDialog}
        onOpenChange={setShowRedistributionDialog}
        days={plan.days}
        onRedistribute={handleRedistribute}
        suggestedHours={redistributionHours}
      />

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-12">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>Personal Work-Hour & Commute Planner • Data saved locally in your browser</p>
        </div>
      </footer>
    </div>
  );
}
