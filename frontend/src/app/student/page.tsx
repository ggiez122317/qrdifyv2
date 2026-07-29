'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingAnimation } from '@/components/ui/TableLoadingState';
import { CalendarCheck, CalendarX, Clock, CalendarDays, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect } from 'react';

export default function StudentDashboard() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/me');
      return res.data.user;
    }
  });

  useEffect(() => {
    if (!user) return;
    
    // Check geolocation support
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await api.post('/api/student/location', { latitude, longitude });
          
          if (res.data?.out_of_bounds) {
            // Trigger vibration if supported
            if (navigator.vibrate) {
              navigator.vibrate([500, 250, 500, 250, 500]);
            }
            // Dispatch custom event for a warning toast (assumes a global toast listener is present)
            localStorage.setItem('toast_message', 'WARNING: You are outside the school boundary!');
            window.dispatchEvent(new Event('toast-trigger'));
          }
        } catch (error) {
          console.error('Failed to report location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: async () => {
      const res = await api.get('/api/student/dashboard');
      return res.data;
    }
  });

  const isLoading = userLoading || dashboardLoading;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome, {user?.name}. Here is your attendance record for this month.</p>
        </div>

        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <LoadingAnimation message="Loading your attendance history..." />
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <Card className={`border-none shadow-md text-white overflow-hidden relative ${
                dashboard?.today_status === 'Pending' ? 'bg-slate-400' : 
                dashboard?.today_status === 'Late' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}>
                <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-20">
                  <Clock className="w-32 h-32" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-white/80 text-sm font-medium uppercase tracking-wider">Today's Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboard?.today_status || 'Pending'}</div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white overflow-hidden relative border border-slate-100">
                <div className="absolute top-4 right-4 text-emerald-100">
                  <CalendarCheck className="w-12 h-12" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-500 text-sm font-medium uppercase tracking-wider">Days Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-800">{dashboard?.total_present || 0}</div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white overflow-hidden relative border border-slate-100">
                <div className="absolute top-4 right-4 text-red-100">
                  <CalendarX className="w-12 h-12" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-500 text-sm font-medium uppercase tracking-wider">Days Absent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-800">{dashboard?.total_absent || 0}</div>
                </CardContent>
              </Card>
              
            </div>

            {/* Attendance History Table */}
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <CalendarDays className="w-5 h-5 text-indigo-500" />
                  Recent Attendance Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(!dashboard?.history || dashboard.history.length === 0) ? (
                  <div className="p-12 text-center text-slate-400">
                    <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-slate-600">No attendance recorded this month.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                          <th className="px-6 py-4 font-bold tracking-wider">Time In</th>
                          <th className="px-6 py-4 font-bold tracking-wider">Time Out</th>
                          <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dashboard.history.map((record: any) => {
                          const dateObj = new Date(record.date);
                          const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                          
                          const timeInStr = record.time_in ? new Date(record.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                          const timeOutStr = record.time_out ? new Date(record.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                          
                          const isLate = record.status.toLowerCase() === 'late';
                          const isPresent = record.status.toLowerCase() === 'present';

                          return (
                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-semibold text-slate-700">
                                {dateStr}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="w-4 h-4 text-emerald-500" />
                                  <span className="font-medium text-slate-900">{timeInStr}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="w-4 h-4 text-amber-500 rotate-180" />
                                  <span className="font-medium text-slate-500">{timeOutStr}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {isLate ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-600 uppercase tracking-wider">
                                    Late
                                  </span>
                                ) : isPresent ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-600 uppercase tracking-wider">
                                    Present
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                                    {record.status}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
