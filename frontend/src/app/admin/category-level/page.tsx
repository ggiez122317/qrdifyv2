'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Edit2,
  Trash2,
  Layers,
  BookOpen,
  GraduationCap,
  Archive,
  Filter,
  SlidersHorizontal,
  MoreVertical,
  CheckCircle
} from 'lucide-react';
import { LoadingAnimation } from '@/components/ui/TableLoadingState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export interface CategoryRecord {
  id: number | string;
  name: string;
  description?: string;
  code?: string;
  status?: string;
  grade_level?: string;
  created_at?: string;
}

export default function CategoryLevelPage() {
  const [activeTab, setActiveTab] = useState<'grade_levels' | 'subjects' | 'sections'>('grade_levels');
  const [records, setRecords] = useState<CategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Stats state
  const [stats, setStats] = useState({ gradeLevels: 0, subjects: 0, active: 0, inactive: 0 });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CategoryRecord | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', description: '', code: '', grade_level: '', status: 'active' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    // 1. Fetch the main table data for the active tab
    try {
      let endpoint = '/api/admin/grade-levels';
      if (activeTab === 'subjects') endpoint = '/api/admin/subjects';
      if (activeTab === 'sections') endpoint = '/api/admin/sections';

      const res = await api.get(endpoint, {
        params: {
          search: searchTerm,
          sort: sortField,
          direction: sortDirection,
          page: currentPage,
          per_page: itemsPerPage
        }
      });
      const data = res.data.data || res.data;
      setRecords(Array.isArray(data) ? data : []);
      setTotalPages(res.data.last_page || Math.ceil((Array.isArray(data) ? data.length : 0) / itemsPerPage) || 1);
    } catch (err: unknown) {
      // On error, show empty state instead of wrong/stale data
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching records:', message);
      setRecords([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }

    // 2. Fetch stats independently — failure here won't affect the table
    try {
      const [gradesRes, subsRes, secsRes] = await Promise.allSettled([
        api.get('/api/admin/grade-levels'),
        api.get('/api/admin/subjects'),
        api.get('/api/admin/sections')
      ]);
      const g = gradesRes.status === 'fulfilled' ? (gradesRes.value.data.data || []) : [];
      const s = subsRes.status === 'fulfilled' ? (subsRes.value.data.data || []) : [];
      const c = secsRes.status === 'fulfilled' ? (secsRes.value.data.data || []) : [];
      const all = [...g, ...s, ...c];
      
      setStats({
        gradeLevels: g.length,
        subjects: s.length,
        active: all.filter((x: { status?: string }) => x.status === 'active' || !x.status).length,
        inactive: all.filter((x: { status?: string }) => x.status === 'inactive').length
      });
    } catch {
      // Stats fail silently — keep whatever was there or default to zeros
      setStats({ gradeLevels: 0, subjects: 0, active: 0, inactive: 0 });
    }
  }, [activeTab, searchTerm, sortField, sortDirection, currentPage, itemsPerPage]);

  useEffect(() => {
    // eslint-disable-next-line
    fetchData();
  }, [fetchData]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchData();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, currentPage, fetchData]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const openModal = (record?: CategoryRecord) => {
    if (record) {
      setSelectedRecord(record);
      setFormData({
        name: record.name || '',
        description: record.description || '',
        code: record.code || '',
        grade_level: record.grade_level || '',
        status: record.status || 'active'
      });
    } else {
      setSelectedRecord(null);
      setFormData({ name: '', description: '', code: '', grade_level: '', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const saveRecord = async () => {
    setIsSubmitting(true);
    try {
      let endpoint = '/api/admin/grade-levels';
      if (activeTab === 'subjects') endpoint = '/api/admin/subjects';
      if (activeTab === 'sections') endpoint = '/api/admin/sections';

      let payload: Record<string, string> = { name: formData.name, code: formData.code, status: formData.status };
      if (activeTab === 'grade_levels') {
        payload = { ...payload, description: formData.description };
      } else if (activeTab === 'sections') {
        payload = { ...payload, description: formData.description, grade_level: formData.grade_level };
      }
        
      if (selectedRecord) {
        await api.put(`${endpoint}/${selectedRecord.id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      setIsModalOpen(false);
      fetchData();
      
      const itemName = activeTab === 'grade_levels' ? 'Grade level' : (activeTab === 'sections' ? 'Section' : 'Subject');
      localStorage.setItem('toast_message', `${itemName} saved successfully!`);
      window.dispatchEvent(new Event('toast-trigger'));
    } catch (err) {
      console.error('Error saving record:', (err as Error)?.message || err);
      localStorage.setItem('toast_message', 'Failed to save record. Ensure the name/code is unique.');
      window.dispatchEvent(new Event('toast-trigger'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRecord = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      let endpoint = '/api/admin/grade-levels';
      if (activeTab === 'subjects') endpoint = '/api/admin/subjects';
      if (activeTab === 'sections') endpoint = '/api/admin/sections';

      await api.delete(`${endpoint}/${selectedRecord.id}`);
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error deleting record:', (err as Error)?.message || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-8 bg-[#f8f9fa] dark:bg-[#0a0a0a] min-h-screen font-sans">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#161920] p-6 rounded-[1rem] border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20">
              <GraduationCap className="w-6 h-6 text-[#7a1315] dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">
                Category Level Management
              </h1>
              <p className="text-[14.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Manage grade levels and subjects seamlessly.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => openModal()}
            className="bg-[#7a1315] hover:bg-[#5a0d0f] text-white shadow-sm font-semibold h-[42px] px-6 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab === 'grade_levels' ? 'Grade Level' : (activeTab === 'sections' ? 'Section' : 'Subject')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#161920] p-5 rounded-[1rem] border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <Layers className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{stats.gradeLevels}</div>
              <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Grade Levels</div>
              <div className="text-[11px] text-slate-400 font-medium">Total grade levels</div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#161920] p-5 rounded-[1rem] border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{stats.subjects}</div>
              <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Subjects</div>
              <div className="text-[11px] text-slate-400 font-medium">Total subjects</div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#161920] p-5 rounded-[1rem] border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{stats.active}</div>
              <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Active Levels</div>
              <div className="text-[11px] text-slate-400 font-medium">Currently active</div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#161920] p-5 rounded-[1rem] border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
              <Archive className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{stats.inactive}</div>
              <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Inactive Levels</div>
              <div className="text-[11px] text-slate-400 font-medium">Archived</div>
            </div>
          </div>
        </div>

        {/* Data Container */}
        <div className="bg-white dark:bg-[#161920] rounded-[1rem] shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col flex-1">
          
          {/* Tabs & Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-white/5 gap-4">
            
            {/* Custom Tabs */}
            <div className="flex gap-6">
              <button
                onClick={() => { setActiveTab('grade_levels'); setCurrentPage(1); setSearchTerm(''); }}
                className={`flex items-center gap-2 pb-4 pt-1 text-[14.5px] font-bold transition-all relative ${
                  activeTab === 'grade_levels' 
                    ? 'text-[#7a1315] dark:text-red-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Grade Levels
                {activeTab === 'grade_levels' && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#7a1315] dark:bg-red-400"></div>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('subjects'); setCurrentPage(1); setSearchTerm(''); }}
                className={`flex items-center gap-2 pb-4 pt-1 text-[14.5px] font-bold transition-all relative ${
                  activeTab === 'subjects' 
                    ? 'text-[#7a1315] dark:text-red-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Subjects
                {activeTab === 'subjects' && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#7a1315] dark:bg-red-400"></div>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('sections'); setCurrentPage(1); setSearchTerm(''); }}
                className={`flex items-center gap-2 pb-4 pt-1 text-[14.5px] font-bold transition-all relative ${
                  activeTab === 'sections' 
                    ? 'text-[#7a1315] dark:text-red-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Sections
                {activeTab === 'sections' && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#7a1315] dark:bg-red-400"></div>
                )}
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-[320px] group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#7a1315] transition-colors" />
                <Input 
                  placeholder="Search records by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-white dark:bg-[#0f1115] border-slate-200 dark:border-white/10 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-[#7a1315] focus-visible:border-[#7a1315] transition-all"
                />
              </div>
              <Button variant="outline" className="h-10 px-4 gap-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-semibold rounded-lg shrink-0">
                <Filter className="w-4 h-4" /> Filters
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 shrink-0 rounded-lg">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-transparent">
                {activeTab === 'grade_levels' && (
                  <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-white/5">
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 pl-6 w-[80px] text-[13px]">#</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 cursor-pointer text-[13px]" onClick={() => handleSort('name')}>
                      Grade Level Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 cursor-pointer text-[13px]" onClick={() => handleSort('description')}>
                      Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 w-[120px] text-[13px]">Status</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 pr-6 w-[120px] text-[13px]">Actions</TableHead>
                  </TableRow>
                )}
                {activeTab === 'subjects' && (
                  <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-white/5">
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 pl-6 w-[80px] text-[13px]">#</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 w-[140px] text-[13px]">Subject Code</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 cursor-pointer text-[13px]" onClick={() => handleSort('name')}>
                      Subject Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 w-[120px] text-[13px]">Status</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 pr-6 w-[120px] text-[13px]">Actions</TableHead>
                  </TableRow>
                )}
                {activeTab === 'sections' && (
                  <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-white/5">
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 pl-6 w-[80px] text-[13px]">#</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 cursor-pointer text-[13px]" onClick={() => handleSort('name')}>
                      Section Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 cursor-pointer text-[13px]" onClick={() => handleSort('description')}>
                      Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 w-[140px] text-[13px]">Grade Level</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 w-[120px] text-[13px]">Status</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white py-4 pr-6 w-[120px] text-[13px]">Actions</TableHead>
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === 'sections' ? 6 : 5} className="h-[300px] text-center">
                      <LoadingAnimation message="Loading records..." />
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === 'sections' ? 6 : 5} className="h-[300px] text-center border-b-0">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative mb-6 mt-2">
                           <div className="absolute inset-0 bg-slate-100/50 dark:bg-white/5 rounded-full blur-2xl transform scale-125"></div>
                           <div className="relative z-10">
                              <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 90 Q 25 80 40 85 T 60 90" stroke="#f1f5f9" strokeWidth="10" strokeLinecap="round" />
                                <rect x="40" y="20" width="46" height="60" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2.5"/>
                                <circle cx="75" cy="75" r="14" fill="white" stroke="#7a1315" strokeWidth="3.5"/>
                                <path d="M85 85L98 98" stroke="#7a1315" strokeWidth="4.5" strokeLinecap="round"/>
                              </svg>
                           </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No records found</h3>
                        <p className="text-slate-500 text-sm font-medium">We couldn&apos;t find any {activeTab === 'grade_levels' ? 'grade levels' : activeTab === 'subjects' ? 'subjects' : 'sections'}.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => {
                    return (
                      <TableRow key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 h-[64px]">
                        {activeTab === 'grade_levels' && (
                          <>
                            <TableCell className="font-medium text-slate-500 py-3 pl-6 text-[14px]">#{record.id}</TableCell>
                            <TableCell className="font-bold text-slate-900 dark:text-white py-3 text-[14px]">{record.name}</TableCell>
                            <TableCell className="text-slate-500 dark:text-slate-400 py-3 text-[14px]">{record.description || '-'}</TableCell>
                          </>
                        )}
                        {activeTab === 'subjects' && (
                          <>
                            <TableCell className="font-medium text-slate-500 py-3 pl-6 text-[14px]">#{record.id}</TableCell>
                            <TableCell className="font-semibold text-blue-600 dark:text-blue-400 py-3 text-[14px]">{record.code || '-'}</TableCell>
                            <TableCell className="font-bold text-slate-900 dark:text-white py-3 text-[14px]">{record.name}</TableCell>
                          </>
                        )}
                        {activeTab === 'sections' && (
                          <>
                            <TableCell className="font-medium text-slate-500 py-3 pl-6 text-[14px]">#{record.id}</TableCell>
                            <TableCell className="font-bold text-slate-900 dark:text-white py-3 text-[14px]">{record.name}</TableCell>
                            <TableCell className="text-slate-500 dark:text-slate-400 py-3 text-[14px]">{record.description || '-'}</TableCell>
                            <TableCell className="font-semibold text-slate-600 dark:text-slate-300 py-3 text-[14px]">{record.grade_level || '-'}</TableCell>
                          </>
                        )}

                        <TableCell className="py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-bold ${
                            record.status === 'inactive' 
                              ? 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' 
                              : 'bg-[#ecfccb] text-[#4d7c0f] dark:bg-green-500/10 dark:text-green-500'
                          }`}>
                            {record.status === 'inactive' ? 'Inactive' : 'Active'}
                          </span>
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex items-center gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openModal(record)}
                              className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg border border-transparent hover:border-blue-100 transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => { setSelectedRecord(record); setIsDeleteModalOpen(true); }}
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-100 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-all"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && records.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-transparent mt-auto">
              <div className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, (currentPage * itemsPerPage) + records.length - itemsPerPage)} of {totalPages * itemsPerPage} results
              </div>
              <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <div className="flex items-center gap-2">
                  <select className="bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-md text-[13px] font-medium text-slate-600 h-8 px-2 focus:outline-none">
                    <option>10 per page</option>
                    <option>20 per page</option>
                    <option>50 per page</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="icon"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="h-8 w-8 rounded-md border-slate-200 dark:border-white/10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="default" className="h-8 w-8 rounded-md bg-[#7a1315] hover:bg-[#5a0d0f] text-white p-0 text-[13px] font-bold">
                    {currentPage}
                  </Button>
                  {currentPage < totalPages && (
                    <Button variant="outline" onClick={() => setCurrentPage(currentPage + 1)} className="h-8 w-8 rounded-md border-slate-200 dark:border-white/10 p-0 text-[13px] font-bold text-slate-600">
                      {currentPage + 1}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="icon"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="h-8 w-8 rounded-md border-slate-200 dark:border-white/10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 rounded-2xl bg-white dark:bg-[#161920] border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
          <DialogHeader className="mb-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {selectedRecord ? 'Edit' : 'Add'} {activeTab === 'grade_levels' ? 'Grade Level' : (activeTab === 'sections' ? 'Section' : 'Subject')}
            </h2>
            <p className="text-sm text-slate-500">
              {selectedRecord 
                ? `Update the details of this ${activeTab === 'grade_levels' ? 'grade level' : (activeTab === 'sections' ? 'section' : 'subject')}.` 
                : `Create a new ${activeTab === 'grade_levels' ? 'grade level' : (activeTab === 'sections' ? 'section' : 'subject')} record.`}
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={activeTab === 'grade_levels' ? 'e.g., Grade 1' : (activeTab === 'sections' ? 'e.g., Section A' : 'e.g., Mathematics')}
                className="h-11 bg-slate-50 dark:bg-white/5 border-slate-200"
              />
            </div>
            
            {activeTab !== 'sections' && (
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Code</label>
                <Input 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder={activeTab === 'grade_levels' ? 'e.g., G1' : 'e.g., MATH'}
                  className="h-11 bg-slate-50 dark:bg-white/5 border-slate-200"
                />
              </div>
            )}
            
            {activeTab === 'grade_levels' && (
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <Input 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="h-11 bg-slate-50 dark:bg-white/5 border-slate-200"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="flex h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="h-11 px-6 rounded-xl font-semibold border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveRecord} 
              disabled={isSubmitting || !formData.name} 
              className="h-11 px-6 rounded-xl font-semibold bg-[#7a1315] hover:bg-[#5a0d0f] text-white shadow-sm transition-all"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">{selectedRecord?.name}</span>? 
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button onClick={deleteRecord} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
