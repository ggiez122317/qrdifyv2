'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useState, useMemo } from 'react';
import { Plus, CheckCircle2, XCircle, Clock, CloudUpload, Paperclip, Send, Search, Filter, Eye, Trash2, AlertTriangle, CalendarOff, Calendar, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

export default function TeacherLeaves() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [leaveToDelete, setLeaveToDelete] = useState<any>(null);
  const [viewLeave, setViewLeave] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['teacher-leaves'],
    queryFn: async () => {
      const res = await api.get('/api/teacher/leaves');
      return res.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post('/api/teacher/leaves', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-leaves'] });
      setIsModalOpen(false);
      setTitle('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setFile(null);
      setPreviewUrl(null);
      localStorage.setItem('toast_message', 'Your leave request has been submitted for review. Please wait for the principal to respond.');
    },
    onError: (err: any) => {
      localStorage.setItem('toast_message', err.response?.data?.message || 'Failed to submit leave request');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/api/teacher/leaves/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-leaves'] });
      setLeaveToDelete(null);
      localStorage.setItem('toast_message', 'Your leave request has been removed successfully.');
    }
  });

  const handleDelete = () => {
    if (leaveToDelete) {
      deleteMutation.mutate(leaveToDelete.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate || !reason.trim()) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);
    formData.append('reason', reason);
    if (file) formData.append('attachment', file);

    submitMutation.mutate(formData);
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave: any) => {
      const matchesSearch = 
        (leave.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (leave.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leaves, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
    if (status === 'rejected') return <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-600 text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
    return <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Pending</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave Requests</h1>
            <p className="text-slate-500">Submit and track your leave requests.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#7a1315] hover:bg-[#5a0e10] text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Leave Request
          </button>
        </div>

        <div className="bg-white dark:bg-[#161920] border border-[#E5E7EB] dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#E5E7EB] dark:border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h2 className="text-lg font-black text-[#111827] dark:text-slate-300 tracking-tight shrink-0">My Leaves</h2>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-[300px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search title or reason..." 
                  className="pl-10 h-10 w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500 transition-shadow"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none h-10 pl-10 pr-8 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500 font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>
          <div className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 min-h-[250px]">
                <svg className="animate-spin h-6 w-6 text-[#0B3A82]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium">Loading...</span>
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center min-h-[250px]">
                <div className="w-[72px] h-[72px] rounded-full bg-[#fbebeb] dark:bg-[#7a1315]/20 flex items-center justify-center mb-5">
                  <CalendarOff className="w-8 h-8 text-[#7a1315]" />
                </div>
                <h3 className="text-xl font-black text-[#111827] dark:text-slate-300 mb-2">No Leave Requests Found</h3>
                <p className="text-[15px] text-[#6B7280]">Try adjusting your search or filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[11px] text-[#94a3b8] dark:text-slate-500 uppercase font-bold tracking-wider border-b border-slate-100 dark:border-white/5">
                    <tr>
                      <th className="px-8 py-5">Date Range</th>
                      <th className="px-8 py-5">Title</th>
                      <th className="px-8 py-5">Reason</th>
                      <th className="px-8 py-5 text-center">Status</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {filteredLeaves.map((leave: any) => (
                      <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-white/10">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {leave.end_date && leave.start_date !== leave.end_date ? ` - ${new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[15px] font-bold text-[#111827] dark:text-white">
                            {leave.title || 'Untitled Leave'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[14px] font-medium text-slate-600 dark:text-slate-300 line-clamp-1 max-w-[300px]">
                            {leave.reason}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-center">
                          {getStatusBadge(leave.status)}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => setViewLeave(leave)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setLeaveToDelete(leave)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                              title="Delete Leave Request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {!isLoading && filteredLeaves.length > 0 && (
              <div className="px-8 py-5 border-t border-[#E5E7EB] dark:border-white/5 flex items-center justify-between text-sm text-[#6B7280] font-medium">
                <div>Showing 1 to {filteredLeaves.length} of {filteredLeaves.length} entries</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-400">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#7a1315] text-white font-bold">1</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-400">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative">
                    <select className="appearance-none border border-slate-200 dark:border-white/10 rounded-lg h-8 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-[#7a1315] text-[#111827] dark:text-white bg-transparent">
                      <option>10 / page</option>
                      <option>20 / page</option>
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white dark:bg-[#161920] p-8 !rounded-[24px]">
          <DialogHeader className="mb-2 flex flex-row items-center gap-4">
            <div className="w-[48px] h-[48px] rounded-xl bg-[#fbebeb] dark:bg-[#7a1315]/20 flex flex-col items-center justify-center shrink-0">
              <CalendarOff className="w-6 h-6 text-[#7a1315]" />
            </div>
            <h2 className="text-[24px] font-black text-[#111827] dark:text-white tracking-tight m-0 leading-none">Submit Leave Request</h2>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-slate-400 block mb-1">
                TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-white dark:bg-transparent border border-[#f4a7a7] dark:border-[#7a1315]/50 rounded-xl px-4 py-2.5 text-[15px] text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#7a1315] focus:border-[#7a1315] shadow-sm transition-shadow placeholder:text-[#9CA3AF]"
                placeholder="e.g. Sick Leave, Vacation Leave"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-slate-400 block mb-1">
                  START DATE
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-transparent border border-[#f4a7a7] dark:border-[#7a1315]/50 rounded-xl px-4 py-2.5 text-[15px] text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#7a1315] focus:border-[#7a1315] shadow-sm transition-shadow"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-slate-400 block mb-1">
                  END DATE
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate}
                  className="w-full bg-white dark:bg-transparent border border-[#f4a7a7] dark:border-[#7a1315]/50 rounded-xl px-4 py-2.5 text-[15px] text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#7a1315] focus:border-[#7a1315] shadow-sm transition-shadow"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-slate-400 block mb-1">
                REASON FOR LEAVE
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full bg-white dark:bg-transparent border border-[#f4a7a7] dark:border-[#7a1315]/50 rounded-xl px-4 py-3 text-[15px] text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#7a1315] focus:border-[#7a1315] min-h-[100px] resize-none shadow-sm transition-shadow placeholder:text-[#9CA3AF]"
                placeholder="Please provide a detailed reason..."
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-slate-400 block mb-1">
                ATTACHMENT (OPTIONAL)
              </label>
              <div className={`relative border ${file ? 'border-solid border-[#7a1315]/30 bg-[#fefafa] dark:bg-[#7a1315]/10' : 'border-dashed border-[#f4a7a7] dark:border-[#7a1315]/50'} rounded-xl p-5 text-center hover:bg-[#fefafa] dark:hover:bg-[#7a1315]/5 transition-colors group cursor-pointer bg-white dark:bg-transparent shadow-sm overflow-hidden`}>
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-3 pointer-events-none relative z-0">
                    {previewUrl ? (
                      <div className="w-full h-[120px] relative rounded-lg overflow-hidden border border-[#f4a7a7]">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain bg-white dark:bg-black/20" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                        <Paperclip className="w-6 h-6 text-[#7a1315]" />
                      </div>
                    )}
                    <div className="flex flex-col items-center">
                      <span className="text-[14px] font-bold text-[#111827] dark:text-slate-200 truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <span className="text-[12px] text-[#6B7280] font-medium mt-0.5">Click to change file</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <CloudUpload className="w-8 h-8 text-[#7a1315] group-hover:scale-110 transition-transform duration-300" strokeWidth={2} />
                    <span className="text-[15px] font-bold text-[#111827] dark:text-slate-200 mt-1">
                      Click or drag file to upload
                    </span>
                    <span className="text-[13px] text-[#6B7280] font-medium">JPG, PNG, or PDF (Max 5MB)</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitMutation.isPending || !title.trim() || !startDate || !endDate || !reason.trim()}
              className="w-full bg-[#7a1315] hover:bg-[#5a0e10] disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-[15px] mt-2"
            >
              {submitMutation.isPending ? 'Sending...' : (
                <>
                  <Send className="w-4 h-4" />
                  Send Leave Request
                </>
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!leaveToDelete} onOpenChange={(open) => !open && setLeaveToDelete(null)}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white dark:bg-[#161920] p-6 !rounded-[24px]">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-[56px] h-[56px] rounded-full bg-[#fbebeb] dark:bg-[#7a1315]/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-[#7a1315]" strokeWidth={2.5} />
            </div>
            
            <div>
              <h2 className="text-xl font-black text-[#111827] dark:text-white tracking-tight mb-2">Delete Leave Request?</h2>
              <p className="text-sm text-[#6B7280] dark:text-slate-400">
                Are you sure you want to delete this leave request? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setLeaveToDelete(null)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors"
              >
                No, cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-3 bg-[#7a1315] hover:bg-[#5a0e10] text-white rounded-xl font-bold transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Leave Modal */}
      <Dialog open={!!viewLeave} onOpenChange={(open) => !open && setViewLeave(null)}>
        <DialogContent className="sm:max-w-[700px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-[#f8f9fa] dark:bg-[#161920] p-8 !rounded-[24px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {viewLeave && (
            <>
              <DialogHeader className="mb-6 flex flex-row items-center gap-4">
                <div className="w-[48px] h-[48px] rounded-xl bg-[#fbebeb] dark:bg-[#7a1315]/20 flex flex-col items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-[#7a1315]" />
                </div>
                <div>
                  <DialogTitle className="text-[20px] font-black text-[#111827] dark:text-white tracking-tight m-0 leading-none mb-1">
                    Leave Request Review
                  </DialogTitle>
                  <p className="text-[13px] text-[#6B7280] dark:text-slate-400 font-medium m-0">
                    Submitted by <span className="text-[#111827] dark:text-slate-200 font-bold">You</span> on {new Date(viewLeave.created_at || viewLeave.start_date).toLocaleDateString()}
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
                        <div className="w-[60px] h-[60px] rounded-full bg-[#7a1315] flex items-center justify-center shrink-0">
                          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        </div>
                        <div>
                          <h1 className="text-[#7a1315] font-black text-xl tracking-wide uppercase">Sunrise Academy</h1>
                          <p className="text-[#7a1315] font-bold text-[10px] tracking-widest uppercase mb-1">Integrity • Excellence • Service</p>
                          <div className="text-[10px] text-slate-500 font-medium">
                            <p>123 Education Lane, Greenfield City, 1000</p>
                            <p className="flex items-center gap-2 mt-0.5">
                              <span>📞 (02) 8123-4567</span>
                              <span>✉️ info@sunriseacademy.edu.ph</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="inline-block bg-[#7a1315] text-white text-[11px] font-bold px-3 py-1 rounded mb-2 uppercase tracking-wider">
                          Leave Request
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">No. SA-LR-{new Date().getFullYear()}-{String(viewLeave.id).padStart(5, '0')}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Date: {new Date(viewLeave.created_at || viewLeave.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      <p className="mb-6">
                        To:<br/>
                        <span className="font-bold text-slate-900 dark:text-white">The School Principal</span><br/>
                        Sunrise Academy
                      </p>

                      <p className="mb-4">Dear Sir/Madam,</p>

                      <p className="mb-6">I am writing to formally request a leave of absence for the following details:</p>

                      <div className="grid grid-cols-[140px_20px_1fr] gap-y-3 mb-6 font-bold text-slate-900 dark:text-white ml-4">
                        <div className="text-slate-600 dark:text-slate-400">Leave Title</div>
                        <div>:</div>
                        <div className="break-words min-w-0">{viewLeave.title || 'Untitled Leave'}</div>

                        <div className="text-slate-600 dark:text-slate-400">Start Date</div>
                        <div>:</div>
                        <div>{new Date(viewLeave.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>

                        <div className="text-slate-600 dark:text-slate-400">End Date</div>
                        <div>:</div>
                        <div>{viewLeave.end_date ? new Date(viewLeave.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</div>

                        <div className="text-slate-600 dark:text-slate-400">Reason for Leave</div>
                        <div>:</div>
                        <div className="font-medium whitespace-pre-wrap break-all min-w-0">{viewLeave.reason}</div>
                      </div>

                      <p className="mb-8">Thank you for your consideration.</p>

                      <p className="mb-6">Respectfully yours,</p>

                      <div className="w-48">
                        {/* Fake signature line */}
                        <div className="h-10 relative">
                          <div className="absolute bottom-1 left-4 font-[cursive] text-2xl text-slate-800 opacity-60 transform -rotate-2">
                            {user?.name?.split(' ')[0] || 'Teacher'}
                          </div>
                          <div className="border-b border-slate-400 absolute bottom-0 w-full"></div>
                        </div>
                        <p className="text-center mt-1 text-[11px] text-slate-500 font-medium">Signature of Employee</p>
                      </div>
                    </div>
                  </div>
                </div>

                {viewLeave.attachment_path && (
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-slate-400 mb-2">Attachment</h3>
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex flex-col items-center justify-center p-2 relative group mb-3">
                      <img 
                        src={`/storage/${viewLeave.attachment_path}`} 
                        alt="Attachment" 
                        className="max-w-full h-auto max-h-[300px] object-contain rounded-lg shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="text-sm font-medium text-slate-500 py-10 flex flex-col items-center gap-3"><svg class="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>View Document</div>';
                        }}
                      />
                    </div>
                    <a 
                      href={`/storage/${viewLeave.attachment_path}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-3 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#111827] dark:text-white font-bold text-[14px] rounded-xl transition-colors w-full group"
                    >
                      <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      Open Full Attachment
                    </a>
                  </div>
                )}
                
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setViewLeave(null)}
                    className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-xl font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
