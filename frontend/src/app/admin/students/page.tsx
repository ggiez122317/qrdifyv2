'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  Eye,
  Users,
  GraduationCap,
  TrendingUp,
  UserPlus,
  Trash
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { TableLoadingState } from '@/components/ui/TableLoadingState';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const DynamicStudentViewModal = dynamic(() => import('@/components/admin/StudentViewModal').then(mod => mod.StudentViewModal), {
  ssr: false,
});
const DynamicDeleteConfirmModal = dynamic(() => import('@/components/admin/DeleteConfirmModal').then(mod => mod.DeleteConfirmModal), {
  ssr: false,
});

export interface StudentRecord {
  id: number | string;
  name: string;
  email?: string;
  lrn?: string;
  status?: string;
  photo_url?: string | null;
  student_profile?: {
    grade?: string;
    section?: string | {
      name?: string;
      grade_level?: string;
    };
    parent_name?: string;
    parent_phone?: string;
  };
}

const formatGrade = (grade?: string) => {
  if (!grade?.trim()) return 'N/A';
  return grade.replace(/^grade\s*/i, '').trim() || 'N/A';
};

const getSectionGrade = (section?: string | { grade_level?: string }) =>
  typeof section === 'object' ? section.grade_level : undefined;

const getSectionName = (section?: string | { name?: string }) =>
  typeof section === 'object' ? section.name : section;

