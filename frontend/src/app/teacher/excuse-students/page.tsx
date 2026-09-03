'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Eye, FileText, Calendar, Paperclip, Search, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/custom-select';
import { getImageUrl } from '@/lib/utils';

interface ExcuseLetter {
  id: number;
  title: string;
  reason: string;
  status: string;
  absent_date: string;
  created_at: string;
  attachment_path?: string;
  student?: {
    name: string;
    photo_url?: string;
    studentProfile?: {
      grade?: string;
      section?: string;
    };
  };
}

export default function TeacherExcuseStudents() {
  const queryClient = useQueryClient();
  const [selectedLetter, setSelectedLetter] = useState<ExcuseLetter | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: letters = [], isLoading } = useQuery({
    queryKey: ['teacher-excuse-letters'],
    queryFn: async () => {
      const res = await api.get('/api/teacher/excuse-letters');
      return res.data.data ?? res.data ?? [];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.post(`/api/teacher/excuse-letters/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-excuse-letters'] });
      setSelectedLetter((prev: ExcuseLetter | null) => prev ? ({ ...prev, status: 'approved' }) : null);
      localStorage.setItem('toast_message', 'Excuse letter has been approved. The student is now marked as excused for that date.');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.post(`/api/teacher/excuse-letters/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-excuse-letters'] });
      setSelectedLetter((prev: ExcuseLetter | null) => prev ? ({ ...prev, status: 'rejected' }) : null);
      localStorage.setItem('toast_message', 'Excuse letter has been reviewed and marked as rejected.');
    }
  });

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
    if (status === 'rejected') return <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-600 text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
    return <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 text-xs font-bold w-max"><Clock className="w-3.5 h-3.5" /> Pending</span>;
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const filteredLetters = letters.filter((letter: ExcuseLetter) => {
    const matchesSearch = letter.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          letter.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || letter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Excuse Letters</h1>
          <p className="text-slate-500">Review and manage excuse letters from your assigned students.</p>
        </div>

        <div className="bg-white dark:bg-[#161920] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-0">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-red-50/30">
              <div className="relative flex-1 max-w-[600px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <Input 
                  placeholder="Search excuse letters by student name or title..." 
                  className="pl-11 h-[46px] bg-white border-slate-200 rounded-xl text-[15px] focus:ring-1 focus:ring-red-300 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <CustomSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  icon={<Filter className="w-4 h-4 text-slate-400" />}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                  ]}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[11px] text-[#94a3b8] uppercase font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">STUDENT</th>
                    <th className="px-8 py-5">TITLE</th>
                    <th className="px-8 py-5">DATE OF ABSENCE</th>
                    <th className="px-8 py-5 text-center">STATUS</th>
                    <th className="px-8 py-5 text-right">ACTION</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse border-b border-slate-50">
                        <td className="px-8 py-4"><div className="h-11 bg-slate-200 rounded"></div></td>
                        <td className="px-8 py-4"><div className="h-6 w-32 bg-slate-200 rounded"></div></td>
                        <td className="px-8 py-4"><div className="h-6 w-24 bg-slate-200 rounded"></div></td>
                        <td className="px-8 py-4 text-center"><div className="h-6 w-16 bg-slate-200 rounded mx-auto"></div></td>
                        <td className="px-8 py-4 text-right"><div className="h-9 w-24 bg-slate-200 rounded-lg ml-auto"></div></td>
                      </tr>
                    ))
                  ) : (!filteredLetters || filteredLetters.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <FileText className="w-12 h-12 mb-4 opacity-20" />
                          <h3 className="text-lg font-bold text-slate-600">No excuse letters</h3>
                          <p className="text-slate-500 font-medium">No letters match your current search and filter.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLetters.map((letter: ExcuseLetter) => (
                      <tr key={letter.id} className="hover:bg-red-50/50 transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[15px] shrink-0 overflow-hidden">
                                {letter.student?.photo_url ? (
                                  <img src={getImageUrl(letter.student.photo_url)} alt={letter.student?.name} className="w-full h-full object-cover" />
                                ) : (
                                              getInitials(letter.student?.name || 'Unknown')
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[#0f172a] text-[15px]">{letter.student?.name}</span>
                              <span className="text-[#64748b] text-[13px]">
                                Grade {letter.student?.studentProfile?.grade || 'N/A'} - {letter.student?.studentProfile?.section || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-[#475569] font-bold text-[14.5px]">
                            {letter.title || 'Untitled'}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-[#64748b] text-[14.5px] font-medium flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {new Date(letter.absent_date || letter.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-center">
                          {getStatusBadge(letter.status)}
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button 
                            onClick={() => setSelectedLetter(letter)}
                            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-red-200 text-red-600 hover:text-white hover:bg-red-600 text-[14.5px] font-bold transition-colors bg-white shadow-sm"
                          >
                            <Eye className="w-4 h-4 mr-1" strokeWidth={2} />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer matches Absent page */}
            <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-[14px] text-slate-500 font-medium">
                Showing 1 to {filteredLetters?.length || 0} of {filteredLetters?.length || 0} results
              </span>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 p-0 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button className="w-9 h-9 p-0 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center">1</button>
                <button className="w-9 h-9 p-0 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedLetter} onOpenChange={(open) => !open && setSelectedLetter(null)}>
        <DialogContent className="sm:max-w-[700px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-[#f8f9fa] dark:bg-[#161920] p-8 !rounded-[24px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {selectedLetter && (
            <>
              <DialogHeader className="mb-6 flex flex-row items-center gap-4">
                <div className="w-[48px] h-[48px] rounded-xl bg-[#fbebeb] dark:bg-[#7a1315]/20 flex flex-col items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-[#7a1315]" />
                </div>
                <div>
                  <DialogTitle className="text-[20px] font-black text-[#111827] dark:text-white tracking-tight m-0 leading-none mb-1">
                    Excuse Letter Review
                  </DialogTitle>
                  <p className="text-[13px] text-[#6B7280] dark:text-slate-400 font-medium m-0">
                    Submitted by <span className="text-[#111827] dark:text-slate-200 font-bold">{selectedLetter.student?.name}</span> on {new Date(selectedLetter.created_at).toLocaleDateString()}
                  </p>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                
                {/* The Letter Body */}
                <div className="bg-white dark:bg-[#1c1f26] border-2 border-[#7a1315] rounded-xl p-8 relative overflow-hidden shadow-sm">
                  {/* Faded Background Logo */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <svg className="w-96 h-96" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-[#7a1315]/20 pb-6 mb-6">
                      <div className="flex gap-4 items-center">
                        <div className="w-[85px] h-[85px] shrink-0">
                          <img src="/id-assets/school-logo.png" className="w-full h-full object-contain" alt="School Logo" />
                        </div>
                        <div>
                          <h1 className="text-[#7a1315] font-black text-xl tracking-wide uppercase leading-tight mt-2">TRENTO WEST CENTRAL<br/>ELEMENTARY SPED CENTER</h1>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="inline-block bg-[#7a1315] text-white text-[11px] font-bold px-3 py-1 rounded mb-2 uppercase tracking-wider">
                          Excuse Letter
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">No. SA-EL-{new Date().getFullYear()}-{String(selectedLetter.id).padStart(5, '0')}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Date: {new Date(selectedLetter.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      <p className="mb-6">
                        To:<br/>
                        <span className="font-bold text-slate-900 dark:text-white">The Class Adviser</span><br/>
                        Grade {selectedLetter.student?.studentProfile?.grade || 'N/A'} - Section {selectedLetter.student?.studentProfile?.section || 'N/A'}<br/>
                        TRENTO WEST CENTRAL ELEMENTARY SPED CENTER
                      </p>

                      <p className="mb-4">Dear Sir/Madam,</p>

                      <p className="mb-6">Please excuse the absence of the undersigned student from school due to the reason stated below.</p>

                      <div className="grid grid-cols-[140px_20px_1fr] gap-y-3 mb-6 font-bold text-slate-900 dark:text-white ml-4">
                        <div className="text-slate-600 dark:text-slate-400">Student Name</div>
                        <div>:</div>
                        <div>{selectedLetter.student?.name}</div>

                        <div className="text-slate-600 dark:text-slate-400">Grade & Section</div>
                        <div>:</div>
                        <div>Grade {selectedLetter.student?.studentProfile?.grade || 'N/A'} - Section {selectedLetter.student?.studentProfile?.section || 'N/A'}</div>

                        <div className="text-slate-600 dark:text-slate-400">Date of Absence</div>
                        <div>:</div>
                        <div>{new Date(selectedLetter.absent_date || selectedLetter.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>

                        <div className="text-slate-600 dark:text-slate-400">Reason for Absence</div>
                        <div>:</div>
                        <div className="font-medium whitespace-pre-wrap">{selectedLetter.reason}</div>
                      </div>

                      <p className="mb-8">Thank you for your understanding.</p>

                      <p className="mb-6">Respectfully yours,</p>

                      <div className="w-48">
                        <div className="h-10 relative flex items-end justify-center pb-1">
                          <div className="font-bold text-[15px] text-slate-800">
                            {selectedLetter.student?.name}
                          </div>
                          <div className="border-b border-slate-400 absolute bottom-0 w-full"></div>
                        </div>
                        <p className="text-center mt-1 text-[10px] text-slate-500 font-medium">Student Signature</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedLetter.attachment_path && (
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-slate-400 mb-2">Attachment</h3>
                    <a 
                      href={`/storage/${selectedLetter.attachment_path}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-3 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#111827] dark:text-white font-bold text-[14px] rounded-xl transition-colors w-full group"
                    >
                      <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      View Attached Certificate / Image
                    </a>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  {selectedLetter.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => rejectMutation.mutate(selectedLetter.id)}
                        disabled={rejectMutation.isPending || approveMutation.isPending}
                        className="flex-1 py-3.5 bg-[#fbebeb] text-[#7a1315] hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 font-bold text-[15px] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                      </button>
                      <button 
                        onClick={() => approveMutation.mutate(selectedLetter.id)}
                        disabled={rejectMutation.isPending || approveMutation.isPending}
                        className="flex-1 py-3.5 bg-[#7a1315] hover:bg-[#5a0e10] text-white font-bold text-[15px] rounded-xl shadow-md shadow-[#7a1315]/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {approveMutation.isPending ? 'Approving...' : 'Approve'}
                      </button>
                    </>
                  ) : (
                    <div className={`w-full py-3 text-center rounded-xl font-bold text-[15px] ${
                      selectedLetter.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {selectedLetter.status === 'approved' ? 'Letter Approved' : 'Letter Rejected'}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
