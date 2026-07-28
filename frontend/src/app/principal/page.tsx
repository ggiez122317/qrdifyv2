'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, UserMinus, Calendar } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const mockLeaves = [
  { id: 1, name: "Maria Garcia", role: "Teacher", type: "Sick Leave", date: "July 20-22, 2026", status: "PENDING", initials: "MG" },
  { id: 2, name: "John Smith", role: "Student", type: "Family Emergency", date: "July 21, 2026", status: "PENDING", initials: "JS" },
  { id: 3, name: "Sarah Lee", role: "Teacher", type: "Vacation Leave", date: "Aug 1-5, 2026", status: "APPROVED", initials: "SL" },
];

// Mock data for the tiny sparkline charts
const sparklineDataGreen = [{v: 10},{v: 15},{v: 13},{v: 20},{v: 18},{v: 25}];
const sparklineDataOrange = [{v: 5},{v: 4},{v: 7},{v: 3},{v: 8},{v: 10}];
const sparklineDataRed = [{v: 10},{v: 8},{v: 12},{v: 9},{v: 11},{v: 7}];
const sparklineDataBlue = [{v: 140},{v: 142},{v: 145},{v: 150},{v: 148},{v: 156}];

export default function PrincipalDashboard() {
  const { data: statsData } = useQuery({
    queryKey: ['principal-stats'],
    queryFn: async () => {
      const res = await api.get('/api/attendance/stats');
      return res.data;
    }
  });

  const stats = statsData || { overview: {}, distribution: {}, trend: [], total_users: 0 };
  const presentVal = (stats.overview.present || 0) + (stats.overview.early || 0) || 128;
  const lateVal = stats.overview.late || 12;
  const absentVal = stats.overview.absent || 15;
  const totalVal = stats.total_users || 156;

  // Pie Chart Data
  const pieData = [
    { name: 'Present', value: presentVal, color: '#10b981' }, // emerald-500
    { name: 'Late', value: lateVal, color: '#f59e0b' },      // amber-500
    { name: 'Absent', value: absentVal, color: '#ef4444' },    // red-500
  ];

  // Trend Data for main chart
  const trendData = [
    { name: 'Jul 14', present: 105, absent: 12 },
    { name: 'Jul 15', present: 125, absent: 10 },
    { name: 'Jul 16', present: 105, absent: 12 },
    { name: 'Jul 17', present: 128, absent: 11 },
    { name: 'Jul 18', present: 105, absent: 11 },
    { name: 'Jul 19', present: 130, absent: 15 },
    { name: 'Jul 20', present: presentVal, absent: absentVal },
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20 bg-[#f9fafb] min-h-screen">
      
      {/* Header Section */}
      <div className="flex justify-between items-center pb-2">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Good morning, Principal John! <span className="text-2xl">👋</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Here's what's happening with your school today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-600 shadow-[0_2px_10px_rgba(0,0,0,0.02)] font-semibold text-sm">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>Tuesday, July 20, 2026</span>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="PRESENT TODAY" 
          value={presentVal} 
          subtitle="Students"
          icon={<UserCheck className="w-6 h-6 text-emerald-500" />} 
          bg="bg-emerald-50" 
          chartData={sparklineDataGreen}
          chartColor="#10b981"
          trend="+ 8.2% from yesterday"
          trendColor="text-emerald-500"
        />
        <MetricCard 
          title="LATE TODAY" 
          value={lateVal} 
          subtitle="Students"
          icon={<Clock className="w-6 h-6 text-amber-500" />} 
          bg="bg-amber-50" 
          chartData={sparklineDataOrange}
          chartColor="#f59e0b"
          trend="+ 3.1% from yesterday"
          trendColor="text-emerald-500"
        />
        <MetricCard 
          title="ABSENT TODAY" 
          value={absentVal} 
          subtitle="Students"
          icon={<UserMinus className="w-6 h-6 text-red-500" />} 
          bg="bg-red-50" 
          chartData={sparklineDataRed}
          chartColor="#ef4444"
          trend="↓ 2.4% from yesterday"
          trendColor="text-red-500"
        />
        <MetricCard 
          title="TOTAL USERS" 
          value={totalVal} 
          subtitle="Staff & Students"
          icon={<Users className="w-6 h-6 text-blue-500" />} 
          bg="bg-blue-50" 
          chartData={sparklineDataBlue}
          chartColor="#3b82f6"
          trend="↑ 6.7% from last month"
          trendColor="text-emerald-500"
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        
        {/* 7-Day Trend */}
        <Card className="border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-visible">
          <CardHeader className="flex flex-row justify-between items-center pb-6">
            <CardTitle className="text-base font-bold text-slate-800">7-Day Attendance Trend</CardTitle>
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-2 cursor-pointer">
              Students
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="linear" dataKey="present" stroke="#c22525" strokeWidth={2} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6, fill: '#c22525'}} name="Present" />
                  <Line type="linear" dataKey="absent" stroke="#1e293b" strokeWidth={2} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6, fill: '#1e293b'}} name="Absent" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#c22525]" />
                <span className="text-xs font-bold text-slate-600">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" />
                <span className="text-xs font-bold text-slate-600">Absent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Distribution Donut */}
        <Card className="border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Attendance Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="h-[200px] w-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 tracking-tight">85%</span>
                <span className="text-xs font-semibold text-slate-500">Present</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="flex flex-col gap-6 w-full max-w-[140px]">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs font-semibold text-slate-700">{entry.name}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {entry.name === 'Present' ? '85% (128)' : (entry.name === 'Late' ? '8% (12)' : '7% (15)')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Attendance Scans */}
        <Card className="border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl bg-white h-[280px]">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Live Attendance Scans</CardTitle>
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full pb-10">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
               {/* Radar Icon SVG */}
               <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12h.01"/><path d="M16 12a4 4 0 0 1-8 0"/><path d="M20 12a8 8 0 0 1-16 0"/><path d="M24 12a12 12 0 0 1-24 0"/></svg>
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">No scans recorded today.</p>
            <p className="text-xs text-slate-400 font-medium">Attendance scans will appear here in real-time.</p>
          </CardContent>
        </Card>

        {/* Recent Leave Requests */}
        <Card className="border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl bg-white h-[280px] flex flex-col">
          <CardHeader className="flex flex-row justify-between items-center pb-2 border-b border-slate-50">
            <CardTitle className="text-base font-bold text-slate-800">Recent Leave Requests</CardTitle>
            <Link href="/principal/leave-management" className="text-xs font-bold text-[#c22525] hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col justify-center">
            <div className="divide-y divide-slate-100 px-2 py-2">
              {mockLeaves.map((leave: any) => (
                <div key={leave.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-full bg-[#f1f5f9] flex items-center justify-center text-slate-600 font-bold text-xs">
                       {leave.initials}
                     </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-[13px]">{leave.name} <span className="text-slate-400 font-normal">({leave.role})</span></h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{leave.type} • {leave.date}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                    leave.status === 'PENDING' 
                      ? 'bg-amber-50 text-amber-600' 
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, bg, chartData, chartColor, trend, trendColor }: any) {
  return (
    <Card className="border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl bg-white p-5 flex flex-col justify-between h-[150px]">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>
          </div>
        </div>
        
        {/* Mini Sparkline Chart */}
        <div className="w-[60px] h-[30px] self-end mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line type="monotone" dataKey="v" stroke={chartColor} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Trend Percentage */}
      <div className={`text-[10px] font-bold mt-4 ${trendColor}`}>
        {trend}
      </div>
    </Card>
  );
}
