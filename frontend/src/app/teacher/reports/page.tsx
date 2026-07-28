'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Printer, FileSpreadsheet, BarChart3, LineChart as LineChartIcon, X, Calendar as CalendarIcon, PieChart as PieChartIcon, Users } from 'lucide-react';
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
            <p className="text-slate-500">View aggregate attendance data and generate official reports.</p>
          </div>
          <Button onClick={() => setIsReportModalOpen(true)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold h-11 px-6 rounded-lg shadow-sm">
            <Download className="w-5 h-5 mr-2" />
            Generate Report
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Users className="w-16 h-16" />
            </div>
            <CardContent className="p-6">
              <span className="text-slate-500 text-sm font-bold tracking-wider uppercase">Total Students</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">{reports?.students_count || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-emerald-50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600 group-hover:scale-110 transition-transform">
               <BarChart3 className="w-16 h-16" />
            </div>
            <CardContent className="p-6">
              <span className="text-emerald-700 text-sm font-bold tracking-wider uppercase">Total Presents</span>
              <div className="text-3xl font-extrabold text-emerald-900 mt-2">{reports?.overview?.present || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-amber-50 overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600 group-hover:scale-110 transition-transform">
               <BarChart3 className="w-16 h-16" />
            </div>
            <CardContent className="p-6">
              <span className="text-amber-700 text-sm font-bold tracking-wider uppercase">Total Lates</span>
              <div className="text-3xl font-extrabold text-amber-900 mt-2">{reports?.overview?.late || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-red-50 overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-red-600 group-hover:scale-110 transition-transform">
               <BarChart3 className="w-16 h-16" />
            </div>
            <CardContent className="p-6">
              <span className="text-red-700 text-sm font-bold tracking-wider uppercase">Total Absences</span>
              <div className="text-3xl font-extrabold text-red-900 mt-2">{reports?.overview?.absent || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <LineChartIcon className="w-5 h-5 text-indigo-500" />
                  Attendance Trend (Last 30 Days)
                </CardTitle>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <CalendarIcon className="w-4 h-4" />
                  {new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="h-[300px] bg-slate-50 animate-pulse rounded-xl" />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reports?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} 
                        tickFormatter={(val) => new Date(val).toLocaleDateString([], {day: 'numeric', month: 'short'})} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <PieChartIcon className="w-5 h-5 text-emerald-500" />
                Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              {isLoading ? (
                <div className="w-[200px] h-[200px] bg-slate-50 animate-pulse rounded-full my-4" />
              ) : (
                <>
                  <div className="h-[200px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4 w-full">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }}></span>
                          <span className="text-xs font-bold text-slate-500 uppercase">{entry.name}</span>
                        </div>
                        <span className="text-lg font-extrabold text-slate-800 mt-1">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
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
