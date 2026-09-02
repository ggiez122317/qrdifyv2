'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TableLoadingState } from '@/components/ui/TableLoadingState';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Users, 
  CheckCircle2, 
  Clock, 
  UserX, 
  Calendar, 
  ChevronDown,
  RefreshCw,
  Trash2,
  Loader2
} from 'lucide-react';

interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  time_in: string;
  time_out: string | null;
  status: string;
  user: {
    name: string;
    photo_url?: string | null;
    roles: Array<{ name: string }>;
    student_profile?: { grade?: string | number; section?: string } | null;
    teacher_profile?: { department?: string } | null;
  };
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  // Debounce the search term to avoid hitting the backend on every single keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const { data: records = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendanceToday', selectedDate, debouncedSearch, statusFilter],
    queryFn: async () => {
      const res = await api.get('/api/attendance/today', { 
        params: { 
          date: selectedDate,
          search: debouncedSearch || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter
        } 
      });
      return Array.isArray(res.data) ? res.data : (res.data.data || []);
    },
    refetchInterval: isToday ? 15000 : false, // Poll every 15s for today's data
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/attendance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceToday'] });
      setDeletingId(null);
    },
    onError: () => {
      setDeletingId(null);
    }
  });

  // Filter and Search logic
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch = record.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'early': return { bg: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> };
      case 'present': return { bg: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> };
      case 'late': return { bg: 'bg-amber-50 text-amber-600', icon: <Clock className="w-3.5 h-3.5 mr-1.5" /> };
      case 'absent': return { bg: 'bg-red-50 text-red-600', icon: <UserX className="w-3.5 h-3.5 mr-1.5" /> };
      default: return { bg: 'bg-slate-50 text-slate-600', icon: null };
    }
  };

  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=800000&color=fff&rounded=true&bold=true`;
  };

  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^\/?storage\//, '');
    return `/storage/${cleanPath}`;
  };

  return (
    <>
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 mt-2">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-none bg-red-50 flex items-center justify-center shrink-0 border border-red-100/50">
              <Calendar className="w-6 h-6 text-maroon-700" />
            </div>
            <div className="pt-1">
              <h2 className="text-[22px] font-bold text-slate-900 tracking-tight mb-0.5">
                {selectedDate === new Date().toISOString().split('T')[0] ? "Today's History" : "Attendance History"}
              </h2>
              <p className="text-slate-500 text-[13px] font-medium">Real-time attendance log for all students and teachers.</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="relative flex items-center">
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-none text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-300 shadow-sm cursor-pointer"
              />
              <Calendar className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search name, ID, or role..." 
                  className="pl-11 pr-4 py-3 w-full sm:w-[320px] bg-white border border-slate-200 rounded-none text-[14px] focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-300 transition-all placeholder:text-slate-400 font-medium shadow-sm"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select 
                  className="pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-none text-[14px] text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-300 appearance-none cursor-pointer shadow-sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="early">Early</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Records */}
          <div className="bg-white border border-slate-100 rounded-none p-5 shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow relative">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-none bg-blue-50 flex items-center justify-center shrink-0 text-blue-500">
                <Users className="w-6 h-6" />
              </div>
              <div className="w-10 h-1 bg-blue-500 rounded-full"></div>
            </div>
            <div className="py-1">
              <p className="text-[13px] font-semibold text-slate-500 mb-1">Total Records</p>
              <p className="text-[28px] font-bold text-slate-900 leading-none mb-1.5">{records.length}</p>
              <p className="text-[11px] font-semibold text-slate-400">Today</p>
            </div>
          </div>
          
          {/* Present */}
          <div className="bg-white border border-slate-100 rounded-none p-5 shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow relative">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-none bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="w-10 h-1 bg-emerald-500 rounded-full"></div>
            </div>
            <div className="py-1">
              <p className="text-[13px] font-semibold text-slate-500 mb-1">Present</p>
              <p className="text-[28px] font-bold text-slate-900 leading-none mb-1.5">{records.filter(r => r.status === 'present' || r.status === 'early').length}</p>
              <p className="text-[11px] font-semibold text-slate-400">
                {records.length > 0 ? Math.round((records.filter(r => r.status === 'present' || r.status === 'early').length / records.length) * 100) : 0}% of total
              </p>
            </div>
          </div>
          
          {/* Late */}
          <div className="bg-white border border-slate-100 rounded-none p-5 shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow relative">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-none bg-amber-50 flex items-center justify-center shrink-0 text-amber-500">
                <Clock className="w-6 h-6" />
              </div>
              <div className="w-10 h-1 bg-amber-500 rounded-full"></div>
            </div>
            <div className="py-1">
              <p className="text-[13px] font-semibold text-slate-500 mb-1">Late</p>
              <p className="text-[28px] font-bold text-slate-900 leading-none mb-1.5">{records.filter(r => r.status === 'late').length}</p>
              <p className="text-[11px] font-semibold text-slate-400">
                {records.length > 0 ? Math.round((records.filter(r => r.status === 'late').length / records.length) * 100) : 0}% of total
              </p>
            </div>
          </div>
          
          {/* Absent */}
          <div className="bg-white border border-slate-100 rounded-none p-5 shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow relative">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-none bg-red-50 flex items-center justify-center shrink-0 text-red-500">
                <UserX className="w-6 h-6" />
              </div>
              <div className="w-10 h-1 bg-red-500 rounded-full"></div>
            </div>
            <div className="py-1">
              <p className="text-[13px] font-semibold text-slate-500 mb-1">Absent</p>
              <p className="text-[28px] font-bold text-slate-900 leading-none mb-1.5">{records.filter(r => r.status === 'absent').length}</p>
              <p className="text-[11px] font-semibold text-slate-400">
                {records.length > 0 ? Math.round((records.filter(r => r.status === 'absent').length / records.length) * 100) : 0}% of total
              </p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-none shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-transparent border-b border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px] font-bold text-slate-900 py-5 pl-6">User</TableHead>
                  <TableHead className="font-bold text-slate-900 text-center py-5">Role</TableHead>
                  <TableHead className="font-bold text-slate-900 text-center py-5">Time In</TableHead>
                  <TableHead className="font-bold text-slate-900 text-center py-5">Time Out</TableHead>
                  <TableHead className="font-bold text-slate-900 text-right py-5 pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoadingState colSpan={5} message="Loading history..." />
                ) : paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-[400px] text-center border-b-0">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative mb-8 mt-4">
                           <div className="absolute inset-0 bg-slate-100/50 rounded-full blur-3xl transform scale-150"></div>
                           
                           {/* Empty state decorative elements */}
                           <svg className="absolute -top-6 -left-8 text-slate-200" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                             <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z"/>
                           </svg>
                           <svg className="absolute top-12 -right-12 text-slate-200" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                             <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z"/>
                           </svg>
                           <svg className="absolute -bottom-2 -left-12 text-slate-200 opacity-50" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                             <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z"/>
                           </svg>

                           {/* Custom SVG Illustration */}
                           <div className="relative z-10">
                              <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Clouds */}
                                <path d="M20 90 Q 25 80 40 85 T 60 90" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
                                <path d="M100 90 Q 95 75 80 80 T 60 90" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
                                
                                {/* Document */}
                                <rect x="40" y="20" width="46" height="60" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2.5"/>
                                <rect x="50" y="32" width="26" height="3" rx="1.5" fill="#cbd5e1"/>
                                <rect x="50" y="42" width="26" height="3" rx="1.5" fill="#cbd5e1"/>
                                <rect x="50" y="52" width="16" height="3" rx="1.5" fill="#cbd5e1"/>
                                
                                {/* Magnifying Glass */}
                                <circle cx="75" cy="75" r="14" fill="white" stroke="#e11d48" strokeWidth="3.5"/>
                                <path d="M85 85L98 98" stroke="#e11d48" strokeWidth="4.5" strokeLinecap="round"/>
                              </svg>
                           </div>
                        </div>
                        <h3 className="text-[22px] font-bold text-slate-900 mb-2.5">No records found</h3>
                        <p className="text-slate-500 text-[15px] mb-8 font-medium">There are no attendance logs for the selected date.</p>
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            queryClient.invalidateQueries({ queryKey: ['attendanceToday'] });
                          }}
                          className="flex items-center gap-2 px-6 py-3 bg-maroon-600 hover:bg-maroon-700 text-white font-bold text-sm rounded-none transition-all shadow-lg shadow-maroon-600/20 active:scale-[0.98]"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refresh Records
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-4">
                          {record.user?.photo_url ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                              <img 
                                src={getImageUrl(record.user.photo_url) || ''} 
                                alt={record.user?.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <img 
                                src={getAvatarUrl(record.user?.name || 'Unknown')} 
                                alt={record.user?.name} 
                                className="hidden w-full h-full"
                              />
                            </div>
                          ) : (
                            <img 
                              src={getAvatarUrl(record.user?.name || 'Unknown')} 
                              alt={record.user?.name} 
                              className="w-10 h-10 rounded-full shadow-sm shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-bold text-slate-800">{record.user?.name || 'Unknown'}</p>
                            {record.user?.roles?.[0]?.name === 'student' && record.user.student_profile && (
                              <p className="text-xs text-slate-500 font-medium">
                                Grade {record.user.student_profile.grade} - {record.user.student_profile.section}
                              </p>
                            )}
                            {record.user?.roles?.[0]?.name === 'teacher' && record.user.teacher_profile && (
                              <p className="text-xs text-slate-500 font-medium">
                                {record.user.teacher_profile.department} Dept.
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-none text-[11px] font-bold bg-blue-50 text-blue-600 uppercase tracking-wide">
                          {record.user?.roles?.[0]?.name || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-700">{record.time_in}</TableCell>
                      <TableCell className="text-center font-bold text-slate-400">{record.time_out || '--:--'}</TableCell>
                      <TableCell className="text-right pr-6">
                         <div className="flex items-center justify-end gap-3">
                           <span className={`inline-flex items-center font-bold px-3 py-1.5 rounded-none text-[11px] uppercase tracking-wide ${getStatusBadge(record.status).bg}`}>
                             {getStatusBadge(record.status).icon}
                             {record.status}
                           </span>
                           {deletingId === record.id ? (
                             <div className="flex items-center gap-1.5">
                               <button
                                 onClick={() => deleteMutation.mutate(record.id)}
                                 disabled={deleteMutation.isPending}
                                 className="px-2.5 py-1.5 text-[11px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-none transition-colors disabled:opacity-50"
                               >
                                 {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes'}
                               </button>
                               <button
                                 onClick={() => setDeletingId(null)}
                                 className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-none transition-colors"
                               >
                                 No
                               </button>
                             </div>
                           ) : (
                             <button 
                               onClick={() => setDeletingId(record.id)}
                               className="text-slate-300 hover:text-red-500 transition-colors p-1"
                               title="Delete record"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
            <p className="text-[13px] text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-700">{filteredRecords.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</span> of <span className="font-bold text-slate-700">{filteredRecords.length}</span> results
            </p>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-none border-slate-200 text-slate-500 hover:text-slate-900"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-[13px] font-bold text-slate-700">
                Page {currentPage} of {Math.max(totalPages, 1)}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0 rounded-none border-slate-200 text-slate-500 hover:text-slate-900"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
      </div>
    </>
  );
}
