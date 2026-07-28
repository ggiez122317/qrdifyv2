'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingAnimation } from '@/components/ui/TableLoadingState';
import { Users, Clock, AlertTriangle, FileText, ChevronRight, Activity, Calendar, ArrowUp, ArrowDown, Scan, ChevronDown } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const getAvatarUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return url;
  return `/storage/${url}`;
};

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Reformat label from "May 15" to "May 15, 2026"
    const formattedLabel = `${label}, 2026`;
    return (
      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-lg z-50 min-w-[140px]">
        <p className="text-xs font-bold text-slate-800 mb-3 text-center">{formattedLabel}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-xs text-slate-500 capitalize">{entry.name}:</span>
            <span className="text-xs font-bold text-slate-700 ml-auto">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TeacherDashboard() {
  const [greeting, setGreeting] = useState('Good afternoon');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/me');
      return res.data.user;
    }
  });

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['teacherDashboard'],
    queryFn: async () => {
      const res = await api.get('/api/teacher/dashboard');
      if (res.data && res.data.chart_data) {
        res.data.chart_data = res.data.chart_data.reverse();
      }
      return res.data;
    },
    refetchInterval: 10000,
  });

  // Calculate trends
  const getTrend = (key: 'present' | 'late' | 'absent') => {
    if (!dashboard?.chart_data || dashboard.chart_data.length < 2) return { value: 0, isUp: true };
    const today = dashboard.chart_data[dashboard.chart_data.length - 1][key];
    const yesterday = dashboard.chart_data[dashboard.chart_data.length - 2][key];
    const diff = today - yesterday;
    return {
      value: Math.abs(diff),
      isUp: diff >= 0
    };
  };

  const presentTrend = getTrend('present');
  const lateTrend = getTrend('late');
  const absentTrend = getTrend('absent');
  
  // Mock excused trend since it's not in chart_data
  const excusedTrend = { value: 1, isUp: true };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">
        
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 py-2">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2">
              {greeting}, {user?.name || 'Teacher Mary'}! <span className="text-xl">👋</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Here's your overview for today.</p>
          </div>
          <div className="bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 text-xs font-semibold text-emerald-600 flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Live Monitoring Active
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm min-h-[400px]">
            <LoadingAnimation message="Loading your dashboard..." />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Present Card */}
              <Card className="border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Present Today</p>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <h2 className="text-4xl font-bold text-slate-800">{dashboard?.overview?.total_present || 0}</h2>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 mt-1">Students</p>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <span className="flex items-center text-emerald-500 font-bold">
                      {presentTrend.isUp ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                      {presentTrend.value}
                    </span>
                    <span className="text-slate-400">from yesterday</span>
                  </div>
                </CardContent>
              </Card>

              {/* Late Card */}
              <Card className="border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Late Today</p>
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <h2 className="text-4xl font-bold text-slate-800">{dashboard?.overview?.total_late || 0}</h2>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 mt-1">Students</p>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <span className={`flex items-center font-bold ${lateTrend.isUp ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {lateTrend.isUp ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                      {lateTrend.value}
                    </span>
                    <span className="text-slate-400">from yesterday</span>
                  </div>
                </CardContent>
              </Card>

              {/* Absent Card */}
              <Card className="border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Absent Today</p>
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <h2 className="text-4xl font-bold text-slate-800">{dashboard?.overview?.total_absent || 0}</h2>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 mt-1">Students</p>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <span className={`flex items-center font-bold ${absentTrend.isUp ? 'text-red-500' : 'text-emerald-500'}`}>
                      {absentTrend.isUp ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                      {absentTrend.value}
                    </span>
                    <span className="text-slate-400">from yesterday</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Excused Card */}
              <Card className="border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Excused Today</p>
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <h2 className="text-4xl font-bold text-slate-800">{dashboard?.overview?.total_excused || 0}</h2>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 mt-1">Students</p>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <span className="flex items-center text-emerald-500 font-bold">
                      {excusedTrend.isUp ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                      {excusedTrend.value}
                    </span>
                    <span className="text-slate-400">from yesterday</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (Chart) */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Weekly Trend Chart */}
                <Card className="border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl flex-1 flex flex-col">
                  <CardHeader className="pb-2 pt-5 px-6 flex flex-row items-center justify-between border-b-0">
                    <CardTitle className="flex items-center gap-2 text-slate-800 text-sm font-bold">
                      <Activity className="w-4 h-4 text-slate-600" />
                      Weekly Attendance Trend
                    </CardTitle>
                    <button className="flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      This Week
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    </button>
                  </CardHeader>
                  <CardContent className="pt-4 px-2 pb-6 flex-1 flex flex-col">
                    <div className="w-full flex-1 min-h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboard?.chart_data || []} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={15} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-5} />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                          <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2.5} fill="url(#colorPresent)" activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                          <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2.5} fill="url(#colorLate)" activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
                          <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2.5} fill="url(#colorAbsent)" activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex justify-center gap-6 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[11px] font-bold text-slate-500">Present</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                        <span className="text-[11px] font-bold text-slate-500">Late</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <span className="text-[11px] font-bold text-slate-500">Absent</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-6">
                
                {/* Schedule */}
                <Card className="border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl flex-1 flex flex-col">
                  <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-center justify-between border-b border-slate-50">
                    <CardTitle className="flex items-center gap-2 text-slate-800 text-sm font-bold">
                      <Calendar className="w-4 h-4 text-red-600" />
                      Today's Schedule
                    </CardTitle>
                    <Link href="/teacher/assigned-class" className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center transition-colors">
                      View All <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 flex flex-col justify-start">
                    {dashboard?.schedule && dashboard.schedule.length > 0 ? (
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        {dashboard.schedule.map((item: any, idx: number) => (
                          <div key={item.id} className="relative flex items-center group is-active gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-red-50 text-slate-500 group-[.is-active]:text-red-600 shadow-sm shrink-0 z-10">
                              <span className="text-xs font-bold">{idx + 1}</span>
                            </div>
                            <div className="flex-1 p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                              <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                              <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 px-4 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2.5 border border-slate-100 shadow-sm">
                          <Calendar className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-[13px] font-bold text-slate-700 mb-1">No classes scheduled</p>
                        <p className="text-[11px] font-medium text-slate-500">Enjoy your free day!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pending Excuses */}
                <Card className="border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl flex-1 flex flex-col">
                  <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-center justify-between border-b border-slate-50">
                    <CardTitle className="flex items-center gap-2 text-slate-800 text-sm font-bold">
                      <FileText className="w-4 h-4 text-red-600" />
                      Pending Excuses
                    </CardTitle>
                    <Link href="/teacher/excuse-students" className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center transition-colors">
                      View All <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 flex flex-col justify-start">
                    {dashboard?.recent_excuses && dashboard.recent_excuses.length > 0 ? (
                      <div className="divide-y divide-slate-50">
                        {dashboard.recent_excuses.map((excuse: any) => (
                          <div key={excuse.id} className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => window.location.href='/teacher/excuse-students'}>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                {excuse.photo_url ? (
                                  <img src={getAvatarUrl(excuse.photo_url) || ''} alt={excuse.student_name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs bg-slate-100">
                                    {excuse.student_name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{excuse.student_name}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 font-medium truncate">For: {excuse.date}</p>
                              </div>
                              <div className="shrink-0 bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-slate-500">No pending excuse letters.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>
            
            {/* Recent Scans Feed (Full Width Bottom) */}
            <Card className="border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl mt-6">
              <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-center justify-between border-b border-slate-50">
                <CardTitle className="flex items-center gap-2 text-slate-800 text-sm font-bold">
                  <Scan className="w-4 h-4 text-red-600" />
                  Recent Scans Feed
                </CardTitle>
                <Link href="/teacher/assigned-students" className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center transition-colors">
                  View All <ChevronRight className="w-3 h-3 ml-0.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {dashboard?.recent_scans && dashboard.recent_scans.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {dashboard.recent_scans.map((scan: any) => (
                      <div key={scan.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 shadow-sm">
                          {scan.user.photo_url ? (
                            <img src={getAvatarUrl(scan.user.photo_url) || ''} alt={scan.user.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-bold text-xs">
                              {scan.user.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-800 truncate">{scan.user.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{scan.type}</p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            scan.status === 'Early' || scan.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                            scan.status === 'Late' ? 'bg-amber-50 text-amber-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {scan.status}
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 mt-1">
                            {new Date(`2000-01-01T${scan.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500">
                    <Scan className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-xs font-semibold text-slate-500">No scans recorded today yet.</p>
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
