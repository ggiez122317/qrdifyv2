'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, AlertTriangle, Send, ChevronLeft, ChevronRight, MessageSquare, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { getImageUrl } from '@/lib/utils';
import { CustomSelect } from '@/components/ui/custom-select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AbsentStudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['teacher-absent-students'],
    queryFn: async () => {
      const res = await api.get('/api/teacher/absent-students');
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

  const handleOpenNotice = (student: any) => {
    setSelectedStudent(student);
    setNoticeMessage(`Notice of Absence: ${student.name}.\n\nYou have been marked absent for today's class. Please provide a valid excuse letter or medical certificate upon your return.\n\nThank you.`);
    setIsNoticeModalOpen(true);
  };

  const handleSendNotice = async () => {
    if (!noticeMessage.trim()) return;

    try {
      setIsSending(true);
      await api.post('/api/teacher/send-notice', {
        student_id: selectedStudent.id,
        title: 'Absence Notice',
        message: noticeMessage
      });
      localStorage.setItem('toast_message', 'Your absence notice has been sent to the student\'s parents via push notification.');
      setIsNoticeModalOpen(false);
      setNoticeMessage('');
    } catch (error) {
      localStorage.setItem('toast_message', 'Unable to send the notice at this time. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Absent Today</h1>
          <p className="text-slate-500">Track absent students and send real-time push notifications to their devices.</p>
        </div>

        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-red-50/30">
              <div className="relative flex-1 max-w-[600px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <Input 
                  placeholder="Search absent students..." 
                  className="pl-11 h-[46px] bg-white border-slate-200 rounded-xl text-[15px] focus:ring-1 focus:ring-red-300 w-full"
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
                    <th className="px-8 py-5 text-center">STATUS</th>
                    <th className="px-8 py-5 text-right">ACTION</th>
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
                        <div className="flex flex-col items-center justify-center text-emerald-400">
                          <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                          <h3 className="text-lg font-bold text-emerald-600">Great news!</h3>
                          <p className="text-emerald-500 font-medium">None of your assigned students are absent today.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents?.map((student: any) => {
                      const initials = student.name.split(' ').map((n:any)=>n[0]).join('').toUpperCase().substring(0,2);
                      
                      return (
                        <tr key={student.id} className="hover:bg-red-50/50 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[15px] bg-red-100 text-red-600">
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
                             <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border text-red-700 border-red-200 bg-red-50">
                                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                                Absent Today
                             </span>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <Button 
                              variant="outline" 
                              className="h-9 rounded-lg border-red-200 text-red-600 hover:text-white hover:bg-red-600 font-bold" 
                              onClick={() => handleOpenNotice(student)}
                            >
                              <MessageSquare className="w-[16px] h-[16px] mr-2" strokeWidth={2} />
                              Send Notice
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
                <Button className="w-9 h-9 p-0 rounded-lg bg-red-600 text-white font-bold">1</Button>
                <Button variant="outline" className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-400">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Send Notice Modal */}
        <Dialog open={isNoticeModalOpen} onOpenChange={setIsNoticeModalOpen}>
          <DialogContent showCloseButton={false} className="sm:max-w-[550px] p-0 overflow-hidden bg-slate-50 rounded-2xl border-none shadow-2xl">
            <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Push Notice</h2>
                  <p className="text-[13px] text-slate-500 font-medium mt-0.5">Send a real-time push notification directly to the student.</p>
                </div>
              </div>
              <DialogClose className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </DialogClose>
            </div>
            
            <div className="p-6 space-y-6">
              {selectedStudent && (
                <div className="flex items-center gap-3 p-3.5 bg-red-50 rounded-xl border border-red-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center font-bold text-sm shadow-sm border border-red-200">
                    {selectedStudent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">To: {selectedStudent.name}</p>
                    <p className="text-xs text-red-500 font-medium">{selectedStudent.student_profile?.grade} - {selectedStudent.student_profile?.section}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <Label htmlFor="message" className="text-sm font-extrabold text-slate-900">Message Content</Label>
                <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden focus-within:border-red-300 focus-within:ring-1 focus-within:ring-red-300 transition-all">
                  <Textarea 
                    id="message"
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
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-6 h-11 min-w-[140px]"
              >
                {isSending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Push Notice
                  </div>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
