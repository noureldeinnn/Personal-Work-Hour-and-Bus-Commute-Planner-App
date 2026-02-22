import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { BusSchedule } from '@/types';
import { timeToMinutes } from '@/lib/utils';

interface BusScheduleManagerProps {
  busTimetable: BusSchedule[];
  onAddBus: (bus: Omit<BusSchedule, 'id'>) => void;
  onRemoveBus: (busId: string) => void;
  onEditBus: (busId: string, updates: Partial<BusSchedule>) => void;
}

export function BusScheduleManager({
  busTimetable,
  onAddBus,
  onRemoveBus,
  onEditBus,
}: BusScheduleManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBus, setNewBus] = useState({
    name: '',
    time: '',
    type: 'departure' as 'arrival' | 'departure',
    route: '',
  });
  const [editValues, setEditValues] = useState<Partial<BusSchedule>>({});

  const handleAddBus = () => {
    if (newBus.name && newBus.time) {
      onAddBus({
        name: newBus.name,
        time: newBus.time,
        type: newBus.type,
        route: newBus.route,
      });
      setNewBus({ name: '', time: '', type: 'departure', route: '' });
      setIsAdding(false);
    }
  };

  const handleEditStart = (bus: BusSchedule) => {
    setEditingId(bus.id);
    setEditValues(bus);
  };

  const handleEditSave = (busId: string) => {
    onEditBus(busId, editValues);
    setEditingId(null);
    setEditValues({});
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const sortedBuses = [...busTimetable].sort((a, b) => {
    if (!a.time || !b.time) return 0;
    const aMinutes = timeToMinutes(a.time);
    const bMinutes = timeToMinutes(b.time);
    return aMinutes - bMinutes;
  });

  const arrivalBuses = sortedBuses.filter(bus => bus.type === 'arrival');
  const departureBuses = sortedBuses.filter(bus => bus.type === 'departure');

  const BusTypeSection = ({ buses, type, title }: { buses: BusSchedule[]; type: 'arrival' | 'departure'; title: string }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {buses.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">No {type} buses added</p>
      ) : (
        buses.map((bus) => (
          <Card
            key={bus.id}
            className={`p-3 transition-all ${
              editingId === bus.id ? 'bg-blue-50 border-blue-200' : 'bg-white'
            }`}
          >
            {editingId === bus.id ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Bus Name</label>
                  <Input
                    value={editValues.name || ''}
                    onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Time</label>
                  <Input
                    type="time"
                    value={editValues.time || ''}
                    onChange={(e) => setEditValues({ ...editValues, time: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <Select
                    value={editValues.type || 'departure'}
                    onValueChange={(value) =>
                      setEditValues({ ...editValues, type: value as 'arrival' | 'departure' })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arrival">Arrival</SelectItem>
                      <SelectItem value="departure">Departure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Route</label>
                  <Input
                    value={editValues.route || ''}
                    onChange={(e) => setEditValues({ ...editValues, route: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditSave(bus.id)}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditCancel}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{bus.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {bus.time}
                    {bus.route && ` • ${bus.route}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditStart(bus)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveBus(bus.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Bus Timetable</h3>
        {!isAdding && (
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Bus
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Bus Name</label>
              <Input
                placeholder="e.g., Express Bus A"
                value={newBus.name}
                onChange={(e) => setNewBus({ ...newBus, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Time</label>
              <Input
                type="time"
                value={newBus.time}
                onChange={(e) => setNewBus({ ...newBus, time: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select
                value={newBus.type}
                onValueChange={(value) =>
                  setNewBus({ ...newBus, type: value as 'arrival' | 'departure' })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arrival">Arrival (before work)</SelectItem>
                  <SelectItem value="departure">Departure (after work)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Route (optional)</label>
              <Input
                placeholder="e.g., Downtown"
                value={newBus.route}
                onChange={(e) => setNewBus({ ...newBus, route: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleAddBus}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <Check className="w-4 h-4 mr-1" />
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewBus({ name: '', time: '', type: 'departure', route: '' });
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <BusTypeSection buses={arrivalBuses} type="arrival" title="🚌 Arrival Buses (Morning)" />
        <BusTypeSection buses={departureBuses} type="departure" title="🚌 Departure Buses (Evening)" />
      </div>

      {busTimetable.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground italic text-center py-4">
          No buses added yet. Add your first bus to get started.
        </p>
      )}
    </div>
  );
}
