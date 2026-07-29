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
  ClipboardList
} from 'lucide-react';
import { LoadingAnimation } from '@/components/ui/TableLoadingState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export interface CategoryRecord {
  id: number | string;
  name: string;
  description?: string; // For Grade Levels
  code?: string; // For Subjects
  created_at?: string;
}

export default function CategoryLevelPage() {
  const [activeTab, setActiveTab] = useState<'grade_levels' | 'subjects'>('grade_levels');
  const [records, setRecords] = useState<CategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CategoryRecord | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', description: '', code: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'grade_levels' ? '/api/admin/grade-levels' : '/api/admin/subjects';
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
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
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
        code: record.code || ''
      });
    } else {
      setSelectedRecord(null);
      setFormData({ name: '', description: '', code: '' });
    }
    setIsModalOpen(true);
  };

  const saveRecord = async () => {
    setIsSubmitting(true);
    try {
      const endpoint = activeTab === 'grade_levels' ? '/api/admin/grade-levels' : '/api/admin/subjects';
      const payload = activeTab === 'grade_levels' 
        ? { name: formData.name, description: formData.description }
        : { name: formData.name, code: formData.code };
        
      if (selectedRecord) {
        await api.put(`${endpoint}/${selectedRecord.id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving record:', err);
      alert('Failed to save record. Ensure the name/code is unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRecord = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      const endpoint = activeTab === 'grade_levels' ? '/api/admin/grade-levels' : '/api/admin/subjects';
      await api.delete(`${endpoint}/${selectedRecord.id}`);
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error deleting record:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-8 bg-[#f8f9fa] dark:bg-[#0a0a0a] min-h-screen">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#161920] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-maroon-50 dark:bg-maroon-500/10 flex items-center justify-center border border-maroon-100 dark:border-maroon-500/20">
              <ClipboardList className="w-6 h-6 text-maroon-600 dark:text-maroon-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Category Level Management
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Manage Grade Levels and Subjects seamlessly.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => openModal()}
            className="bg-maroon-600 hover:bg-maroon-700 text-white shadow-sm font-semibold h-11 px-6 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab === 'grade_levels' ? 'Grade Level' : 'Subject'}
          </Button>
        </div>

        {/* Tabs & Controls */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mt-2">
          
          {/* Custom Tabs */}
          <div className="flex bg-white dark:bg-[#161920] p-1.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm inline-flex">
            <button
              onClick={() => { setActiveTab('grade_levels'); setCurrentPage(1); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'grade_levels' 
                  ? 'bg-slate-100 dark:bg-white/10 text-maroon-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              Grade Levels
            </button>
            <button
              onClick={() => { setActiveTab('subjects'); setCurrentPage(1); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'subjects' 
                  ? 'bg-slate-100 dark:bg-white/10 text-maroon-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Subjects
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-[360px] group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-maroon-600 transition-colors" />
            <Input 
              placeholder={`Search ${activeTab === 'grade_levels' ? 'grade levels' : 'subjects'} by name or code...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white dark:bg-[#161920] border-slate-200 dark:border-white/10 rounded-xl focus-visible:ring-1 focus-visible:ring-maroon-600 focus-visible:border-maroon-600 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-[#161920] rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-white/5 overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-transparent border-b border-slate-100 dark:border-white/5">
                <TableRow className="hover:bg-transparent border-b-0">
                  <TableHead className="font-black text-slate-900 dark:text-white py-6 pl-8 w-[100px]">ID</TableHead>
                  <TableHead className="font-black text-slate-900 dark:text-white py-6 cursor-pointer" onClick={() => handleSort('name')}>
                    Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  
                  {activeTab === 'grade_levels' ? (
                    <TableHead className="font-black text-slate-900 dark:text-white py-6 cursor-pointer" onClick={() => handleSort('description')}>
                      Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                  ) : (
                    <TableHead className="font-black text-slate-900 dark:text-white py-6 cursor-pointer" onClick={() => handleSort('code')}>
                      Code {sortField === 'code' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                  )}
                  
                  <TableHead className="font-black text-slate-900 dark:text-white py-6 text-right pr-8 w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-[400px] text-center">
                      <LoadingAnimation message="Loading records..." />
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-[400px] text-center border-b-0">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative mb-8 mt-4">
                           <div className="absolute inset-0 bg-slate-100/50 dark:bg-white/5 rounded-full blur-3xl transform scale-150"></div>
                           <div className="relative z-10">
                              <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 90 Q 25 80 40 85 T 60 90" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
                                <rect x="40" y="20" width="46" height="60" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2.5"/>
                                <circle cx="75" cy="75" r="14" fill="white" stroke="#7a1315" strokeWidth="3.5"/>
                                <path d="M85 85L98 98" stroke="#7a1315" strokeWidth="4.5" strokeLinecap="round"/>
                              </svg>
                           </div>
                        </div>
                        <h3 className="text-[22px] font-bold text-slate-900 dark:text-white mb-2.5">No records found</h3>
                        <p className="text-slate-500 text-[15px] mb-8 font-medium">We couldn&apos;t find any {activeTab === 'grade_levels' ? 'grade levels' : 'subjects'} matching your criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5">
                      <TableCell className="font-bold text-slate-500 dark:text-slate-400 pl-8">#{record.id}</TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">{record.name}</TableCell>
                      <TableCell className="font-medium text-slate-600 dark:text-slate-400">
                        {activeTab === 'grade_levels' ? record.description || '-' : record.code || '-'}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openModal(record)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setSelectedRecord(record); setIsDeleteModalOpen(true); }}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && records.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-white/5">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="h-9 px-4 font-semibold"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="h-9 px-4 font-semibold"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedRecord ? 'Edit' : 'Add'} {activeTab === 'grade_levels' ? 'Grade Level' : 'Subject'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={activeTab === 'grade_levels' ? 'e.g. Grade 1' : 'e.g. Mathematics'}
              />
            </div>
            {activeTab === 'grade_levels' ? (
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. First Grade"
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="code">Subject Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. MATH101"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={saveRecord} disabled={isSubmitting || !formData.name} className="bg-maroon-600 hover:bg-maroon-700 text-white">
              {isSubmitting ? 'Saving...' : 'Save'}
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
