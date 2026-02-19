import { useState, useEffect } from 'react';
import { Plus, Video, Phone, Clock, IndianRupee, Loader2, Save, X, Calendar, Edit, CalendarX } from 'lucide-react';
import { slotService } from '@/services/therapist/slotService';
import { toast } from 'sonner';
import TherapistStatusPage from './Dummy';
import { therapistProfileService } from '@/services/therapist/profileService';

interface TimeSlot {
  startTime: string;
  modes: ('video' | 'audio')[];
  price: number;
}

interface DaySlots {
  day: string;
  enabled: boolean;
  slots: TimeSlot[];
}

interface WeeklySchedule {
  id: string;
  schedule: DaySlots[];
}

export default function SlotManagement() {
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState<DaySlots[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const FIXED_DURATION = 50;

  useEffect(() => {
    fetchTherapistData();
  }, []);

  const fetchTherapistData = async () => {
    try {
      setIsLoading(true);

      const approvalStatus = await therapistProfileService.getApprovalStatus(); 
      console.log('status', approvalStatus)
      setApprovalStatus(approvalStatus);
      
      if (approvalStatus === 'Approved') {
        await fetchWeeklySchedule();
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching therapist data:', error);
      setIsLoading(false);
    }
  };

  const fetchWeeklySchedule = async () => {
    try {
      const response = await slotService.getWeeklySchedule();
      setWeeklySchedule(response.data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  if (!isLoading && approvalStatus !== 'Approved') {
    return <TherapistStatusPage />;
  }

  const initializeNewSchedule = () => {
    const newSchedule: DaySlots[] = DAYS.map(day => ({
      day,
      enabled: false,
      slots: []
    }));
    setEditingSchedule(newSchedule);
    setIsEditing(true);
  };

  const startEditingSchedule = () => {
    if (weeklySchedule) {
      const fullSchedule: DaySlots[] = DAYS.map(day => {
        const existingDay = weeklySchedule.schedule.find(d => d.day === day);
        return existingDay || { day, enabled: false, slots: [] };
      });
      setEditingSchedule(fullSchedule);
      setIsEditing(true);
    }
  };

  const toggleDay = (dayIndex: number) => {
    const updated = [...editingSchedule];
    updated[dayIndex].enabled = !updated[dayIndex].enabled;
    setEditingSchedule(updated);
  };

  const addSlotToDay = (dayIndex: number) => {
    const updated = [...editingSchedule];
    updated[dayIndex].slots.push({
      startTime: '',
      modes: ['video'],
      price: 0
    });
    setEditingSchedule(updated);
  };

  const removeSlotFromDay = (dayIndex: number, slotIndex: number) => {
    const updated = [...editingSchedule];
    updated[dayIndex].slots.splice(slotIndex, 1);
    setEditingSchedule(updated);
  };

  const updateSlot = (dayIndex: number, slotIndex: number, field: string, value: unknown) => {
    const updated = [...editingSchedule];
    
    if (field === 'startTime' && typeof value === 'string' && value) {
      const currentDaySlots = updated[dayIndex].slots;
      const newStartMinutes = timeToMinutes(value);
      const newEndMinutes = newStartMinutes + FIXED_DURATION;

      if (newEndMinutes >= 1440) {
        toast.error(`This slot would end after midnight (${formatTime(calculateEndTime(value))}). Please choose an earlier time.`);
        return;
      }

      for (let i = 0; i < currentDaySlots.length; i++) {
        if (i === slotIndex || !currentDaySlots[i].startTime) continue;

        const existingStart = timeToMinutes(currentDaySlots[i].startTime);
        const existingEnd = existingStart + FIXED_DURATION;

        if (
          (newStartMinutes >= existingStart && newStartMinutes < existingEnd) ||
          (newEndMinutes > existingStart && newEndMinutes <= existingEnd) ||
          (newStartMinutes <= existingStart && newEndMinutes >= existingEnd)
        ) {
          toast.error(
            `This time overlaps with another slot (${formatTime(currentDaySlots[i].startTime)} - ${formatTime(calculateEndTime(currentDaySlots[i].startTime))}). ` +
            `Each session is 50 minutes. Please choose a time at least 50 minutes before or after existing slots.`
          );
          return;
        }
      }
    }

    if (field === 'price' && typeof value === 'number' && value < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    updated[dayIndex].slots[slotIndex] = {
      ...updated[dayIndex].slots[slotIndex],
      [field]: value
    };
    setEditingSchedule(updated);
  };

  const toggleMode = (dayIndex: number, slotIndex: number, mode: 'video' | 'audio') => {
    const updated = [...editingSchedule];
    const currentModes = updated[dayIndex].slots[slotIndex].modes;
    
    if (currentModes.includes(mode)) {
      updated[dayIndex].slots[slotIndex].modes = currentModes.filter(m => m !== mode);
    } else {
      updated[dayIndex].slots[slotIndex].modes = [...currentModes, mode];
    }
    
    setEditingSchedule(updated);
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const checkTimeSlotOverlap = (slots: TimeSlot[]): { hasOverlap: boolean; message: string } => {
    if (slots.length <= 1) return { hasOverlap: false, message: '' };

    const sortedSlots = [...slots].sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const currentStart = timeToMinutes(sortedSlots[i].startTime);
      const currentEnd = currentStart + FIXED_DURATION;
      const nextStart = timeToMinutes(sortedSlots[i + 1].startTime);

      if (nextStart < currentEnd) {
        const currentStartFormatted = formatTime(sortedSlots[i].startTime);
        const nextStartFormatted = formatTime(sortedSlots[i + 1].startTime);
        return {
          hasOverlap: true,
          message: `Slots overlap: ${currentStartFormatted} and ${nextStartFormatted}. Each session is 50 minutes, so slots must be at least 50 minutes apart.`
        };
      }
    }

    return { hasOverlap: false, message: '' };
  };

  const validateSchedule = () => {
    const enabledDays = editingSchedule.filter(day => day.enabled);
    
    if (enabledDays.length === 0) {
      toast.error('Please enable at least one day');
      return false;
    }

    for (const day of enabledDays) {
      if (day.slots.length === 0) {
        toast.error(`Please add at least one slot for ${day.day}`);
        return false;
      }

      for (let i = 0; i < day.slots.length; i++) {
        const slot = day.slots[i];
        
        if (!slot.startTime) {
          toast.error(`Please set start time for Slot ${i + 1} on ${day.day}`);
          return false;
        }
        
        if (slot.price <= 0) {
          toast.error(`Please set a valid price (greater than 0) for Slot ${i + 1} on ${day.day}`);
          return false;
        }
        
        if (slot.modes.length === 0) {
          toast.error(`Please select at least one consultation mode for Slot ${i + 1} on ${day.day}`);
          return false;
        }

        const startMinutes = timeToMinutes(slot.startTime);
        const endMinutes = startMinutes + FIXED_DURATION;
        if (endMinutes >= 1440) {
          toast.error(`Slot ${i + 1} on ${day.day} starting at ${formatTime(slot.startTime)} would end after midnight. Please choose an earlier time.`);
          return false;
        }
      }

      const overlapCheck = checkTimeSlotOverlap(day.slots);
      if (overlapCheck.hasOverlap) {
        toast.error(`${day.day}: ${overlapCheck.message}`);
        return false;
      }

      const uniqueTimes = new Set(day.slots.map(slot => slot.startTime));
      if (uniqueTimes.size !== day.slots.length) {
        toast.error(`${day.day} has duplicate time slots. Please ensure all slots have different start times.`);
        return false;
      }
    }

    return true;
  };

  const handleSaveSchedule = async () => {
    if (!validateSchedule()) return;

    try {
      const scheduleData = editingSchedule.filter(day => day.enabled);
      
      let response;
      if (weeklySchedule) {
        response = await slotService.updateWeeklySchedule({ schedule: scheduleData });
      } else {
        response = await slotService.createWeeklySchedule({ schedule: scheduleData });
      }

      setWeeklySchedule(response.data);
      setIsEditing(false);
      setEditingSchedule([]);
      toast.success(weeklySchedule ? 'Weekly schedule updated successfully!' : 'Weekly schedule created successfully!');
    } catch (error: unknown) {
      console.error('Error saving schedule:', error);
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to save schedule';
      toast.error(message);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateEndTime = (startTime: string) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + FIXED_DURATION;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Weekly Schedule Management
          </h1>
          <p className="text-gray-600">
            Set your recurring weekly availability for consultations
          </p>
        </div>

        {!weeklySchedule && !isEditing && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <CalendarX size={40} className="text-blue-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                No Weekly Schedule Created
              </h2>
              <p className="text-gray-600 mb-6">
                Create your weekly recurring schedule to let clients know when you're available for consultations. You can set different time slots for each day of the week.
              </p>
              <button
                onClick={initializeNewSchedule}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md mx-auto"
              >
                <Plus size={20} />
                Create Weekly Schedule
              </button>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-xl font-semibold text-gray-800">
                {weeklySchedule ? 'Edit Your Weekly Schedule' : 'Configure Your Weekly Schedule'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Enable days and add time slots for each day of the week
              </p>
            </div>

            <div className="p-6 space-y-6">
              {editingSchedule.map((daySchedule, dayIndex) => (
                <div
                  key={daySchedule.day}
                  className={`border-2 rounded-lg transition-all ${
                    daySchedule.enabled
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={daySchedule.enabled}
                        onChange={() => toggleDay(dayIndex)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-lg font-semibold text-gray-800">
                        {daySchedule.day}
                      </span>
                    </label>

                    {daySchedule.enabled && (
                      <button
                        onClick={() => addSlotToDay(dayIndex)}
                        className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Plus size={16} />
                        Add Slot
                      </button>
                    )}
                  </div>

                  {daySchedule.enabled && (
                    <div className="px-4 pb-4 space-y-3">
                      {daySchedule.slots.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No slots added. Click "Add Slot" to create one.
                        </p>
                      ) : (
                        daySchedule.slots.map((slot, slotIndex) => (
                          <div
                            key={slotIndex}
                            className="bg-white border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">
                                Slot {slotIndex + 1}
                              </span>
                              <button
                                onClick={() => removeSlotFromDay(dayIndex, slotIndex)}
                                className="text-red-600 hover:text-red-700 transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) =>
                                    updateSlot(dayIndex, slotIndex, 'startTime', e.target.value)
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {slot.startTime && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    End: {formatTime(calculateEndTime(slot.startTime))} (50 min)
                                  </p>
                                )}
                                {daySchedule.slots.length > 1 && (
                                  <p className="text-xs text-amber-600 mt-1 font-medium">
                                    ⚠ Ensure 50 min gap between slots
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Price (₹)
                                </label>
                                <input
                                  type="number"
                                  value={slot.price || ''}
                                  onChange={(e) =>
                                    updateSlot(dayIndex, slotIndex, 'price', Number(e.target.value))
                                  }
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  onKeyDown={(e) => {
                                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                      e.preventDefault();
                                    }
                                  }}
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                  Consultation Modes
                                </label>
                                <div className="flex gap-2">
                                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg border-2 border-gray-200 transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                                    <input
                                      type="checkbox"
                                      checked={slot.modes.includes('video')}
                                      onChange={() => toggleMode(dayIndex, slotIndex, 'video')}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <Video size={16} className="text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700">Video</span>
                                  </label>

                                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg border-2 border-gray-200 transition-all has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                                    <input
                                      type="checkbox"
                                      checked={slot.modes.includes('audio')}
                                      onChange={() => toggleMode(dayIndex, slotIndex, 'audio')}
                                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <Phone size={16} className="text-green-600" />
                                    <span className="text-sm font-medium text-gray-700">Audio</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingSchedule([]);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Save size={18} />
                Save Schedule
              </button>
            </div>
          </div>
        )}

        {weeklySchedule && !isEditing && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Your Weekly Schedule
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Active recurring schedule for all weeks
                </p>
              </div>
              <button
                onClick={startEditingSchedule}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Edit size={18} />
                Edit Schedule
              </button>
            </div>

            <div className="divide-y divide-gray-200">
              {weeklySchedule.schedule.map((daySchedule) => (
                <div key={daySchedule.day} className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600" />
                    {daySchedule.day}
                  </h3>
                  
                  <div className="space-y-3">
                    {daySchedule.slots.map((slot, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Clock size={18} className="text-blue-600" />
                            <span className="font-semibold text-gray-800">
                              {formatTime(slot.startTime)} - {formatTime(calculateEndTime(slot.startTime))}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {FIXED_DURATION} min
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <IndianRupee size={18} className="text-green-600" />
                            <span className="font-semibold text-gray-800">₹{slot.price.toFixed(2)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {slot.modes.includes('video') && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                <Video size={12} />
                                Video
                              </span>
                            )}
                            {slot.modes.includes('audio') && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                <Phone size={12} />
                                Audio
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {weeklySchedule && !isEditing && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This schedule repeats every week. Clients can book available slots for any upcoming week. All sessions are 50 minutes long. You can edit your schedule anytime to add, remove, or modify time slots.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}