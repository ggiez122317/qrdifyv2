'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Printer, FileSpreadsheet, BarChart3, LineChart as LineChartIcon, X, Calendar as CalendarIcon, PieChart as PieChartIcon, Users, MoreVertical, ArrowUp, FileText, Clock, UserX, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState('month'); // month, week, year

  const { data: reports, isLoading } = useQuery({
    queryKey: ['teacher-reports', dateRange],
    queryFn: async () => {
      // In a real app, dateRange would filter the backend
      const res = await api.get('/api/teacher/reports');
      return res.data;
    },
  });

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      
      // DepEd Formatted Document Header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DEPARTMENT OF EDUCATION", 148, 20, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("School Attendance Format - Teacher's Report", 148, 26, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 40);
      doc.text(`Report Period: This Month`, 14, 46);
      doc.text(`Total Students Monitored: ${reports?.students_count || 0}`, 14, 52);

      // Prepare Table Data from backend
      // We need to fetch assigned students data to generate a detailed row-by-row PDF
      // For now, we will create a summary table based on the overview
      
      const tableColumn = ["Status", "Total Count", "Percentage"];
      const total = (reports?.overview?.present || 0) + (reports?.overview?.late || 0) + (reports?.overview?.absent || 0);
      const getPct = (val: number) => total > 0 ? ((val / total) * 100).toFixed(1) + '%' : '0%';
      
      const tableRows = [
        ["Present & Early", reports?.overview?.present || 0, getPct(reports?.overview?.present || 0)],
        ["Late", reports?.overview?.late || 0, getPct(reports?.overview?.late || 0)],
        ["Absent", reports?.overview?.absent || 0, getPct(reports?.overview?.absent || 0)],
      ];

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        styles: { fontSize: 10, cellPadding: 3, halign: 'center' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      // Signature area
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      doc.text("Prepared by:", 14, finalY + 30);
      doc.line(14, finalY + 45, 80, finalY + 45); // signature line
      doc.text("Teacher/Adviser Signature", 14, finalY + 50);

      doc.save(`DepEd_Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF');
    } finally {
      setIsReportModalOpen(false);
    }
  };

  const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
  const pieData = [
    { name: 'Present', value: reports?.overview?.present || 0 },
    { name: 'Late', value: reports?.overview?.late || 0 },
    { name: 'Absent', value: reports?.overview?.absent || 0 },
  ];

  return (
    <DashboardLayout>
      <div className="bg-[#f4f6f8] min-h-[calc(100vh-5rem)] -m-6 md:-m-8 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 pb-10">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
            <div>
              <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
              <p className="text-[13px] font-medium text-slate-500 mt-0.5">View aggregate attendance data and generate official reports.</p>
            </div>
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="bg-[#7a1315] hover:bg-[#5a0d0f] text-white text-[13px] font-bold px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(122,19,21,0.2)] transition-all hover:shadow-[0_4px_16px_rgba(122,19,21,0.3)] flex items-center gap-2"
            >
              <Download className="w-4 h-4" strokeWidth={2.5} />
              Generate Report
              <ChevronDown className="w-4 h-4 ml-1 opacity-70" strokeWidth={2.5} />
            </button>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Students */}
            <div className="bg-white rounded-[1.25rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-indigo-500" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">Total Students</span>
                    <span className="text-2xl font-black text-slate-900 leading-tight">{reports?.students_count || 0}</span>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors p-1"><MoreVertical className="w-4 h-4" /></button>
              </div>
              <div className="mt-4 flex items-center gap-1.5 ml-[64px] relative z-10">
                <ArrowUp className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
                <span className="text-[11px] font-bold text-emerald-500">0%</span>
                <span className="text-[11px] font-medium text-slate-400">from last 30 days</span>
              </div>
            </div>

            {/* Total Presents */}
            <div className="bg-white rounded-[1.25rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">Total Presents</span>
                    <span className="text-2xl font-black text-slate-900 leading-tight">{reports?.overview?.present || 0}</span>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors p-1"><MoreVertical className="w-4 h-4" /></button>
              </div>
              <div className="mt-4 flex items-center gap-1.5 ml-[64px] relative z-10">
                <ArrowUp className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
                <span className="text-[11px] font-bold text-emerald-500">0%</span>
                <span className="text-[11px] font-medium text-slate-400">from last 30 days</span>
              </div>
            </div>

            {/* Total Lates */}
            <div className="bg-white rounded-[1.25rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-amber-500" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">Total Lates</span>
                    <span className="text-2xl font-black text-slate-900 leading-tight">{reports?.overview?.late || 0}</span>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors p-1"><MoreVertical className="w-4 h-4" /></button>
              </div>
              <div className="mt-4 flex items-center gap-1.5 ml-[64px] relative z-10">
                <ArrowUp className="w-3.5 h-3.5 text-amber-500" strokeWidth={3} />
                <span className="text-[11px] font-bold text-amber-500">0%</span>
                <span className="text-[11px] font-medium text-slate-400">from last 30 days</span>
              </div>
            </div>

            {/* Total Absences */}
            <div className="bg-white rounded-[1.25rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <UserX className="w-6 h-6 text-red-500" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">Total Absences</span>
                    <span className="text-2xl font-black text-slate-900 leading-tight">{reports?.overview?.absent || 0}</span>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors p-1"><MoreVertical className="w-4 h-4" /></button>
              </div>
              <div className="mt-4 flex items-center gap-1.5 ml-[64px] relative z-10">
                <ArrowUp className="w-3.5 h-3.5 text-red-500" strokeWidth={3} />
                <span className="text-[11px] font-bold text-red-500">0%</span>
                <span className="text-[11px] font-medium text-slate-400">from last 30 days</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Area Chart */}
            <div className="lg:col-span-2 bg-white rounded-[1.25rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <LineChartIcon className="w-5 h-5 text-indigo-500" strokeWidth={2.5} />
                  <h3 className="text-[14px] font-bold text-slate-900">Attendance Trend (Last 30 Days)</h3>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-600">Jul 27 - Aug 25, 2026</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </div>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reports?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString([], {day: 'numeric', month: 'short'})} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, fill: '#6366f1', stroke: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[11px] font-bold text-slate-500">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-[11px] font-bold text-slate-500">Late</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-[11px] font-bold text-slate-500">Absent</span>
                </div>
              </div>
            </div>

            {/* Distribution Pie */}
            <div className="bg-white rounded-[1.25rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-indigo-500" strokeWidth={2.5} />
                  <h3 className="text-[14px] font-bold text-slate-900">Distribution</h3>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors p-1"><MoreVertical className="w-4 h-4" /></button>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-500">Total</span>
                    <span className="text-2xl font-black text-slate-900">{reports?.students_count || 0}</span>
                    <span className="text-[10px] font-medium text-slate-400">Students</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {pieData.map((entry, index) => {
                    const bgColors = ['bg-emerald-50 border-emerald-100', 'bg-amber-50 border-amber-100', 'bg-red-50 border-red-100'];
                    const textColors = ['text-emerald-500', 'text-amber-500', 'text-red-500'];
                    const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
                    const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                    return (
                      <div key={entry.name} className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border ${bgColors[index]}`}>
                        <span className={`text-[16px] font-black ${textColors[index]} leading-none`}>{entry.value}</span>
                        <span className={`text-[9px] font-bold ${textColors[index]} uppercase tracking-wider mt-1.5`}>{entry.name}</span>
                        <span className={`text-[10px] font-medium ${textColors[index]} opacity-80 mt-1`}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Report Summary Section */}
          <div className="bg-white rounded-[1.25rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 mt-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-5 h-5 text-[#7a1315]" strokeWidth={2.5} />
              <div className="flex flex-col">
                <h2 className="text-[16px] font-bold text-slate-900 leading-tight">Report Summary</h2>
                <p className="text-[12px] font-medium text-slate-500">Export and download detailed reports for your records.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Daily Attendance */}
              <div className="p-4 rounded-[14px] border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <CalendarIcon className="w-5 h-5 text-indigo-500" strokeWidth={2} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Daily Attendance</span>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">View and export daily attendance records.</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
              </div>

              {/* Monthly Summary */}
              <div className="p-4 rounded-[14px] border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <CalendarIcon className="w-5 h-5 text-emerald-500" strokeWidth={2} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Monthly Summary</span>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">Get monthly attendance summary report.</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
              </div>

              {/* Late Records */}
              <div className="p-4 rounded-[14px] border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-500" strokeWidth={2} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Late Records</span>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">View students with late arrivals.</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors shrink-0" />
              </div>

              {/* Absence Records */}
              <div className="p-4 rounded-[14px] border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <UserX className="w-5 h-5 text-red-500" strokeWidth={2} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-slate-900 group-hover:text-red-600 transition-colors">Absence Records</span>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">View and export absence records.</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-500 transition-colors shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[600px] p-0 overflow-hidden bg-slate-50 rounded-2xl border-none shadow-2xl">
          <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Export Official Report</h2>
                <p className="text-[13px] text-slate-500 font-medium mt-0.5">Generate a DepEd formatted attendance summary.</p>
              </div>
            </div>
            <DialogClose className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </DialogClose>
          </div>
          
          <div className="p-8 grid grid-cols-2 gap-6">
            <button 
              onClick={handleDownloadPDF}
              className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Printer className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-1">DepEd Formatted PDF</h3>
              <p className="text-sm text-slate-500 font-medium">Standardized professional print layout for DepEd submission</p>
            </button>

            <button 
              onClick={() => alert("CSV Generation Not Implemented in this Mock")}
              className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group opacity-50 cursor-not-allowed"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-1">CSV / Excel</h3>
              <p className="text-sm text-slate-500 font-medium">Raw data format for spreadsheet analysis</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
