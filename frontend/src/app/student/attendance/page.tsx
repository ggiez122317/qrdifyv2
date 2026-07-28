'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Clock, Calendar, CheckCircle, AlertCircle, FileBarChart } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StudentAttendanceRecord() {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['student-attendance-record'],
    queryFn: async () => {
      const res = await api.get('/api/student/attendance-record');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { summary, distribution, monthly_trend, history } = attendanceData || {};

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 pb-20 overflow-y-auto h-full max-h-screen custom-scrollbar">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#161920] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <FileBarChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              Attendance Record
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-13">Detailed analytics of your attendance behavior.</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-[#0f1115] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-[#1e232e] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-[#1e232e] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              History Log
            </button>
          </div>
        </div>

        {/* KPI Cards (Always Visible) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-sm bg-white dark:bg-[#161920] border border-slate-100 dark:border-white/5 relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Present</p>
                  <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{summary?.present || 0}</div>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-emerald-500 text-xs font-bold">{summary?.present_percentage || 0}% <span className="text-slate-400 font-normal">of total days</span></p>
                <div className="w-16 h-8 opacity-50">
                  <svg viewBox="0 0 100 30" className="w-full h-full stroke-emerald-500 fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M0 25 Q 15 15, 30 20 T 60 10 T 100 5" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white dark:bg-[#161920] border border-slate-100 dark:border-white/5 relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Absent</p>
                  <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{summary?.absent || 0}</div>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-red-500 text-xs font-bold">0% <span className="text-slate-400 font-normal">of total days</span></p>
                <div className="w-16 h-8 opacity-50">
                  <svg viewBox="0 0 100 30" className="w-full h-full stroke-red-500 fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M0 25 Q 25 25, 50 15 T 100 10" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white dark:bg-[#161920] border border-slate-100 dark:border-white/5 relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Late</p>
                  <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{summary?.late || 0}</div>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-amber-500 text-xs font-bold">0% <span className="text-slate-400 font-normal">of total days</span></p>
                <div className="w-16 h-8 opacity-50">
                  <svg viewBox="0 0 100 30" className="w-full h-full stroke-amber-500 fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M0 25 Q 25 15, 50 25 T 100 15" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white dark:bg-[#161920] border border-slate-100 dark:border-white/5 relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Records</p>
                  <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{summary?.total || 0}</div>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-blue-500 text-xs font-bold">0% <span className="text-slate-400 font-normal">of total days</span></p>
                <div className="w-16 h-8 opacity-50">
                  <svg viewBox="0 0 100 30" className="w-full h-full stroke-blue-500 fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M0 25 Q 30 10, 50 20 T 100 5" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <Card className="col-span-1 border-none shadow-sm bg-white dark:bg-[#161920]">
                <CardHeader>
                  <CardTitle className="text-lg">Distribution</CardTitle>
                  <CardDescription>Overall attendance breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {distribution && distribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {distribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                          />
                          <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ paddingLeft: '20px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1 lg:col-span-2 border-none shadow-sm bg-white dark:bg-[#161920]">
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Trend</CardTitle>
                  <CardDescription>Your attendance behavior over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {monthly_trend && monthly_trend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthly_trend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                          />
                          <Legend />
                          <Bar dataKey="present" name="Present" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                          <Bar dataKey="late" name="Late" stackId="a" fill="#f59e0b" />
                          <Bar dataKey="absent" name="Absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                        <div className="p-3 bg-slate-50 dark:bg-[#0f1115] rounded-lg">
                          <FileBarChart className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="font-bold text-slate-700 dark:text-slate-300">No data available</p>
                        <p className="text-xs">Attendance data will appear here.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-sm bg-white dark:bg-[#161920]">
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>Comprehensive log of all your recorded attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-[#0f1115]">
                      <TableRow className="border-slate-200 dark:border-white/10 hover:bg-transparent">
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Date</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Time In</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Time Out</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Status</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history && history.length > 0 ? (
                        history.map((record: any) => (
                          <TableRow key={record.id} className="border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:hover:bg-white/5">
                            <TableCell className="font-medium">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                            <TableCell>
                              {record.time_in ? (
                                <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300">
                                  {record.time_in}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {record.time_out ? (
                                <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300">
                                  {record.time_out}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                record.status === 'Present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                record.status === 'Late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                              }`}>
                                {record.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                              {record.remarks || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-full">
                                <FileBarChart className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-700 dark:text-slate-300">No attendance records found.</p>
                                <p className="text-sm mt-1">When attendance is recorded, it will appear here.</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
