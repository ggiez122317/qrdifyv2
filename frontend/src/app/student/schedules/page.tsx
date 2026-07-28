'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription as DialogDesc } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Clock, Bell, BellRing, Plus, Trash2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StudentSchedules() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [isAlarm, setIsAlarm] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);

  // Day View Modal State
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState('');

  // Delete Confirmation Modal State
  const [scheduleToDelete, setScheduleToDelete] = useState<any>(null);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['student-schedules'],
    queryFn: async () => {
      const res = await api.get('/api/student/schedules');
      return res.data;
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newSchedule: any) => {
      return api.post('/api/student/schedules', newSchedule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-schedules'] });
      setTitle('');
      setDescription('');
      setDate('');
      setStartTime('');
      setIsAlarm(false);
      setIsAddModalOpen(false);
      localStorage.setItem('toast_message', 'Schedule added successfully');
    },
    onError: (error: any) => {
      console.error("Mutation failed", error.response?.data || error.message);
      localStorage.setItem('toast_message', 'Failed to add schedule');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      return api.put(`/api/student/schedules/${editingScheduleId}`, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-schedules'] });
      setEditingScheduleId(null);
      setTitle('');
      setDescription('');
      setDate('');
      setStartTime('');
      setIsAlarm(false);
      setIsAddModalOpen(false);
      localStorage.setItem('toast_message', 'Schedule updated successfully');
    },
    onError: (error: any) => {
      console.error("Mutation failed", error.response?.data || error.message);
      localStorage.setItem('toast_message', 'Failed to update schedule');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/api/student/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-schedules'] });
      setScheduleToDelete(null);
      localStorage.setItem('toast_message', 'Schedule deleted');
    }
  });

  // Helper to normalize date string (handles both ISO "2026-07-20T16:00:00.000000Z" and plain "2026-07-20")
  const normalizeDate = (d: string) => {
    if (!d) return '';
    if (d.includes('T')) return d.split('T')[0];
    return d.substring(0, 10);
  };

  // Helper to format 24h time to 12h AM/PM
  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${h}:${minutes} ${ampm}`;
  };

  // Alarm Check Effect
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentDateString = now.toISOString().split('T')[0];
      const currentTimeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      schedules.forEach((schedule: any) => {
        const scheduleDate = normalizeDate(schedule.date);
        if (schedule.is_alarm && scheduleDate === currentDateString) {
          // Compare HH:mm
          if (schedule.start_time && schedule.start_time.substring(0, 5) === currentTimeString) {
            // Check if we haven't already alarmed for this recently by keeping a local storage flag
            const alarmKey = `alarm_fired_${schedule.id}_${currentDateString}_${currentTimeString}`;
            if (!localStorage.getItem(alarmKey)) {
              localStorage.setItem(alarmKey, 'true');
              triggerAlarm(schedule);
            }
          }
        }
      });
    };

    const intervalId = setInterval(checkAlarms, 10000); // check every 10 seconds
    return () => clearInterval(intervalId);
  }, [schedules]);

  const triggerAlarm = (schedule: any) => {
    // 1. Web Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Alarm: ${schedule.title}`, {
        body: schedule.description || 'It is time for your scheduled task!',
        icon: '/favicon.ico'
      });
    }

    // 2. Vibrate (if supported, e.g. on Android)
    if (navigator.vibrate) {
      navigator.vibrate([500, 250, 500, 250, 500]);
    }

    // 3. Audio Beep (Synthetic so we don't need external mp3)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a sequence of beeps
      const playBeep = (startTime: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, startTime); // A5 note
        
        // Envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + 0.3);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      };

      const nowTime = audioCtx.currentTime;
      playBeep(nowTime);
      playBeep(nowTime + 0.5);
      playBeep(nowTime + 1.0);
    } catch (e) {
      console.error("Audio Context not supported", e);
    }
    
    // 4. Log to Notification API in backend
    api.post(`/api/student/schedules/${schedule.id}/trigger-alarm`).catch(console.error);
  };

  const openEditModal = (schedule: any) => {
    setEditingScheduleId(schedule.id);
    setTitle(schedule.title);
    setDescription(schedule.description || '');
    setStartTime(schedule.start_time ? schedule.start_time.substring(0, 5) : '');
    setIsAlarm(schedule.is_alarm);
    
    // Auto-tomorrow logic for completed schedules
    const sDate = new Date(`${normalizeDate(schedule.date)}T${schedule.start_time || '00:00:00'}`);
    const now = new Date();
    if (sDate < now) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
    } else {
      setDate(normalizeDate(schedule.date));
    }

    setIsAddModalOpen(true);
    setIsDayModalOpen(false); // Close day modal if open
  };

  const openDayModal = (dateString: string) => {
    setSelectedDayDate(dateString);
    setIsDayModalOpen(true);
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !startTime) return;
    
    // Ensure start_time is in H:i format in case browser appends seconds
    const formattedStartTime = startTime.substring(0, 5);
    
    const data = {
      title,
      description,
      date,
      start_time: formattedStartTime,
      is_alarm: isAlarm
    };

    if (editingScheduleId) {
      updateMutation.mutate(data);
    } else {
      addMutation.mutate(data);
    }
  };

  // Calendar Helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Filter schedules for right sidebar
  const now = new Date();
  // Filter class schedules vs personal. Since classes usually repeat, for this demo we'll assume class schedules are those without a specific 'date' or type='class'
  const classSchedules = schedules.filter((s: any) => s.type === 'class' || s.day_of_week !== null);
  const personalSchedules = schedules.filter((s: any) => s.type === 'personal');
  
  // For demo, let's just use all schedules if we don't have strictly class schedules
  const sortedSchedules = [...schedules].sort((a: any, b: any) => {
    if (!a.date || !b.date) return 0;
    return new Date(`${normalizeDate(a.date)}T${a.start_time || '00:00:00'}`).getTime() - new Date(`${normalizeDate(b.date)}T${b.start_time || '00:00:00'}`).getTime();
  });

  const upcomingSchedules = sortedSchedules.filter((s: any) => {
    if (!s.date) return false;
    const sDate = new Date(`${normalizeDate(s.date)}T${s.start_time || '00:00:00'}`);
    return sDate >= now;
  }).slice(0, 3);

  const recentSchedules = sortedSchedules.filter((s: any) => {
    if (!s.date) return false;
    const sDate = new Date(`${normalizeDate(s.date)}T${s.start_time || '00:00:00'}`);
    return sDate < now;
  }).reverse().slice(0, 3);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 pb-20 overflow-y-auto h-full max-h-screen custom-scrollbar">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#161920] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-maroon-50 dark:bg-maroon-900/20 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-maroon-600 dark:text-maroon-400" />
              </div>
              My Schedules & Tasks
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-13">Manage your class schedules, todo lists, and set alarms.</p>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger 
              onClick={() => {
                setEditingScheduleId(null);
                setTitle('');
                setDescription('');
                setDate('');
                setStartTime('');
                setIsAlarm(false);
              }}
              className="bg-maroon-600 hover:bg-maroon-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Schedule
            </DialogTrigger>
            <DialogContent 
              className="sm:max-w-md border-none shadow-2xl bg-gradient-to-br from-maroon-500 to-maroon-600 text-white overflow-hidden"
              closeClassName="bg-white text-maroon-600 hover:bg-slate-100 hover:text-maroon-700 opacity-100"
            >
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                 <BellRing className="w-48 h-48 transform translate-x-12 translate-y-12" />
              </div>
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-white text-xl">{editingScheduleId ? 'Edit Task / Alarm' : 'Add New Task / Alarm'}</DialogTitle>
                <DialogDesc className="text-maroon-100">Schedule a personal task or set an alarm notification.</DialogDesc>
              </DialogHeader>
              <div className="relative z-10 mt-2">
                <form onSubmit={handleAddSchedule} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-maroon-100 uppercase tracking-wider">Title</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-maroon-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="E.g., Math Assignment"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-maroon-100 uppercase tracking-wider">Description (Optional)</label>
                    <input 
                      type="text" 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-maroon-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="Details..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-maroon-100 uppercase tracking-wider">Date</label>
                      <input 
                        type="date" 
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/50 [color-scheme:dark]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-maroon-100 uppercase tracking-wider">Time</label>
                      <input 
                        type="time" 
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/50 [color-scheme:dark]"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 pb-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={isAlarm}
                          onChange={e => setIsAlarm(e.target.checked)}
                          className="sr-only" 
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${isAlarm ? 'bg-white' : 'bg-white/30'}`}></div>
                        <div className={`absolute left-1 top-1 bg-maroon-500 w-4 h-4 rounded-full transition-transform ${isAlarm ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <BellRing className={`w-4 h-4 ${isAlarm ? 'animate-pulse' : ''}`} /> 
                        Set as Push Alarm
                      </span>
                    </label>
                    
                    <button 
                      type="submit" 
                      disabled={addMutation.isPending || updateMutation.isPending}
                      className="bg-white text-maroon-600 hover:bg-maroon-50 px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      {editingScheduleId ? 'Save Changes' : 'Add Schedule'}
                    </button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Calendar & Add Form */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Calendar */}
            <Card className="border border-slate-100 shadow-sm bg-white dark:bg-[#161920] dark:border-white/5 rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                  <CalendarIcon className="w-5 h-5 text-maroon-600 dark:text-maroon-400" />
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </CardTitle>
                <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
                  <button onClick={prevMonth} className="px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10"></div>
                  <button onClick={nextMonth} className="px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-xs font-bold text-slate-400 py-2 uppercase tracking-wider">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-16 md:h-24 rounded-lg bg-slate-50/50 dark:bg-[#0f1115]/50 border border-transparent"></div>
                  ))}
                  
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    
                    // Find schedules for this day
                    const daySchedules = schedules.filter((s: any) => normalizeDate(s.date) === dateString);
                    const isToday = dateString === now.toISOString().split('T')[0];

                    return (
                      <div 
                        key={day} 
                        onClick={() => openDayModal(dateString)}
                        className={`h-16 md:h-24 rounded-lg border p-1 md:p-2 transition-all overflow-hidden flex flex-col cursor-pointer ${isToday ? 'border-maroon-500 bg-maroon-50/30 dark:bg-maroon-500/10' : 'border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        <div className={`text-xs md:text-sm font-bold mb-1 ${isToday ? 'text-maroon-600 dark:text-maroon-400' : 'text-slate-600 dark:text-slate-400'}`}>
                          {day}
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                          {daySchedules.map((s: any) => (
                            <div key={s.id} className="text-[9px] md:text-[10px] leading-tight font-semibold bg-maroon-100 text-maroon-700 dark:bg-maroon-900/30 dark:text-maroon-300 p-1 rounded truncate flex items-center gap-1" title={s.title}>
                              {s.is_alarm && <Bell className="w-2.5 h-2.5 shrink-0" />}
                              <span className="truncate">{formatTime12h(s.start_time)} {s.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Right Column: Recent & Upcoming */}
          <div className="space-y-6">
            
            <Card className="border border-slate-100 shadow-sm bg-white dark:bg-[#161920] dark:border-white/5 rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  Completed Schedules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentSchedules.length > 0 ? (
                  recentSchedules.map((schedule: any) => (
                    <div 
                      key={schedule.id} 
                      onClick={() => openEditModal(schedule)}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0f1115] border border-slate-100 dark:border-white/5 group relative cursor-pointer hover:border-maroon-200 dark:hover:border-maroon-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex flex-col items-center justify-center shrink-0">
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">{new Date(schedule.date).getDate()}</span>
                          <span className="text-emerald-600/80 dark:text-emerald-500 text-[10px] uppercase font-bold">{monthNames[new Date(schedule.date).getMonth()].substring(0,3)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{schedule.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime12h(schedule.start_time)}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setScheduleToDelete(schedule);
                        }}
                        className="p-2 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 dark:bg-[#0f1115] rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                    <div className="w-12 h-12 rounded-xl bg-maroon-50 dark:bg-maroon-900/20 flex items-center justify-center mb-3">
                       <CalendarIcon className="w-6 h-6 text-maroon-500" />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300">No recent schedules</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Your added schedules will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-sm bg-white dark:bg-[#161920] dark:border-white/5 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Upcoming Schedules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingSchedules.length > 0 ? (
                  upcomingSchedules.map((schedule: any) => (
                    <div 
                      key={schedule.id} 
                      onClick={() => openEditModal(schedule)}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0f1115] border border-slate-100 dark:border-white/5 group relative cursor-pointer hover:border-maroon-200 dark:hover:border-maroon-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex flex-col items-center justify-center shrink-0">
                          <span className="text-amber-700 dark:text-amber-400 font-bold text-xs">{new Date(schedule.date).getDate()}</span>
                          <span className="text-amber-600/80 dark:text-amber-500 text-[10px] uppercase font-bold">{monthNames[new Date(schedule.date).getMonth()].substring(0,3)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{schedule.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime12h(schedule.start_time)}</span>
                            {schedule.is_alarm && <BellRing className="w-3 h-3 text-red-500 ml-1" />}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setScheduleToDelete(schedule);
                        }}
                        className="p-2 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 dark:bg-[#0f1115] rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-3">
                       <CalendarIcon className="w-6 h-6 text-amber-500" />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300">No upcoming schedules</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Your upcoming schedules will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

      </div>

      {/* Day View Modal */}
      <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#161920] border border-slate-100 dark:border-white/5 p-0 overflow-hidden">
          <div className="bg-maroon-50 dark:bg-maroon-900/20 p-6 border-b border-maroon-100 dark:border-maroon-900/30">
            <h2 className="text-xl font-bold text-maroon-700 dark:text-maroon-400 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Schedules for {selectedDayDate && new Date(selectedDayDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {(() => {
              const daySchedules = sortedSchedules.filter((s: any) => normalizeDate(s.date) === selectedDayDate);
              
              if (daySchedules.length === 0) {
                return <p className="text-center text-slate-500 dark:text-slate-400 py-8">No schedules or classes for this day.</p>;
              }

              return (
                <div className="space-y-3">
                  {daySchedules.map((schedule: any) => (
                    <div 
                      key={schedule.id}
                      onClick={() => openEditModal(schedule)}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:border-maroon-200 cursor-pointer transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{schedule.title}</h4>
                        {schedule.description && <p className="text-xs text-slate-500 mt-1">{schedule.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            {formatTime12h(schedule.start_time)}
                          </span>
                          {schedule.is_alarm && (
                            <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              <BellRing className="w-3 h-3" />
                              Alarm Set
                            </span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setScheduleToDelete(schedule);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!scheduleToDelete} onOpenChange={(open) => !open && setScheduleToDelete(null)}>
        <DialogContent className="sm:max-w-sm border-none shadow-xl bg-white dark:bg-[#161920] p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Schedule?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Are you sure you want to delete <strong className="text-slate-700 dark:text-slate-300">{scheduleToDelete?.title}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setScheduleToDelete(null)}
              className="flex-1 px-4 py-2 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              No, Cancel
            </button>
            <button 
              onClick={() => {
                if (scheduleToDelete) {
                  deleteMutation.mutate(scheduleToDelete.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="flex-1 px-4 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
