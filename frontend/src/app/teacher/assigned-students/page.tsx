'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Users, ChevronLeft, ChevronRight, GraduationCap, Eye, Activity, Contact, Briefcase, FileText, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { getImageUrl } from '@/lib/utils';
import { CustomSelect } from '@/components/ui/custom-select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';

const mockAttendanceData = [
  { name: 'Jan', present: 20, absent: 2, late: 1 },
  { name: 'Feb', present: 18, absent: 1, late: 0 },
  { name: 'Mar', present: 22, absent: 0, late: 2 },
  { name: 'Apr', present: 19, absent: 2, late: 1 },
  { name: 'May', present: 21, absent: 0, late: 0 },
  { name: 'Jun', present: 15, absent: 5, late: 1 },
  { name: 'Jul', present: 18, absent: 0, late: 2 }
];

export default function AssignedStudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pds' | 'attendance'>('pds');

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['teacher-assigned-students'],
    queryFn: async () => {
      const res = await api.get('/api/teacher/assigned-students');
      return res.data;
    },
  });

  const students = studentsData?.data || [];
  const studentsTotal = studentsData?.total || 0;

  const filteredStudents = students.filter((std: any) => {
    const matchesSearch = std.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (std.id_number && std.id_number.includes(searchTerm));
    
    const matchesGrade = gradeFilter === 'all' || std.student_profile?.grade === gradeFilter;

    return matchesSearch && matchesGrade;
  });

  const { data: attendanceStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['teacher-student-attendance', selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent?.id) return [];
      const res = await api.get(`/api/teacher/assigned-students/${selectedStudent.id}/attendance`);
      return res.data;
    },
    enabled: !!selectedStudent?.id && activeTab === 'attendance',
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assigned Students</h1>
          <p className="text-slate-500">View and track PDS and attendance records for your assigned students.</p>
        </div>

        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
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
                  value={gradeFilter}
                  onChange={setGradeFilter}
                  icon={<Filter className="w-4 h-4 text-slate-400" />}
                  options={[
                    { value: 'all', label: 'All Grades' },
                    { value: 'Grade 7', label: 'Grade 7' },
                    { value: 'Grade 8', label: 'Grade 8' },
                    { value: 'Grade 9', label: 'Grade 9' },
                    { value: 'Grade 10', label: 'Grade 10' },
                  ]}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[11px] text-[#94a3b8] uppercase font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">STUDENT</th>
                    <th className="px-8 py-5">SECTION</th>
                    <th className="px-8 py-5 text-center">ABSENCES</th>
                    <th className="px-8 py-5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse border-b border-slate-50">
                        <td className="px-8 py-4"><div className="h-11 bg-slate-200 rounded"></div></td>
                        <td className="px-8 py-4"><div className="h-6 w-24 bg-slate-200 rounded"></div></td>
                        <td className="px-8 py-4"><div className="h-6 w-8 bg-slate-200 rounded mx-auto"></div></td>
                        <td className="px-8 py-4 text-right"><div className="h-9 w-9 bg-slate-200 rounded-lg ml-auto"></div></td>
                      </tr>
                    ))
                  ) : (!filteredStudents || filteredStudents.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Users className="w-12 h-12 mb-4 opacity-20" />
                          <h3 className="text-lg font-bold text-slate-700">No students found</h3>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents?.map((student: any) => {
                      const initials = student.name.split(' ').map((n:any)=>n[0]).join('').toUpperCase().substring(0,2);
                      
                      return (
                        <tr key={student.id} className="hover:bg-[#f8fafc] transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[15px] bg-slate-100 text-slate-600">
                                  {student.photo_url ? (
                                    <img src={getImageUrl(student.photo_url)} alt={student.name} className="w-full h-full rounded-full object-cover" />
                                  ) : initials}
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-[#0f172a] text-[15px]">{student.name}</span>
                                <span className="text-[#64748b] text-[13px]">{student.id_number || 'No ID Number'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <span className="text-[#475569] font-bold text-[14.5px]">
                              {student.student_profile?.grade} - {student.student_profile?.section}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-center">
                            <span className="text-[17px] font-extrabold text-[#0f172a]">{student.total_absences || 0}</span>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <Button variant="outline" className="w-9 h-9 rounded-lg p-0 border-slate-200 text-slate-500 hover:text-maroon-700 hover:bg-maroon-50" onClick={() => { setSelectedStudent(student); setIsViewModalOpen(true); }}>
                              <Eye className="w-[18px] h-[18px]" strokeWidth={2} />
                            </Button>
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
                <Button className="w-9 h-9 p-0 rounded-lg bg-slate-800 text-white font-bold">1</Button>
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
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-8 py-8 relative overflow-hidden">
                  <DialogClose className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white/80 hover:text-white transition-colors z-50 focus:outline-none">
                    <X className="w-4 h-4" />
                  </DialogClose>
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
                        Student
                        <span className="w-1 h-1 rounded-full bg-white/40 mx-1"></span>
                        ID: {selectedStudent.id_number || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-8 bg-white border-b border-slate-100">
                  <div className="flex items-center gap-8">
                    <button
                      onClick={() => setActiveTab('pds')}
                      className={`py-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pds' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      <FileText className="w-4 h-4" />
                      Personal Data Sheet (PDS)
                    </button>
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className={`py-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'attendance' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      <Activity className="w-4 h-4" />
                      Attendance Record
                    </button>
                  </div>
                </div>

                <div className="p-8 max-h-[600px] overflow-y-auto">
                  {activeTab === 'pds' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <h3 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Enrollment Details
                        </h3>
                        <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                          <div>
                            <p className="text-[13px] text-slate-500 font-medium mb-1">Grade Level</p>
                            <p className="font-bold text-[#0f172a] text-[15px]">{selectedStudent.student_profile?.grade || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[13px] text-slate-500 font-medium mb-1">Section</p>
                            <p className="font-bold text-[#0f172a] text-[15px]">{selectedStudent.student_profile?.section || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="h-[280px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          {isLoadingStats ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                            </div>
                          ) : (
                            <BarChart data={attendanceStats || mockAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <RechartsTooltip />
                            <Bar dataKey="present" name="Present" fill="#34d399" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="absent" name="Absent" fill="#f87171" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="late" name="Late" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={12} />
                          </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
