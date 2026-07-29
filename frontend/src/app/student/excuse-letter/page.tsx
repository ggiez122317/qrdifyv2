'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useState, useMemo } from 'react';
import { Plus, FileText, CheckCircle2, XCircle, Clock, CloudUpload, Paperclip, Send, Search, Filter, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

export default function StudentExcuseLetter() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [absentDate, setAbsentDate] = useState('');
  const [reason, setReason] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [letterToDelete, setLetterToDelete] = useState<any>(null);

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

  const { data: teachers = [] } = useQuery({
    queryKey: ['student-teachers'],
    queryFn: async () => {
      const res = await api.get('/api/student/teachers');
      return res.data;
    }
  });

  const { data: letters = [], isLoading } = useQuery({
    queryKey: ['student-excuse-letters'],
    queryFn: async () => {
      const res = await api.get('/api/student/excuse-letters');
      return res.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post('/api/student/excuse-letters', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-excuse-letters'] });
      setIsModalOpen(false);
      setTitle('');
      setAbsentDate('');
      setReason('');
      setTeacherId('');
      setFile(null);
      setPreviewUrl(null);
      localStorage.setItem('toast_message', 'Your excuse letter has been sent to your teacher. Please wait for their confirmation.');
    },
    onError: (err: any) => {
      localStorage.setItem('toast_message', err.response?.data?.message || 'Unable to submit your excuse letter at this time. Please try again.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/api/student/excuse-letters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-excuse-letters'] });
      setLetterToDelete(null);
      localStorage.setItem('toast_message', 'Your excuse letter has been removed successfully.');
    }
  });

  const handleDelete = () => {
    if (letterToDelete) {
      deleteMutation.mutate(letterToDelete.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !absentDate || !reason.trim()) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('absent_date', absentDate);
    formData.append('reason', reason);
    formData.append('teacher_id', teacherId);
    if (file) formData.append('attachment', file);

    submitMutation.mutate(formData);
  };

  const filteredLetters = useMemo(() => {
    return letters.filter((letter: any) => {
      const matchesSearch = 
        (letter.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (letter.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || letter.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [letters, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
    if (status === 'rejected') return <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-600 text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
    return <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Pending</span>;
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#111827] dark:text-white tracking-tight">Excuse Letters</h1>
            <p className="text-[#6B7280] font-medium mt-1">Submit and track your absence excuse letters.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#7a1315] hover:bg-[#5a0e10] text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Excuse Letter
          </button>
        </div>

        <div className="bg-white dark:bg-[#161920] border border-[#E5E7EB] dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#E5E7EB] dark:border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h2 className="text-lg font-black text-[#111827] dark:text-slate-300 tracking-tight shrink-0">My Letters</h2>
            
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
          <div className="p-0 min-h-[400px]">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 h-full min-h-[400px]">
                <svg className="animate-spin h-6 w-6 text-[#0B3A82]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium">Loading...</span>
              </div>
            ) : filteredLetters.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="w-[72px] h-[72px] rounded-full bg-[#fbebeb] dark:bg-[#7a1315]/20 flex items-center justify-center mb-5">
                  <FileText className="w-8 h-8 text-[#7a1315]" />
                </div>
                <h3 className="text-xl font-black text-[#111827] dark:text-slate-300 mb-2">No Excuse Letters Found</h3>
                <p className="text-[15px] text-[#6B7280]">Try adjusting your search or filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[11px] text-[#94a3b8] dark:text-slate-500 uppercase font-bold tracking-wider border-b border-slate-100 dark:border-white/5">
                    <tr>
                      <th className="px-8 py-5">Date of Absence</th>
                      <th className="px-8 py-5">Title</th>
                      <th className="px-8 py-5">Reason</th>
                      <th className="px-8 py-5 text-center">Status</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {filteredLetters.map((letter: any) => (
                      <tr key={letter.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-md uppercase tracking-wider">
                            {new Date(letter.absent_date || letter.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[15px] font-bold text-[#111827] dark:text-white">
                            {letter.title || 'Untitled Excuse'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[14px] font-medium text-slate-600 dark:text-slate-300 line-clamp-1 max-w-[300px]">
                            {letter.reason}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-center">
                          {getStatusBadge(letter.status)}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-3">
                            {letter.attachment_path && (
                              <a 
                                href={`/storage/${letter.attachment_path}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                title="View Attachment"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => setLetterToDelete(letter)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                              title="Delete Excuse Letter"
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
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white dark:bg-[#161920] p-8 !rounded-[24px]">
          <DialogHeader className="mb-2 flex flex-row items-center gap-4">
            <div className="w-[48px] h-[48px] rounded-xl bg-[#fbebeb] dark:bg-[#7a1315]/20 flex flex-col items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-[#7a1315]" />
            </div>
            <h2 className="text-[24px] font-black text-[#111827] dark:text-white tracking-tight m-0 leading-none">Submit Excuse Letter</h2>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-slate-400 block mb-1">
                RECIPIENT TEACHER
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                required
                className="w-full bg-white dark:bg-transparent border border-[#f4a7a7] dark:border-[#7a1315]/50 rounded-xl px-4 py-2.5 text-[15px] text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#7a1315] focus:border-[#7a1315] shadow-sm transition-shadow appearance-none"
              >
                <option value="">Select a teacher...</option>
                {teachers.map((t: { id: number; name: string }) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="e.g. Fever and Colds"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-slate-400 block mb-1">
                  DATE OF ABSENCE
                </label>
                <input
                  type="date"
                  value={absentDate}
                  onChange={(e) => setAbsentDate(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-transparent border border-[#f4a7a7] dark:border-[#7a1315]/50 rounded-xl px-4 py-2.5 text-[15px] text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#7a1315] focus:border-[#7a1315] shadow-sm transition-shadow"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-slate-400 block mb-1">
                REASON FOR ABSENCE
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
                ATTACHMENT (MEDICAL CERT, ETC.)
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
              disabled={submitMutation.isPending || !title.trim() || !absentDate || !reason.trim() || !teacherId}
              className="w-full bg-[#7a1315] hover:bg-[#5a0e10] disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-[15px] mt-2"
            >
              {submitMutation.isPending ? 'Sending...' : (
                <>
                  <Send className="w-4 h-4" />
                  Send Excuse Letter
                </>
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!letterToDelete} onOpenChange={(open) => !open && setLetterToDelete(null)}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white dark:bg-[#161920] p-6 !rounded-[24px]">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-[56px] h-[56px] rounded-full bg-[#fbebeb] dark:bg-[#7a1315]/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-[#7a1315]" strokeWidth={2.5} />
            </div>
            
            <div>
              <h2 className="text-xl font-black text-[#111827] dark:text-white tracking-tight mb-2">Delete Excuse Letter?</h2>
              <p className="text-sm text-[#6B7280] dark:text-slate-400">
                Are you sure you want to delete this excuse letter? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setLetterToDelete(null)}
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
    </DashboardLayout>
  );
}