export default function StudentsManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<StudentRecord | null>(null);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [stats, setStats] = useState<{
    totalStudents: number;
    attendanceRate: number;
    newThisMonth: number;
    sparklines: {
      total: number[];
      attendance: number[];
      new: number[];
    }
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const itemsPerPage = 10;

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRecords.map(r => r.id));
    }
  };

  const toggleSelect = (id: number | string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected student(s)?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/api/students/${id}`)));
      setRecords(prev => prev.filter(r => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      localStorage.setItem('toast_message', `${selectedIds.length} student(s) deleted successfully`);
      window.dispatchEvent(new Event('toast-trigger'));
    } catch {
      localStorage.setItem('toast_message', 'Failed to delete some records');
      window.dispatchEvent(new Event('toast-trigger'));
    }
  };

  const generateSparklinePath = (data: number[]) => {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min;
    
    const width = 100;
    const height = 30;
    
    return data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / (range || 1)) * height;
      const clampedY = Math.max(2, Math.min(y, height - 2)); // keep stroke in bounds
      return `${i === 0 ? 'M' : 'L'} ${x},${clampedY}`;
    }).join(' ');
  };

  useEffect(() => {
    // Fetch students from real Laravel backend
    const fetchStudents = async () => {
      try {
        // Fetch sequentially to prevent PHP built-in server from hanging on concurrent requests
        const studentsRes = await api.get('/api/students');
        const statsRes = await api.get('/api/students-stats');
        const data = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data.data || []);
        setRecords(data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Network error fetching students', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const getStatusElement = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'enrolled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-green-50 text-green-600 border border-green-100">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          ENROLLED
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-yellow-50 text-yellow-600 border border-yellow-100">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
          PENDING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
        INACTIVE
      </span>
    );
  };

  return (
    <>
      <div className="max-w-[1400px] mx-auto w-full bg-[#f8f9fa] min-h-screen p-6 sm:p-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Student Management</h2>
            <p className="text-slate-500 text-[15px] mt-1 font-medium">Manage and monitor all student records.</p>
          </div>
          
          <Link 
            href="/admin/students/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0B3A82] hover:bg-[#092558] text-white transition-colors shadow-[0_4px_14px_rgba(11,58,130,0.3)] text-[14px] font-bold rounded-none mt-4 sm:mt-0"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Add New Student
          </Link>
        </div>

        {/* Statistics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Students */}
          <div className="bg-white rounded-none p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-[#0B3A82]" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-1">{stats ? stats.totalStudents.toLocaleString() : '...'}</h3>
            <p className="text-xs font-bold text-slate-800 mb-1">Total Students</p>
            <p className="text-[11px] font-medium text-slate-500">All registered students</p>
            <div className="absolute bottom-4 right-4 w-16 h-8 opacity-40">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full text-[#0B3A82] stroke-current" fill="none">
                <path d={stats ? generateSparklinePath(stats.sparklines.total) : ""} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          {/* Enrolled Students */}
          <div className="bg-white rounded-none p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <GraduationCap className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-1">{stats ? stats.totalStudents.toLocaleString() : '...'}</h3>
            <p className="text-xs font-bold text-slate-800 mb-1">Enrolled Students</p>
            <p className="text-[11px] font-medium text-slate-500">Currently enrolled</p>
            <div className="absolute bottom-4 right-4 w-16 h-8 opacity-40">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full text-emerald-400 stroke-current" fill="none">
                <path d={stats ? generateSparklinePath(stats.sparklines.total) : ""} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="bg-white rounded-none p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-1">{stats ? stats.attendanceRate + '%' : '...'}</h3>
            <p className="text-xs font-bold text-slate-800 mb-1">Attendance Rate</p>
            <p className="text-[11px] font-medium text-slate-500">Overall attendance</p>
            <div className="absolute bottom-4 right-4 w-16 h-8 opacity-40">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full text-yellow-400 stroke-current" fill="none">
                <path d={stats ? generateSparklinePath(stats.sparklines.attendance) : ""} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* New This Month */}
          <div className="bg-white rounded-none p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <UserPlus className="w-5 h-5 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-1">{stats ? stats.newThisMonth.toLocaleString() : '...'}</h3>
            <p className="text-xs font-bold text-slate-800 mb-1">New This Month</p>
            <p className="text-[11px] font-medium text-slate-500">Students added</p>
            <div className="absolute bottom-4 right-4 w-16 h-8 opacity-40">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full text-indigo-400 stroke-current" fill="none">
                <path d={stats ? generateSparklinePath(stats.sparklines.new) : ""} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            {selectedIds.length > 0 && (
              <button 
                onClick={bulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold rounded-none transition-colors shadow-sm"
              >
                <Trash className="w-4 h-4" />
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
              <input 
                type="text"
                placeholder="Search by name, LRN, email or ID..." 
                className="pl-11 pr-4 py-2.5 w-full sm:w-[320px] bg-white border border-slate-200 rounded-none text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3A82]/20 focus:border-[#0B3A82]/30 transition-all placeholder:text-slate-400 font-medium shadow-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
              <select 
                className="pl-11 pr-10 py-2.5 bg-white border border-slate-200 rounded-none text-[13px] text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#0B3A82]/20 focus:border-[#0B3A82]/30 appearance-none cursor-pointer shadow-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="enrolled">Enrolled</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-transparent border-b border-slate-100">
                <TableRow className="hover:bg-transparent border-b-0">
                  <TableHead className="w-[50px] py-6 pl-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedRecords.length && paginatedRecords.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-[#0B3A82] cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="w-[300px] font-black text-slate-900 py-6">Student</TableHead>
                  <TableHead className="font-black text-slate-900 text-center py-6">LRN</TableHead>
                  <TableHead className="font-black text-slate-900 text-center py-6">Grade & Section</TableHead>
                  <TableHead className="font-black text-slate-900 text-center py-6">Status</TableHead>
                  <TableHead className="font-black text-slate-900 text-right py-6 pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoadingState colSpan={6} message="Loading students..." />
                ) : paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-[400px] text-center border-b-0">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative mb-8 mt-4">
                           <div className="absolute inset-0 bg-slate-100/50 rounded-full blur-3xl transform scale-150"></div>
                           {/* Custom SVG Illustration */}
                           <div className="relative z-10">
                              <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 90 Q 25 80 40 85 T 60 90" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
                                <rect x="40" y="20" width="46" height="60" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2.5"/>
                                <circle cx="75" cy="75" r="14" fill="white" stroke="#e11d48" strokeWidth="3.5"/>
                                <path d="M85 85L98 98" stroke="#e11d48" strokeWidth="4.5" strokeLinecap="round"/>
                              </svg>
                           </div>
                        </div>
                        <h3 className="text-[22px] font-bold text-slate-900 mb-2.5">No students found</h3>
                        <p className="text-slate-500 text-[15px] mb-8 font-medium">There are no students matching your search criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                      <TableCell className="py-4 pl-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(record.id)}
                          onChange={() => toggleSelect(record.id)}
                          className="w-4 h-4 accent-[#0B3A82] cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#0B3A82] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0 overflow-hidden">
                            {record.photo_url ? (
                              <Image src={getImageUrl(record.photo_url) || ''} alt={record.name} width={40} height={40} className="w-full h-full object-cover" unoptimized={true} />
                            ) : (
                              record.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col">
                            <p className="font-bold text-slate-900 text-[14px] leading-tight mb-0.5">{record.name}</p>
                            <p className="text-[12px] text-slate-500 font-medium">
                              {record.email || 'student.alex@email.com'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-[13px] font-extrabold text-slate-900">{record.lrn}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                           <span className="font-bold text-slate-900 text-[13px] mb-1">Grade {formatGrade(record.student_profile?.grade || getSectionGrade(record.student_profile?.section))}</span>
                           <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">Grade {formatGrade(record.student_profile?.grade || getSectionGrade(record.student_profile?.section))} - {getSectionName(record.student_profile?.section) || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         {getStatusElement(record.status || 'enrolled')}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={async () => {
                              try {
                                const res = await api.get(`/api/students/${record.id}`);
                                setSelectedStudent(res.data);
                              } catch {
                                setSelectedStudent(record);
                              }
                              setIsViewModalOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 rounded-none bg-white transition-all shadow-sm"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link 
                            href={`/admin/students/${record.id}/edit`}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 rounded-none bg-white transition-all shadow-sm"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => {
                              setRecordToDelete(record);
                              setIsDeleteModalOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-[#0B3A82] hover:text-red-600 border border-red-100 hover:border-red-200 rounded-none bg-white transition-all shadow-sm"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-5 bg-white border-t border-slate-100">
            <p className="text-[13px] text-slate-500 font-medium mb-4 sm:mb-0">
              Showing 1 to {paginatedRecords.length} of {filteredRecords.length.toLocaleString()} results
            </p>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-none border-slate-200 text-slate-400 hover:text-slate-900 bg-white shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1.5 mx-2">
                {[...Array(Math.min(3, totalPages))].map((_, i) => (
                  <button key={i} className={`h-8 w-8 rounded-none text-[13px] font-bold shadow-sm transition-all ${currentPage === i + 1 ? 'bg-[#0B3A82] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`} onClick={() => setCurrentPage(i+1)}>
                    {i + 1}
                  </button>
                ))}
                {totalPages > 4 && <span className="text-slate-400 font-black px-1 tracking-widest">...</span>}
                {totalPages > 3 && (
                  <button className={`h-8 w-8 rounded-none text-[13px] font-bold shadow-sm transition-all ${currentPage === totalPages ? 'bg-[#0B3A82] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`} onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                  </button>
                )}
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0 rounded-none border-slate-200 text-slate-400 hover:text-slate-900 bg-white shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        
      </div>

      <DynamicStudentViewModal 
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
      />

      <DynamicDeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={() => {
          if (recordToDelete) {
            // Delete API call would go here
            setRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
            localStorage.setItem('toast_message', 'Student deleted successfully');
            window.location.reload(); // Simple reload to show toast, or handle locally
          }
        }}
      />
    </>
  );
}
