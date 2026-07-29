'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { LoadingAnimation } from '@/components/ui/TableLoadingState';
import { Users, Clock, AlertTriangle, FileText, ChevronRight, Calendar, ArrowUp, ArrowDown, Scan } from 'lucide-react';
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

const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: any[], label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-xl border border-slate-100 p-3.5 rounded-2xl shadow-xl min-w-[130px]">
        <p className="text-[11px] font-bold text-slate-500 mb-2.5 text-center">{label}</p>
        {payload.map((entry: { color: string, name: string, value: number }, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[11px] text-slate-400 capitalize">{entry.name}</span>
            <span className="text-[11px] font-bold text-slate-700 ml-auto">{entry.value}</span>
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
    // eslint-disable-next-line
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

  const getTrend = (key: 'present' | 'late' | 'absent') => {
    if (!dashboard?.chart_data || dashboard.chart_data.length < 2) return { value: 0, isUp: true };
    const today = dashboard.chart_data[dashboard.chart_data.length - 1][key];
    const yesterday = dashboard.chart_data[dashboard.chart_data.length - 2][key];
    const diff = today - yesterday;
    return { value: Math.abs(diff), isUp: diff >= 0 };
  };

  const presentTrend = getTrend('present');
  const lateTrend = getTrend('late');
  const absentTrend = getTrend('absent');

  const stats = [
    {
      label: 'Present',
      value: dashboard?.overview?.total_present || 0,
      icon: Users,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      trend: presentTrend,
      trendUp: 'text-emerald-500',
      trendDown: 'text-slate-400',
    },
    {
      label: 'Late',
      value: dashboard?.overview?.total_late || 0,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      trend: lateTrend,
      trendUp: 'text-amber-500',
      trendDown: 'text-emerald-500',
    },
    {
      label: 'Absent',
      value: dashboard?.overview?.total_absent || 0,
      icon: AlertTriangle,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      trend: absentTrend,
      trendUp: 'text-rose-500',
      trendDown: 'text-emerald-500',
    },
    {
      label: 'Excused',
      value: dashboard?.overview?.total_excused || 0,
      icon: FileText,
      color: 'text-violet-500',
      bg: 'bg-violet-50',
      trend: { value: 0, isUp: true },
      trendUp: 'text-violet-500',
      trendDown: 'text-slate-400',
    },
  ];

  return (
    <DashboardLayout>
      <div className="bg-[#f4f6f8] min-h-[calc(100vh-5rem)] -m-6 md:-m-8 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
          <div>
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight flex items-center gap-2">
              {greeting}, {user?.name?.split(' ')[0] || 'Teacher'}! <span className="text-2xl">👋</span>
            </h1>
            <p className="text-[13px] text-slate-500 mt-0.5 font-medium">Here&apos;s your class overview for today.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white border border-slate-100 rounded-2xl min-h-[400px]">
            <LoadingAnimation message="Loading your dashboard..." />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-[1.25rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} strokeWidth={2.5} />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-3 mb-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{stat.label}</span>
                        <div className={`flex items-center gap-0.5 text-[11px] font-bold ${stat.trend.isUp ? stat.trendUp : stat.trendDown}`}>
                          {stat.trend.isUp ? <ArrowUp className="w-3 h-3" strokeWidth={3} /> : <ArrowDown className="w-3 h-3" strokeWidth={3} />}
                          {stat.trend.value}
                        </div>
                      </div>
                      <p className="text-3xl font-black text-slate-900 leading-none">{stat.value}</p>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 mt-4 text-left">
                    {stat.label === 'Present' ? `${dashboard?.overview?.total_students ? Math.round((stat.value / dashboard.overview.total_students) * 100) : 0}% of total students` : 'Today'}
                  </p>
                </div>
              ))}
            </div>

            {/* Main Grid Row 1: Chart & Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Chart */}
              <div className="lg:col-span-2 bg-white rounded-[1.25rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[14px] font-bold text-slate-900">Weekly Attendance Trend</h3>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer">
                     <span className="text-[11px] font-bold text-slate-600">Last 7 days</span>
                     <ChevronRight className="w-3 h-3 text-slate-400 rotate-90" />
                  </div>
                </div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard?.chart_data || []} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dx={-5} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="present" stroke="#ef4444" strokeWidth={2} fill="url(#colorPresent)" activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} fill="transparent" activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="absent" stroke="#10b981" strokeWidth={2} fill="transparent" activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] text-slate-500 font-bold">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[11px] text-slate-500 font-bold">Late</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[11px] text-slate-500 font-bold">Absent</span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-white rounded-[1.25rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col h-full">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-maroon-600" />
                    <h3 className="text-[14px] font-bold text-slate-900">Today&apos;s Schedule</h3>
                  </div>
                  <Link href="/teacher/assigned-class" className="text-[11px] font-bold text-maroon-600 hover:text-maroon-700 transition-colors">
                    View all
                  </Link>
                </div>
                {dashboard?.schedule && dashboard.schedule.length > 0 ? (
                  <div className="space-y-4 flex-1">
                    {dashboard.schedule.map((item: { id: string | number, time: string, title: string }) => (
                      <div key={item.id} className="flex items-start gap-4 hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors">
                        <div className="text-[11px] font-bold text-slate-400 mt-1 w-14 text-right">
                          {item.time.split('-')[0].trim()}
                        </div>
                        <div className="w-2 h-2 rounded-full bg-maroon-600 mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-400 font-medium">Mathematics</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 flex-1 flex flex-col justify-center items-center">
                    <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[12px] text-slate-400 font-bold">No classes today</p>
                  </div>
                )}
                
                <Link href="/teacher/assigned-class" className="w-full mt-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-maroon-600 text-[12px] font-bold flex items-center justify-center gap-2 transition-colors">
                  View Full Schedule <ChevronRight className="w-3 h-3" strokeWidth={3} />
                </Link>
              </div>
            </div>

            {/* Main Grid Row 2: Recent Scans & Pending Excuses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Recent Scans */}
              <div className="bg-white rounded-[1.25rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 text-maroon-600" />
                    <h3 className="text-[14px] font-bold text-slate-900">Recent Scans</h3>
                  </div>
                  <Link href="/teacher/assigned-students" className="text-[11px] font-bold text-maroon-600 hover:text-maroon-700 transition-colors">
                    View all
                  </Link>
                </div>
                {dashboard?.recent_scans && dashboard.recent_scans.length > 0 ? (
                  <div className="space-y-1">
                    {dashboard.recent_scans.map((scan: { id: string | number, time: string, type: string, status: string, user: { name: string, photo_url: string | null } }) => (
                      <div key={scan.id} className="flex items-center gap-4 py-2.5 px-3 -mx-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer" onClick={() => window.location.href = '/teacher/assigned-students'}>
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {scan.user.photo_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={getAvatarUrl(scan.user.photo_url) || ''} alt={scan.user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[12px] font-bold text-slate-400">{scan.user.name.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 truncate">{scan.user.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{scan.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-slate-600">
                            {new Date(`2000-01-01T${scan.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">Today</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                            scan.status === 'Present' || scan.status === 'Early' ? 'text-emerald-600 bg-emerald-50' :
                            scan.status === 'Late' ? 'text-amber-600 bg-amber-50' :
                            'text-rose-600 bg-rose-50'
                          }`}>
                            {scan.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 flex flex-col justify-center items-center">
                    <Scan className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[12px] text-slate-400 font-bold">No scans yet today</p>
                  </div>
                )}
              </div>

              {/* Pending Excuses */}
              <div className="bg-white rounded-[1.25rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-maroon-600" />
                    <h3 className="text-[14px] font-bold text-slate-900">Pending Excuses</h3>
                  </div>
                  <Link href="/teacher/excuse-students" className="text-[11px] font-bold text-maroon-600 hover:text-maroon-700 transition-colors">
                    View all
                  </Link>
                </div>
                {dashboard?.recent_excuses && dashboard.recent_excuses.length > 0 ? (
                  <div className="space-y-1 flex-1">
                    {dashboard.recent_excuses.map((excuse: { id: string | number, date: string, student_name: string, photo_url: string | null }) => (
                      <div
                        key={excuse.id}
                        className="flex items-center gap-4 py-2.5 px-3 -mx-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                        onClick={() => window.location.href = '/teacher/excuse-students'}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {excuse.photo_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={getAvatarUrl(excuse.photo_url) || ''} alt={excuse.student_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[12px] font-bold text-slate-400">{excuse.student_name.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 truncate">{excuse.student_name}</p>
                          <p className="text-[11px] text-slate-500 font-medium">Grade 10 - Section A</p>
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 text-right">
                          {excuse.date}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-bold text-maroon-600 bg-maroon-50 border border-maroon-100 uppercase tracking-wider px-2 py-0.5 rounded-md">
                            NEW
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 flex-1 flex flex-col justify-center items-center">
                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[12px] text-slate-400 font-bold">No pending excuses</p>
                  </div>
                )}
                
                <Link href="/teacher/excuse-students" className="w-full mt-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-maroon-600 text-[12px] font-bold flex items-center justify-center gap-2 transition-colors">
                  <FileText className="w-3.5 h-3.5" /> Review All Excuses <ChevronRight className="w-3 h-3" strokeWidth={3} />
                </Link>
              </div>

            </div>
          </>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}