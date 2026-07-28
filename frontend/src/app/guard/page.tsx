'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Clock, UserCheck, UserX, Calendar, ChevronDown, Check, ArrowUp, ScanFace } from 'lucide-react';

interface StatsResponse {
  overview: {
    present: number;
    late: number;
    absent: number;
  };
  distribution: {
    students: number;
    teachers: number;
  };
  trend: {
    name: string;
    value: number;
  }[];
  total_users: number;
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color?: string; fill?: string; name: string; value: number | string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-lg">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        {payload.map((entry: { color?: string; fill?: string; name: string; value: number | string }, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
            <span className="text-slate-600 capitalize">{entry.name}:</span>
            <span className="font-bold text-slate-800">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function GuardStation() {
  const queryClient = useQueryClient();
  const [greeting] = useState(() => {
    if (typeof window !== 'undefined') {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 18) return 'Good Afternoon';
      return 'Good Evening';
    }
    return 'Good Day';
  });
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Fetch stats with auto-polling for near real-time updates
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ['attendanceStats', selectedDate],
    queryFn: async () => {
      const res = await api.get('/api/attendance/stats', { params: { date: selectedDate } });
      return res.data;
    },
    refetchInterval: isToday ? 15000 : false, // Poll every 15s for today's data
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/me');
      return res.data.user;
    },
    staleTime: Infinity,
  });

  const { data: todayScans } = useQuery({
    queryKey: ['recentScans', selectedDate],
    queryFn: async () => {
      const res = await api.get('/api/attendance/today', { params: { date: selectedDate } });
      return res.data;
    },
    refetchInterval: isToday ? 15000 : false, // Poll every 15s for today's data
  });



  const totalUsers = stats?.total_users || 0;

  const attendanceData = stats ? [
    { name: 'Present', value: stats.overview.present, color: '#10b981' },
    { name: 'Late', value: stats.overview.late, color: '#f59e0b' },
    { name: 'Absent', value: stats.overview.absent, color: '#ef4444' },
  ] : [];

  const totalAttendance = stats ? (stats.overview.present + stats.overview.late + stats.overview.absent) : 0;
  const displayAttendanceData = totalAttendance === 0 
    ? [{ name: 'No Data', value: 1, color: '#f8fafc' }] 
    : attendanceData;

  const defaultTrendData = [
    { name: 'Mon', value: 0 },
    { name: 'Tue', value: 0 },
    { name: 'Wed', value: 0 },
    { name: 'Thu', value: 0 },
    { name: 'Fri', value: 0 }
  ];
  const trendData = stats?.trend?.length ? stats.trend : defaultTrendData;

  const totalScans = (stats?.distribution.students || 0) + (stats?.distribution.teachers || 0);

  const rolesData = stats ? [
    { name: 'Students', value: stats.distribution.students, percentage: totalScans > 0 ? Math.round((stats.distribution.students / totalScans) * 100) + '%' : '0%', color: '#3b82f6' },
    { name: 'Teachers', value: stats.distribution.teachers, percentage: totalScans > 0 ? Math.round((stats.distribution.teachers / totalScans) * 100) + '%' : '0%', color: '#34d399' },
  ] : [];

  const displayRolesData = totalScans === 0
    ? [{ name: 'No Scans', value: 1, color: '#f8fafc' }]
    : rolesData;

  const scansArray = Array.isArray(todayScans) ? todayScans : (todayScans?.data || []);
  const recentScans = scansArray.slice(0, 10).map((scan: { user?: { name?: string; photo_url?: string; roles?: { name: string }[]; student_profile?: { grade?: string; section?: string }; teacher_profile?: { position?: string } }; status?: string; time_in?: string; time_out?: string }) => {
    const isStudent = scan.user?.roles?.some((r: { name: string }) => r.name === 'student');
    const roleText = isStudent 
      ? `Grade ${scan.user?.student_profile?.grade || ''} - ${scan.user?.student_profile?.section || ''}` 
      : (scan.user?.teacher_profile?.position || 'Teacher');
      
    const isLate = scan.status === 'late';
    const isEarly = scan.status === 'early';
    let statusColor = 'bg-emerald-100 text-emerald-700';
    if (isLate) statusColor = 'bg-amber-100 text-amber-700';
    if (isEarly) statusColor = 'bg-teal-100 text-teal-700';

    const getImageUrl = (path: string | undefined | null) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      const cleanPath = path.replace(/^\/?storage\//, '');
      return `/storage/${cleanPath}`;
    };

    return {
      initials: scan.user?.name?.substring(0, 2).toUpperCase() || '??',
      photo: getImageUrl(scan.user?.photo_url),
      bg: isStudent ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600',
      name: scan.user?.name || 'Unknown',
      role: roleText,
      time: new Date(`2000-01-01T${scan.time_in}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      status: scan.time_out ? 'Time Out' : 'Time In',
      statusIcon: <Check className="w-3 h-3 mr-1" />,
      statusColor: statusColor
    };
  });

  return (
    <>
      <div className="space-y-6 pb-12">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              {greeting}, <span className="text-maroon-600">{user?.name?.split(' ')[0] || 'Guard'}!</span> <span className="text-2xl animate-waving-hand">👋</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">Here&apos;s what&apos;s happening with attendance today.</p>
          </div>
          <div className="relative flex items-center">
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm shadow-sm border border-red-100 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-300 cursor-pointer"
            />
            <Calendar className="absolute left-3.5 w-4 h-4 text-red-600 pointer-events-none" />
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-extrabold tracking-wider text-emerald-500 uppercase">Total Scanned</h3>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
                </div>
             </div>
             <p className="text-4xl font-extrabold text-slate-800 mb-4">{(stats?.overview.present ?? 0) + (stats?.overview.late ?? 0)}</p>
             <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
               <span className="text-slate-300">—</span> Students & Teachers
             </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-extrabold tracking-wider text-blue-500 uppercase">Present</h3>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-blue-500" strokeWidth={2.5} />
                </div>
             </div>
             <p className="text-4xl font-extrabold text-slate-800 mb-4">{stats?.overview.present || 0}</p>
             <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
               <span className="text-slate-300">—</span> 0% from yesterday
             </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-extrabold tracking-wider text-amber-500 uppercase">Late</h3>
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" strokeWidth={2.5} />
                </div>
             </div>
             <p className="text-4xl font-extrabold text-slate-800 mb-4">{stats?.overview.late || 0}</p>
             <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
               <span className="text-slate-300">—</span> 0% from yesterday
             </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-extrabold tracking-wider text-red-500 uppercase">Absent</h3>
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <UserX className="w-5 h-5 text-red-500" strokeWidth={2.5} />
                </div>
             </div>
             <p className="text-4xl font-extrabold text-slate-800 mb-4">{stats?.overview.absent ?? 0}</p>
             <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
               <ArrowUp className="w-3 h-3 text-red-500" strokeWidth={3} /> <span className="text-red-500 font-bold tracking-tight">100%</span> from yesterday
             </p>
          </div>

        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Attendance Status Donut */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Attendance Status</h3>
              <div className="flex items-center gap-1 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg cursor-pointer hover:bg-slate-100">
                Today <ChevronDown className="w-4 h-4 ml-1 text-slate-400" />
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-between">
               <div className="w-[280px] h-[280px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayAttendanceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-4xl font-extrabold text-slate-800 tracking-tighter">{totalUsers > 0 ? Math.round(((stats?.overview.present ?? 0) + (stats?.overview.late ?? 0)) / totalUsers * 100) : 0}%</span>
                     <span className="text-sm font-medium text-slate-500 mt-1">Attendance Rate</span>
                   </div>
               </div>

               {/* Custom Legend */}
               <div className="flex-1 pl-8 flex flex-col justify-between h-[220px]">
                  <div className="space-y-4 pt-4">
                    {attendanceData.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="font-medium text-slate-700">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{item.value}</span>
                          <span className="text-slate-400 text-xs w-8 text-right">({item.value === 2 ? '100%' : '0%'})</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                     <span className="text-sm font-semibold text-slate-600">Total Users</span>
                     <span className="text-xl font-extrabold text-slate-800">{totalUsers}</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Recent Scans List */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Recent Scans</h3>
              <button className="text-xs font-bold text-maroon-600 bg-red-50 hover:bg-red-100 px-4 py-1.5 rounded-lg transition-colors">
                View All
              </button>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto pr-2 -mr-2">
               {recentScans.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400">
                   <ScanFace className="w-12 h-12 mb-3 text-slate-200" strokeWidth={1} />
                   <p className="font-bold text-sm text-slate-400">No scans found</p>
                   <p className="text-xs text-slate-400/80 mt-1">There are no records for this date.</p>
                 </div>
               ) : (
                 recentScans.map((scan: { photo?: string | null; name: string; initials: string; bg: string; role: string; time: string; status: string; statusColor: string; statusIcon: React.ReactNode }, i: number) => (
                   <div key={i} className={`flex items-center justify-between py-4 ${i !== recentScans.length - 1 ? 'border-b border-slate-100' : ''}`}>
                      <div className="flex items-center gap-4">
                         {scan.photo ? (
                           <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                             <img 
                               src={scan.photo} 
                               alt={scan.name} 
                               className="w-full h-full object-cover" 
                               onError={(e) => {
                                 (e.target as HTMLImageElement).style.display = 'none';
                                 (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                               }}
                             />
                             <div className={`hidden w-full h-full flex items-center justify-center font-bold text-sm ${scan.bg}`}>
                               {scan.initials}
                             </div>
                           </div>
                         ) : (
                           <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${scan.bg}`}>
                             {scan.initials}
                           </div>
                         )}
                         <div>
                           <p className="font-bold text-slate-800">{scan.name}</p>
                           <p className="text-xs font-medium text-slate-500">{scan.role}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-bold text-slate-700 mb-1">{scan.time}</p>
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${scan.statusColor}`}>
                           {scan.statusIcon}
                           {scan.status}
                         </span>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Attendance Trend (Area Chart) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Attendance Trend <span className="text-sm font-medium text-slate-400 ml-1">(This Week)</span></h3>
              <div className="flex items-center gap-1 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg cursor-pointer hover:bg-slate-100">
                This Week <ChevronDown className="w-4 h-4 ml-1 text-slate-400" />
              </div>
            </div>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickCount={5} domain={[0, 20]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" dot={{r: 4, fill: '#e11d48', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6, fill: '#e11d48', strokeWidth: 0}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scans by Role Donut */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Scans by Role</h3>
              <div className="flex items-center gap-1 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg cursor-pointer hover:bg-slate-100">
                Today <ChevronDown className="w-4 h-4 ml-1 text-slate-400" />
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-between">
               <div className="w-[250px] h-[250px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayRolesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {rolesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                    </PieChart>
                  </ResponsiveContainer>
               </div>

               {/* Custom Legend */}
               <div className="flex-1 pl-8 flex flex-col justify-between h-[180px]">
                  <div className="space-y-5 pt-4">
                    {rolesData.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="font-bold text-slate-700">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">{item.value}</span>
                          <span className="text-slate-400 text-xs w-10 text-right">({item.percentage})</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                     <span className="text-sm font-semibold text-slate-600">Total Scans</span>
                     <span className="text-xl font-extrabold text-slate-800">{totalScans}</span>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
