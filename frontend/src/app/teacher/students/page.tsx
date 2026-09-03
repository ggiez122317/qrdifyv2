'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Hash,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getImageUrl } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import Link from 'next/link';

interface Student {
  id: number;
  name: string;
  email: string;
  photo_url?: string;
  id_number: string | null;
  student_profile: {
    grade: string;
    parent_name: string | null;
    parent_phone: string | null;
    section: {
      id: number;
      name: string;
      grade_level: string;
    } | null;
  } | null;
}

export default function ManageStudentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');


  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: async () => {
      const response = await api.get('/api/teacher/students');
      return response.data as Student[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/api/teacher/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
    },
  });

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  // Filter students based on search term and grade.
  const filteredStudents = students.filter((student) => {
    // Search Term Filter
    const term = searchTerm.toLowerCase();
    const matchesSearch = term === '' || 
      student.name.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      (student.id_number && student.id_number.toLowerCase().includes(term)) ||
      (student.student_profile?.section?.name?.toLowerCase().includes(term));

    // Grade Filter
    const matchesGrade = filterGrade === '' || student.student_profile?.grade === filterGrade;

    return matchesSearch && matchesGrade;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Students</h1>
          <p className="text-slate-500">Add and manage students using your saved academic assignment.</p>
        </div>
        <Link
          href="/teacher/students/create"
          className="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Student
        </Link>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-1 max-w-[600px] w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-11 h-[46px] bg-white border-slate-200 rounded-xl text-[15px] focus:ring-1 focus:ring-slate-300 w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <CustomSelect
                value={filterGrade}
                onChange={(val) => {
                  setFilterGrade(val === 'all' ? '' : val);
                  setCurrentPage(1);
                }}
                icon={<Filter className="w-4 h-4 text-slate-400" />}
                options={[
                  { value: 'all', label: 'All Grades' },
                  { value: 'Grade 7', label: 'Grade 7' },
                  { value: 'Grade 8', label: 'Grade 8' },
                  { value: 'Grade 9', label: 'Grade 9' },
                  { value: 'Grade 10', label: 'Grade 10' },
                  { value: 'Grade 11', label: 'Grade 11' },
                  { value: 'Grade 12', label: 'Grade 12' },
                ]}
              />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead className="text-[11px] text-[#94a3b8] uppercase font-bold tracking-wider border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5">STUDENT</th>
                  <th className="px-8 py-5">ID NUMBER</th>
                  <th className="px-8 py-5">GRADE & SECTION</th>
                  <th className="px-8 py-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
              {isLoadingStudents ? (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Users className="w-12 h-12 mb-4 opacity-20" />
                      <h3 className="text-lg font-bold text-slate-700">No students found</h3>
                      <p className="text-sm mt-1">Try adjusting your search or add a new student.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[15px] bg-slate-100 text-slate-600">
                            {student.photo_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img 
                                src={getImageUrl(student.photo_url)} 
                                alt={student.name} 
                                className="w-full h-full rounded-full object-cover border border-slate-200" 
                              />
                            ) : student.name.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2)}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-[#0f172a] text-[14.5px]">{student.name}</div>
                          <div className="text-[13px] text-slate-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-slate-500">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium font-mono border border-slate-200">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        {student.id_number || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      {student.student_profile?.section ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0f172a] text-[14.5px]">
                            {student.student_profile.grade}
                          </span>
                          <span className="text-[13px] text-slate-500 flex items-center gap-1">
                            {student.student_profile.section.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[13px]">Not assigned</span>
                      )}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/teacher/students/${student.id}/edit`}>
                          <Button
                            variant="outline"
                            className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(student.id, student.name)}
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-white">
          <span className="text-[14px] text-slate-500 font-medium">
            Showing {filteredStudents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} results
          </span>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-400 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button className="w-9 h-9 p-0 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700">
              {currentPage}
            </Button>
            <Button 
              variant="outline" 
              className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-400 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

      </div>
    </DashboardLayout>
  );
}
