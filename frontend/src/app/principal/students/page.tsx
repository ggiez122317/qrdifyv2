'use client';

import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Search, AlertTriangle, Send, Filter, Plus, Users, ChevronLeft, ChevronRight, GraduationCap, Eye, Pencil, Trash2, Activity, MessageSquare, X, Bold, Italic, Underline, List, ListOrdered, Link, Smile, Contact, Briefcase, FileText, Download, Printer, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getImageUrl } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomSelect } from '@/components/ui/custom-select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const mockAttendanceData = [
  { name: 'Jan', present: 20, absent: 2, late: 1 },
  { name: 'Feb', present: 18, absent: 1, late: 0 },
  { name: 'Mar', present: 22, absent: 0, late: 2 },
  { name: 'Apr', present: 19, absent: 2, late: 1 },
  { name: 'May', present: 21, absent: 0, late: 0 },
  { name: 'Jun', present: 15, absent: 5, late: 1 },
  { name: 'Jul', present: 18, absent: 0, late: 2 }
];

export default function StudentsAtRiskPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pds' | 'attendance'>('pds');
  
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Document Header
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("School Attendance System", 14, 22);
      
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105); // slate-500
      doc.text("Students At Risk - Official Report", 14, 32);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 42);
      doc.text(`Total Students: ${filteredStudents.length}`, 14, 48);

      // Prepare Table Data
      const tableColumn = ["Student Name", "Grade & Section", "Adviser", "Absences", "Risk Level"];
      const tableRows = filteredStudents.map((std: any) => [
        std.name,
        `${std.grade || 'N/A'} - ${std.section || 'N/A'}`,
        std.teacher || 'Unassigned',
        (std.absences || 0).toString(),
        std.risk_level.toUpperCase()
      ]);

      // Generate Table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 55,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [168, 22, 22], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`SAS_Students_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsReportModalOpen(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!students || students.length === 0) return;
    
    const headers = ['Student Name', 'ID Number', 'Grade', 'Section', 'Adviser', 'Risk Level', 'Absences'];
    const csvRows = [headers.join(',')];
    
    filteredStudents.forEach((std: any) => {
      const row = [
        `"${std.name}"`,
        `"${std.id_number || 'N/A'}"`,
        `"${std.grade || 'N/A'}"`,
        `"${std.section || 'N/A'}"`,
        `"${std.teacher || 'Unassigned'}"`,
        `"${std.risk_level}"`,
        `"${std.absences || 0}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sas_students_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsReportModalOpen(false);
  };

  const { data: studentsData, isLoading, refetch } = useQuery({
    queryKey: ['principal-students-risk'],
    queryFn: async () => {
      const res = await api.get('/api/principal/students-at-risk');
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const students = studentsData?.data || [];
  const studentsTotal = studentsData?.total || 0;

  const filteredStudents = students.filter((std: any) => {
    const matchesSearch = std.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (std.id_number && std.id_number.includes(searchTerm));
    
    const matchesRisk = riskFilter === 'all' || std.risk_level.toLowerCase() === riskFilter;

    return matchesSearch && matchesRisk;
  });

  const highRiskCount = students.filter((s:any) => s.risk_level === 'High').length || 0;
  const mediumRiskCount = students.filter((s:any) => s.risk_level === 'Medium').length || 0;
  const lowRiskCount = students.filter((s:any) => s.risk_level === 'Low').length || 0;

  const handleOpenNotice = (student: any) => {
    setSelectedStudent(student);
    setNoticeMessage(`Notice regarding attendance for ${student.name}.\n\nPlease schedule a brief meeting to discuss their recent attendance performance.\n\nThank you.`);
    setIsNoticeModalOpen(true);
  };

  const handleSendNotice = async () => {
    if (!noticeMessage.trim()) {
      alert("Please enter a message.");
      return;
    }

    try {
      setIsSending(true);
      await api.post('/api/principal/notices', {
        teacher_id: selectedStudent.teacher_id,
        student_id: selectedStudent.id,
        message: noticeMessage
      });
      localStorage.setItem('toast_message', 'Notice sent successfully');
      setIsNoticeModalOpen(false);
      setNoticeMessage('');
    } catch (error) {
      localStorage.setItem('toast_message', 'Failed to send notice');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-[#F8FAFC] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight">Students</h1>
          <p className="text-slate-500 text-[15px] font-medium mt-1">Monitor students and track attendance performance.</p>
        </div>
        <Button onClick={() => setIsReportModalOpen(true)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold h-11 px-6 rounded-lg shadow-sm">
          <Download className="w-5 h-5 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Total Students</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{studentsTotal}</span>
              <span className="text-[#94a3b8] text-[13px] mt-1">All monitored students</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">High Risk</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{highRiskCount}</span>
              <span className="text-[#94a3b8] text-[13px] mt-1">Requires immediate attention</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Medium Risk</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{mediumRiskCount}</span>
              <span className="text-[#94a3b8] text-[13px] mt-1">Monitor closely</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-orange-50 flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Low Risk</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{lowRiskCount}</span>
              <span className="text-[#94a3b8] text-[13px] mt-1">Good attendance</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-emerald-50 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-[600px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
              <Input 
                placeholder="Search by name or ID number..." 
                className="pl-11 h-[46px] bg-white border-slate-200 rounded-xl text-[15px] focus:ring-1 focus:ring-slate-300 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <CustomSelect
                value={riskFilter}
                onChange={setRiskFilter}
                icon={<Filter className="w-4 h-4 text-slate-400" />}
                options={[
                  { value: 'all', label: 'All Risk Levels' },
                  { value: 'High', label: 'High Risk' },
                  { value: 'Medium', label: 'Medium Risk' },
                  { value: 'Low', label: 'Low Risk' }
                ]}
              />
              <Button variant="outline" className="h-[46px] w-[46px] rounded-xl border-slate-200 p-0 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[11px] text-[#94a3b8] uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">
                    <div className="flex items-center gap-1">STUDENT <div className="flex flex-col"><ChevronLeft className="w-2.5 h-2.5 rotate-90"/><ChevronRight className="w-2.5 h-2.5 rotate-90 -mt-1"/></div></div>
                  </th>
                  <th className="px-8 py-5">
                    <div className="flex items-center gap-1">SECTION / ADVISER <div className="flex flex-col"><ChevronLeft className="w-2.5 h-2.5 rotate-90"/><ChevronRight className="w-2.5 h-2.5 rotate-90 -mt-1"/></div></div>
                  </th>
                  <th className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-1">ABSENCES <div className="flex flex-col"><ChevronLeft className="w-2.5 h-2.5 rotate-90"/><ChevronRight className="w-2.5 h-2.5 rotate-90 -mt-1"/></div></div>
                  </th>
                  <th className="px-8 py-5">
                    <div className="flex items-center gap-1">RISK LEVEL <div className="flex flex-col"><ChevronLeft className="w-2.5 h-2.5 rotate-90"/><ChevronRight className="w-2.5 h-2.5 rotate-90 -mt-1"/></div></div>
                  </th>
                  <th className="px-8 py-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-50">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full bg-slate-200"></div>
                          <div className="flex flex-col gap-2">
                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                            <div className="h-3 w-20 bg-slate-100 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="h-4 w-24 bg-slate-200 rounded"></div>
                          <div className="h-3 w-32 bg-slate-100 rounded"></div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="h-6 w-8 bg-slate-200 rounded mx-auto"></div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <div className="h-9 w-20 bg-slate-200 rounded-lg"></div>
                          <div className="h-9 w-9 bg-slate-200 rounded-lg"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (!filteredStudents || filteredStudents.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <GraduationCap className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No students found</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto">There are currently no students matching your search criteria or risk filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents?.map((student: any) => {
                    const initials = student.name.split(' ').map((n:any)=>n[0]).join('').toUpperCase().substring(0,2);
                    
                    let riskColor = 'text-emerald-700 border-emerald-200 bg-emerald-50';
                    let avatarColor = 'bg-emerald-50 text-emerald-600';

                    if (student.risk_level === 'High') {
                      riskColor = 'text-red-700 border-red-200 bg-red-50';
                      avatarColor = 'bg-[#ffe4e6] text-[#e11d48]'; 
                    } else if (student.risk_level === 'Medium') {
                      riskColor = 'text-orange-700 border-orange-200 bg-orange-50';
                      avatarColor = 'bg-[#ffedd5] text-[#ea580c]'; 
                    }

                    return (
                      <tr key={student.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-[15px] ${avatarColor}`}>
                                {student.photo_url ? (
                                  <img src={getImageUrl(student.photo_url)} alt={student.name} className="w-full h-full rounded-full object-cover" />
                                ) : initials}
                              </div>
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[#0f172a] text-[15px]">{student.name}</span>
                              <span className="text-[#64748b] text-[13px]">{student.id_number || 'No ID Number'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex flex-col">
                            <span className="text-[#475569] font-bold text-[14.5px]">{student.grade} - {student.section}</span>
                            <span className="text-[#64748b] text-[13px]">Adviser: {student.teacher}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className="text-[17px] font-extrabold text-[#0f172a]">{student.absences}</span>
                        </td>
                        <td className="px-8 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${riskColor}`}>
                            {student.risk_level === 'High' && <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />}
                            {student.risk_level === 'Medium' && <Activity className="w-3.5 h-3.5 mr-1.5" />}
                            {student.risk_level === 'Low' && <GraduationCap className="w-3.5 h-3.5 mr-1.5" />}
                            {student.risk_level} Risk
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" className="w-9 h-9 rounded-lg p-0 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50" onClick={() => { setSelectedStudent(student); setIsViewModalOpen(true); }}>
                              <Eye className="w-[18px] h-[18px]" strokeWidth={2} />
                            </Button>
                            <Button variant="outline" className="w-9 h-9 rounded-lg p-0 border-slate-200 text-slate-500 hover:text-[#a81616] hover:bg-red-50" onClick={() => handleOpenNotice(student)}>
                              <MessageSquare className="w-[18px] h-[18px]" strokeWidth={2} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-white">
            <span className="text-[14px] text-slate-500 font-medium">
              Showing 1 to {filteredStudents?.length || 0} of {studentsTotal} results
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-400">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button className="w-9 h-9 p-0 rounded-lg bg-[#a81616] hover:bg-[#8b1111] text-white font-bold">1</Button>
              <Button variant="outline" className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-600 font-bold hover:bg-slate-50">2</Button>
              <Button variant="outline" className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-600 font-bold hover:bg-slate-50">3</Button>
              <Button variant="outline" className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-400">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Student Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[700px] p-0 overflow-hidden bg-white rounded-2xl border-none shadow-2xl">
          {selectedStudent && (
            <>
              {/* Header Profile Section */}
              <div className="bg-gradient-to-br from-[#4a0d0d] to-[#7f1d1d] px-8 py-8 relative overflow-hidden">
                <DialogClose className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white/80 hover:text-white transition-colors z-50 focus:outline-none">
                  <X className="w-4 h-4" />
                  <span className="sr-only">Close</span>
                </DialogClose>
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full border-[3px] border-white/10 bg-white flex items-center justify-center overflow-hidden shadow-lg">
                    {selectedStudent.photo_url ? (
                      <img src={getImageUrl(selectedStudent.photo_url)} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-extrabold text-slate-300">
                        {selectedStudent.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-[22px] font-extrabold text-white leading-tight">{selectedStudent.name}</h2>
                    <p className="text-white/80 font-medium text-[13px] mt-1 flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span className="capitalize">Student</span>
                      <span className="w-1 h-1 rounded-full bg-white/40 mx-1"></span>
                      ID: {selectedStudent.id_number || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs System */}
              <div className="px-8 bg-white border-b border-slate-100">
                <div className="flex items-center gap-8">
                  <button
                    onClick={() => setActiveTab('pds')}
                    className={`py-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pds' ? 'border-[#a81616] text-[#a81616]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    <FileText className="w-4 h-4" />
                    Personal Data Sheet (PDS)
                  </button>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className={`py-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'attendance' ? 'border-[#a81616] text-[#a81616]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    <Activity className="w-4 h-4" />
                    Attendance Record
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-8 max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {activeTab === 'pds' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h3 className="text-[12px] font-extrabold text-[#a81616] uppercase tracking-wider mb-5 flex items-center gap-2">
                        <Contact className="w-4 h-4" />
                        Parent/Guardian Information
                      </h3>
                      <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                        <div>
                          <p className="text-[13px] text-slate-500 font-medium mb-1">Email Address</p>
                          <p className="font-bold text-[#0f172a] text-[15px]">parent@example.com</p>
                        </div>
                        <div>
                          <p className="text-[13px] text-slate-500 font-medium mb-1">Phone Number</p>
                          <p className="font-bold text-[#0f172a] text-[15px]">+63 917 987 6543</p>
                        </div>
                      </div>
                    </div>
                    <div className="h-px w-full bg-slate-100"></div>
                    <div>
                      <h3 className="text-[12px] font-extrabold text-[#a81616] uppercase tracking-wider mb-5 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Enrollment Details
                      </h3>
                      <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                        <div>
                          <p className="text-[13px] text-slate-500 font-medium mb-1">Grade Level</p>
                          <p className="font-bold text-[#0f172a] text-[15px]">{selectedStudent.grade || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[13px] text-slate-500 font-medium mb-1">Section</p>
                          <p className="font-bold text-[#0f172a] text-[15px]">{selectedStudent.section || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[13px] text-slate-500 font-medium mb-1.5">Status</p>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] mr-1.5"></span>
                            Active Regular
                          </span>
                        </div>
                        <div>
                          <p className="text-[13px] text-slate-500 font-medium mb-1">Adviser</p>
                          <p className="font-bold text-[#0f172a] text-[15px]">{selectedStudent.teacher || 'Unassigned'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[15px] font-bold text-slate-900">Attendance Statistics ({new Date().getFullYear()})</h3>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span><span className="text-xs font-medium text-slate-600">Present</span></div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400"></span><span className="text-xs font-medium text-slate-600">Absent</span></div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span><span className="text-xs font-medium text-slate-600">Late</span></div>
                      </div>
                    </div>
                    
                    <div className="h-[280px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <RechartsTooltip 
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Bar dataKey="present" name="Present" fill="#34d399" radius={[4, 4, 0, 0]} barSize={12} />
                          <Bar dataKey="absent" name="Absent" fill="#f87171" radius={[4, 4, 0, 0]} barSize={12} />
                          <Bar dataKey="late" name="Late" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={12} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <span className="block text-2xl font-extrabold text-slate-800">85%</span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Attendance Rate</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <span className="block text-2xl font-extrabold text-slate-800">{selectedStudent.absences || 0}</span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Absences</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <span className="block text-2xl font-extrabold text-slate-800">4</span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Lates</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Notice Modal */}
      <Dialog open={isNoticeModalOpen} onOpenChange={setIsNoticeModalOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[550px] p-0 overflow-hidden bg-slate-50 rounded-2xl border-none shadow-2xl">
          <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#a81616]" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Send Notice</h2>
                <p className="text-[13px] text-slate-500 font-medium mt-0.5">Send a direct message or summons regarding this student.</p>
              </div>
            </div>
            <DialogClose className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </DialogClose>
          </div>
          
          <div className="p-6 space-y-6">
            {selectedStudent && (
              <div className="flex items-center gap-3 p-3.5 bg-[#f8eaf0] rounded-xl border border-[#f5dce6] shadow-sm">
                <div className="w-10 h-10 rounded-full bg-white text-[#9333ea] flex items-center justify-center font-bold text-sm shadow-sm border border-purple-100">
                  {selectedStudent.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    To: {selectedStudent.teacher ? `${selectedStudent.teacher} & ${selectedStudent.name}` : selectedStudent.name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {selectedStudent.teacher ? `Adviser and Student` : `Student (No Adviser Assigned)`}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="message" className="text-sm font-extrabold text-slate-900">Message Content</Label>
              <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-300 transition-all">
                {/* WYSIWYG Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50">
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"><Bold className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"><Italic className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"><Underline className="w-4 h-4" /></Button>
                  <div className="w-px h-4 bg-slate-200 mx-1"></div>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"><List className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"><ListOrdered className="w-4 h-4" /></Button>
                  <div className="w-px h-4 bg-slate-200 mx-1"></div>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"><Link className="w-4 h-4" /></Button>
                  <div className="flex-1"></div>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"><Smile className="w-4 h-4" /></Button>
                </div>
                <Textarea 
                  id="message"
                  placeholder="E.g., Please come to the Principal's office for a brief talk regarding your recent attendance..."
                  className="min-h-[140px] resize-none border-0 rounded-none focus-visible:ring-0 text-sm p-4 text-slate-700 bg-transparent"
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                />
                <div className="px-4 py-2 text-right text-xs text-slate-400 font-medium bg-white">
                  {noticeMessage.length}/500
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-5 bg-white border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
            <Button variant="outline" onClick={() => setIsNoticeModalOpen(false)} className="font-bold text-slate-600 hover:text-slate-900 border-slate-200 rounded-xl px-5 h-11">
              Cancel
            </Button>
            <Button 
              onClick={handleSendNotice} 
              disabled={isSending || !noticeMessage.trim()}
              className="bg-[#a81616] hover:bg-[#8b1111] text-white font-bold rounded-xl px-6 h-11 min-w-[140px]"
            >
              {isSending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Notice
                </div>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[600px] p-0 overflow-hidden bg-slate-50 rounded-2xl border-none shadow-2xl">
          <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Export Report</h2>
                <p className="text-[13px] text-slate-500 font-medium mt-0.5">Download a detailed list of all filtered students.</p>
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
              <h3 className="font-extrabold text-slate-900 text-lg mb-1">PDF Document</h3>
              <p className="text-sm text-slate-500 font-medium">Standardized professional print layout</p>
            </button>

            <button 
              onClick={handleDownloadCSV}
              className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-1">CSV / Excel</h3>
              <p className="text-sm text-slate-500 font-medium">Raw data format for spreadsheet analysis</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Printable template removed as jspdf-autotable handles it natively */}
    </div>
  );
}
