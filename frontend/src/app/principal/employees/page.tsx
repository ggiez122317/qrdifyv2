'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Briefcase, Filter, Users, GraduationCap, Shield, ShieldCheck, Eye, ChevronLeft, ChevronRight, BookOpen, MessageSquare, Activity, FileText, X, Bold, Italic, Underline, List, ListOrdered, Link, Smile, Send, Contact, Download, Printer, FileSpreadsheet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CustomSelect } from '@/components/ui/custom-select';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';
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

export interface EmployeeRecord {
  id: number;
  name: string;
  email: string;
  id_number?: string;
  photo_url?: string;
  roles: { name: string }[];
}

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pds' | 'attendance'>('pds');
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
      doc.text("Official Employee Roster Report", 14, 32);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 42);
      doc.text(`Total Employees: ${filteredEmployees.length}`, 14, 48);

      // Prepare Table Data
      const tableColumn = ["Employee Name", "ID Number", "Role", "Email"];
      const tableRows = filteredEmployees.map((emp: EmployeeRecord) => [
        emp.name,
        emp.id_number || 'N/A',
        (emp.roles[0]?.name || 'N/A').toUpperCase(),
        emp.email
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

      doc.save(`SAS_Employees_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsReportModalOpen(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!employees || employees.length === 0) return;
    
    const headers = ['Employee Name', 'ID Number', 'Role', 'Email'];
    const csvRows = [headers.join(',')];
    
    filteredEmployees.forEach((emp: EmployeeRecord) => {
      const row = [
        `"${emp.name}"`,
        `"${emp.id_number || 'N/A'}"`,
        `"${emp.roles[0]?.name || 'N/A'}"`,
        `"${emp.email}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sas_employees_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsReportModalOpen(false);
  };

  const handleViewEmployee = (emp: EmployeeRecord) => {
    setSelectedEmployee(emp);
    setActiveTab('pds');
    setIsViewModalOpen(true);
  };

  const handleSendNotice = (emp: EmployeeRecord) => {
    setSelectedEmployee(emp);
    setNoticeMessage('');
    setIsNoticeModalOpen(true);
  };

  const handleSendNoticeSubmit = async () => {
    setIsSending(true);
    // Mock API call since this is UI-only for now
    setTimeout(() => {
      setIsSending(false);
      setIsNoticeModalOpen(false);
      localStorage.setItem('toast_message', `Notice sent successfully to ${selectedEmployee?.name}`);
    }, 1000);
  };

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['principal-employees'],
    queryFn: async () => {
      const res = await api.get('/api/principal/employees');
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const employees = employeesData?.data || [];
  const employeesTotal = employeesData?.total || 0;

  const filteredEmployees = employees.filter((emp: EmployeeRecord) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || emp.roles[0]?.name === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const teachersCount = employees.filter((e: EmployeeRecord) => e.roles[0]?.name === 'teacher').length || 0;
  const guardsCount = employees.filter((e: EmployeeRecord) => e.roles[0]?.name === 'guard').length || 0;
  const principalsCount = employees.filter((e: EmployeeRecord) => e.roles[0]?.name === 'principal').length || 0;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-[#F8FAFC] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight">Employees</h1>
          <p className="text-slate-500 text-[15px] font-medium mt-1">Manage and track teachers and staff.</p>
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
              <span className="text-[#64748b] text-[13px] font-bold">Total Employees</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{employeesTotal}</span>
              <span className="text-[#94a3b8] text-[13px] mt-1">All registered staff</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-red-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Teachers</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{teachersCount}</span>
              <span className="text-[#94a3b8] text-[13px] mt-1">Active teachers</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-blue-50 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Guards</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{guardsCount}</span>
              <span className="text-[#94a3b8] text-[13px] mt-1">Security staff</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-orange-50 flex items-center justify-center">
              <Shield className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Principals</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{principalsCount}</span>
              <span className="text-[#94a3b8] text-[13px] mt-1">School principals</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-purple-50 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-purple-500" />
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
                value={roleFilter}
                onChange={setRoleFilter}
                icon={<Filter className="w-4 h-4 text-slate-400" />}
                options={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'teacher', label: 'Teachers' },
                  { value: 'guard', label: 'Guards' },
                  { value: 'principal', label: 'Principals' }
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
                    <div className="flex items-center gap-1">EMPLOYEE <div className="flex flex-col"><ChevronLeft className="w-2.5 h-2.5 rotate-90" /><ChevronRight className="w-2.5 h-2.5 rotate-90 -mt-1" /></div></div>
                  </th>
                  <th className="px-8 py-5">
                    <div className="flex items-center gap-1">ID NUMBER <div className="flex flex-col"><ChevronLeft className="w-2.5 h-2.5 rotate-90" /><ChevronRight className="w-2.5 h-2.5 rotate-90 -mt-1" /></div></div>
                  </th>
                  <th className="px-8 py-5">
                    <div className="flex items-center gap-1">ROLE <div className="flex flex-col"><ChevronLeft className="w-2.5 h-2.5 rotate-90" /><ChevronRight className="w-2.5 h-2.5 rotate-90 -mt-1" /></div></div>
                  </th>
                  <th className="px-8 py-5">
                    <div className="flex items-center gap-1">EMAIL <div className="flex flex-col"><ChevronLeft className="w-2.5 h-2.5 rotate-90" /><ChevronRight className="w-2.5 h-2.5 rotate-90 -mt-1" /></div></div>
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
                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="h-4 w-40 bg-slate-200 rounded"></div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <div className="h-9 w-9 bg-slate-200 rounded-lg"></div>
                          <div className="h-9 w-9 bg-slate-200 rounded-lg"></div>
                          <div className="h-9 w-9 bg-slate-200 rounded-lg"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (!filteredEmployees || filteredEmployees.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No employees found</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto">There are currently no employees matching your search criteria or role filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees?.map((emp: EmployeeRecord) => {
                    const initials = emp.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                    const role = emp.roles[0]?.name;

                    let roleColor = 'text-slate-700 bg-slate-50 border-slate-200';
                    let avatarColor = 'bg-slate-100 text-slate-600';
                    let roleIcon = <Briefcase className="w-3.5 h-3.5 mr-1.5" />;
                    let subtitle = 'Staff Member';

                    if (role === 'teacher') {
                      roleColor = 'text-[#3b82f6] border-[#bfdbfe] bg-[#eff6ff]';
                      avatarColor = 'bg-[#ffe4e6] text-[#e11d48]'; // Based on image TM is pinkish red
                      roleIcon = <BookOpen className="w-3.5 h-3.5 mr-1.5" />;
                      subtitle = 'Mathematics Teacher'; // Hardcoded sample like the image
                    } else if (role === 'guard') {
                      roleColor = 'text-[#f97316] border-[#fed7aa] bg-[#fff7ed]';
                      avatarColor = 'bg-[#ffedd5] text-[#ea580c]'; // Based on image GB is orange
                      roleIcon = <Shield className="w-3.5 h-3.5 mr-1.5" />;
                      subtitle = 'School Guard';
                    } else if (role === 'principal') {
                      roleColor = 'text-[#a855f7] border-[#e9d5ff] bg-[#faf5ff]';
                      avatarColor = 'bg-[#f3e8ff] text-[#9333ea]'; // Based on image PJ is purple
                      roleIcon = <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />;
                      subtitle = 'School Principal';
                    }

                    // Special case to match image for CD
                    if (emp.name.toLowerCase().includes('chloe')) {
                      avatarColor = 'bg-[#e0f2fe] text-[#0284c7]';
                      subtitle = 'Science Teacher';
                    }

                    return (
                      <tr key={emp.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-[15px] ${avatarColor}`}>
                                {emp.photo_url ? (
                                  <Image src={getImageUrl(emp.photo_url) || ''} alt={emp.name} width={44} height={44} className="w-full h-full rounded-full object-cover" unoptimized={true} />
                                ) : initials}
                              </div>
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[#0f172a] text-[15px]">{emp.name}</span>
                              <span className="text-[#64748b] text-[13px]">{subtitle}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-[#475569] text-[14.5px]">{emp.id_number || 'N/A'}</td>
                        <td className="px-8 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${roleColor}`}>
                            {roleIcon}
                            {role || 'N/A'}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-[#475569] text-[14.5px]">{emp.email}</td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" className="w-9 h-9 rounded-lg p-0 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50" onClick={() => handleViewEmployee(emp)}>
                              <Eye className="w-[18px] h-[18px]" strokeWidth={2} />
                            </Button>
                            <Button variant="outline" className="w-9 h-9 rounded-lg p-0 border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleSendNotice(emp)}>
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
              Showing 1 to {filteredEmployees?.length || 0} of {employeesTotal} results
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

      {/* View Employee Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[700px] p-0 overflow-hidden bg-white rounded-2xl border-none shadow-2xl">
          {selectedEmployee && (
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
                    {selectedEmployee.photo_url ? (
                      <Image src={getImageUrl(selectedEmployee.photo_url) || ''} alt="Profile" width={80} height={80} className="w-full h-full object-cover" unoptimized={true} />
                    ) : (
                      <span className="text-2xl font-extrabold text-slate-300">
                        {selectedEmployee.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-[22px] font-extrabold text-white leading-tight">{selectedEmployee.name}</h2>
                    <p className="text-white/80 font-medium text-[13px] mt-1 flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span className="capitalize">{selectedEmployee.roles?.[0]?.name || 'Staff'}</span>
                      <span className="w-1 h-1 rounded-full bg-white/40 mx-1"></span>
                      ID: {selectedEmployee.id_number || 'N/A'}
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
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                        <div>
                          <p className="text-[13px] text-slate-500 font-medium mb-1">Email Address</p>
                          <p className="font-bold text-[#0f172a] text-[15px]">{selectedEmployee.email}</p>
                        </div>
                        <div>
                          <p className="text-[13px] text-slate-500 font-medium mb-1">Phone Number</p>
                          <p className="font-bold text-[#0f172a] text-[15px]">+63 917 123 4567</p>
                        </div>
                      </div>
                    </div>
                    <div className="h-px w-full bg-slate-100"></div>
                    <div>
                      <h3 className="text-[12px] font-extrabold text-[#a81616] uppercase tracking-wider mb-5 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Employment Details
                      </h3>
                      <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                        <div>
                          <p className="text-[13px] text-slate-500 font-medium mb-1">Date Hired</p>
                          <p className="font-bold text-[#0f172a] text-[15px]">August 12, 2021</p>
                        </div>
                        <div>
                          <p className="text-[13px] text-slate-500 font-medium mb-1.5">Status</p>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] mr-1.5"></span>
                            Active Regular
                          </span>
                        </div>
                        <div>
                          <p className="text-[13px] text-slate-500 font-medium mb-1">Department</p>
                          <p className="font-bold text-[#0f172a] text-[15px]">
                            {selectedEmployee.roles?.[0]?.name === 'teacher' ? 'Academics' : 'Administration'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[13px] text-slate-500 font-medium mb-1">Schedule</p>
                          <p className="font-bold text-[#0f172a] text-[15px]">7:30 AM - 4:30 PM</p>
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
                        <span className="block text-2xl font-extrabold text-slate-800">95%</span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Attendance Rate</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <span className="block text-2xl font-extrabold text-slate-800">10</span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Absences</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <span className="block text-2xl font-extrabold text-slate-800">5</span>
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
                <p className="text-[13px] text-slate-500 font-medium mt-0.5">Send a direct message or summons to this employee.</p>
              </div>
            </div>
            <DialogClose className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </DialogClose>
          </div>
          
          <div className="p-6 space-y-6">
            {selectedEmployee && (
              <div className="flex items-center gap-3 p-3.5 bg-[#f8eaf0] rounded-xl border border-[#f5dce6] shadow-sm">
                <div className="w-10 h-10 rounded-full bg-white text-[#9333ea] flex items-center justify-center font-bold text-sm shadow-sm border border-purple-100">
                  {selectedEmployee.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">To: {selectedEmployee.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{selectedEmployee.roles?.[0]?.name}</p>
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
              onClick={handleSendNoticeSubmit} 
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
                <p className="text-[13px] text-slate-500 font-medium mt-0.5">Download a detailed roster of all filtered employees.</p>
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
