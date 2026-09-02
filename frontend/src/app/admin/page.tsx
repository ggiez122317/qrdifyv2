"use client";

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  Calendar, Users, Activity, Database, Layers, ChevronDown, CheckSquare, 
  ShieldAlert 
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/me');
      return res.data.user;
    },
    staleTime: 60000,
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const res = await api.get('/api/system/admin/dashboard');
      return res.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const currentDate = new Date();
  const nextWeek = new Date(currentDate);
  nextWeek.setDate(currentDate.getDate() + 7);

  // Fallbacks for when data is loading
  const stats = dashboardData?.stats || { total_users: 0, users_increase: 0, active_modules_pct: 0, system_health: 0, total_logs: 0, logs_increase: 0 };
  const areaData = dashboardData?.activity_data || [];
  const pieData = dashboardData?.roles_data || [];
  const modulesData = dashboardData?.modules_performance || [];
  const recentLogs = dashboardData?.recent_logs || [];
  const upcomingEvents = dashboardData?.upcoming_events || [];

  // Map icon names to actual Lucide components for modules
  const getIcon = (name: string) => {
    switch (name) {
      case 'Student Management': return Users;
      case 'Teacher Management': return Users;
      case 'System Logs': return Database;
      case 'Security Controls': return ShieldAlert;
      default: return CheckSquare;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 bg-slate-50/50 dark:bg-[#12141a] min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            Good morning, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base font-medium">
            Here&apos;s what&apos;s happening with your workspace today.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>{format(currentDate, 'MMM d')} - {format(nextWeek, 'MMM d, yyyy')}</span>
          <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-none border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_10px_rgb(0,0,0,0.03)] flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0B3A82] dark:text-blue-400" />
              </div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">System Users</span>
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">{stats.total_users.toLocaleString()}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <span className={`${stats.users_increase >= 0 ? 'text-green-500' : 'text-red-500'} font-medium flex items-center`}>
                    <ChevronDown className={`w-3 h-3 ${stats.users_increase >= 0 ? 'rotate-180' : ''}`} /> {Math.abs(stats.users_increase)}%
                  </span> from last week
                </p>
              </div>
              <div className="w-24 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={areaData}>
                    <Line type="monotone" dataKey="value" stroke="#0B3A82" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-none border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_10px_rgb(0,0,0,0.03)] flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#F5A623] dark:text-amber-400" />
              </div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Active Modules</span>
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">{stats.active_modules_pct}%</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <span className="text-green-500 font-medium flex items-center"><ChevronDown className="w-3 h-3 rotate-180" /> Active</span> based on usage
                </p>
              </div>
              <div className="w-24 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={areaData}>
                    <Line type="monotone" dataKey="value" stroke="#F5A623" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-none border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_10px_rgb(0,0,0,0.03)] flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">System Health</span>
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">{stats.system_health}%</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <span className={`${stats.system_health >= 90 ? 'text-green-500' : 'text-yellow-500'} font-medium flex items-center`}>Uptime</span>
                </p>
              </div>
              <div className="w-24 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={areaData}>
                    <Line type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-none border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_10px_rgb(0,0,0,0.03)] flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-slate-50 dark:bg-slate-500/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Total Logs</span>
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">{stats.total_logs.toLocaleString()}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <span className={`${stats.logs_increase >= 0 ? 'text-green-500' : 'text-red-500'} font-medium flex items-center`}>
                    <ChevronDown className={`w-3 h-3 ${stats.logs_increase >= 0 ? 'rotate-180' : ''}`} /> {Math.abs(stats.logs_increase)}%
                  </span> from last week
                </p>
              </div>
              <div className="w-24 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={areaData}>
                    <Line type="monotone" dataKey="value" stroke="#64748B" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-none border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_15px_rgb(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">System Activity Overview</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Track system interactions and performance</p>
            </div>
            <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-none text-sm text-slate-600 dark:text-slate-300 cursor-pointer font-semibold">
              This Week <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B3A82" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0B3A82" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  itemStyle={{ color: '#0B3A82', fontWeight: 600 }}
                  cursor={{ stroke: '#0B3A82', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="value" stroke="#0B3A82" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" activeDot={{ r: 6, fill: '#0B3A82', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-none border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_15px_rgb(0,0,0,0.03)] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">User Roles</h2>
            <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-none text-sm text-slate-600 dark:text-slate-300 cursor-pointer font-semibold">
              This Week <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex-1 relative flex items-center justify-center py-4">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stats.total_users}</span>
              <span className="text-xs text-slate-500 font-medium">Total Users</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {pieData.map((entry: { name: string; value: number; color: string }, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4">
            {pieData.map((item: { name: string; value: number; color: string }, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-700 dark:text-slate-200 tracking-tight">{item.name}</span>
                  <span className="text-xs text-slate-500 font-medium">{item.value} ({stats.total_users > 0 ? Math.round((item.value / stats.total_users) * 100) : 0}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Modules Overview */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-none border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_15px_rgb(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Modules Overview</h2>
            <button className="text-sm font-bold text-slate-500 hover:text-[#0B3A82] transition-colors">View All</button>
          </div>
          
          <div className="space-y-6">
            {modulesData.map((mod: { name: string; desc: string; progress: number; color: string; text: string; bg: string }, i: number) => {
              const Icon = getIcon(mod.name);
              return (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-none ${mod.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${mod.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate tracking-tight">{mod.name}</h4>
                  <p className="text-xs text-slate-500 truncate font-medium">{mod.desc}</p>
                </div>
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${mod.color} rounded-full`} style={{ width: `${mod.progress}%` }}></div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 w-8 tracking-tight">{mod.progress}%</span>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-none border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_15px_rgb(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Recent System Logs</h2>
            <button className="text-sm font-bold text-slate-500 hover:text-[#0B3A82] transition-colors">View All</button>
          </div>
          
          <div className="space-y-6">
            {recentLogs.length > 0 ? recentLogs.map((log: { initial: string; name: string; action: string; module: string; time: string; color: string }, i: number) => (
              <div key={i} className="flex gap-4">
                <div className={`w-10 h-10 rounded-full ${log.color} text-white flex items-center justify-center font-extrabold text-sm shrink-0 tracking-tight`}>
                  {log.initial}
                </div>
                <div className="flex-1 min-w-0 border-b border-slate-100 dark:border-slate-700/50 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    <span className="font-extrabold tracking-tight">{log.name}</span> {log.action}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">{log.module}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap font-medium">{log.time}</span>
              </div>
            )) : <p className="text-sm text-slate-500 font-medium">No recent logs.</p>}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-none border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_15px_rgb(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Upcoming Events</h2>
            <button className="text-sm font-bold text-slate-500 hover:text-[#0B3A82] transition-colors">View Calendar</button>
          </div>
          
          <div className="space-y-6">
            {upcomingEvents.length > 0 ? upcomingEvents.map((evt: { date: string; month: string; title: string; time: string }, i: number) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-none shrink-0">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">{evt.date}</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-1">{evt.month}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate tracking-tight">{evt.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{evt.time}</p>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#0B3A82] border-2 border-white dark:border-slate-800 z-30"></div>
                  <div className="w-6 h-6 rounded-full bg-[#F5A623] border-2 border-white dark:border-slate-800 z-20"></div>
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center z-10 text-[8px] font-bold text-slate-600 dark:text-slate-300">
                    +2
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500 font-medium">No upcoming events.</p>}
          </div>
        </div>

      </div>

    </div>
  );
}
