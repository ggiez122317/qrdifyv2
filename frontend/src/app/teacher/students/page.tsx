'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  GraduationCap,
  BookOpen,
  Phone,
  Hash,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getImageUrl } from '@/lib/utils';

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
  subjects: {
    id: number;
    name: string;
  }[];
}

interface Option {
  id: number;
  name: string;
  grade_level?: string;
  code?: string;
}

export default function ManageStudentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    id_number: '',
    grade: '',
    section_id: '',
    parent_name: '',
    parent_phone: '',
    subjects: [] as number[],
  });

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: async () => {
      const response = await api.get('/api/teacher/students');
      return response.data as Student[];
    },
  });

  const { data: options } = useQuery({
    queryKey: ['teacher-students-options'],
    queryFn: async () => {
      const response = await api.get('/api/teacher/students/options');
      return response.data as { sections: Option[], subjects: Option[] };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingStudent) {
        return api.put(`/api/teacher/students/${editingStudent.id}`, data);
      } else {
        return api.post('/api/teacher/students', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      closeModal();
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

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        email: student.email,
        id_number: student.id_number || '',
        grade: student.student_profile?.grade || '',
        section_id: student.student_profile?.section?.id.toString() || '',
        parent_name: student.student_profile?.parent_name || '',
        parent_phone: student.student_profile?.parent_phone || '',
        subjects: student.subjects ? student.subjects.map((s) => s.id) : [],
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        email: '',
        id_number: '',
        grade: '',
        section_id: '',
        parent_name: '',
        parent_phone: '',
        subjects: [],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const toggleSubject = (subjectId: number) => {
    setFormData((prev) => {
      const isSelected = prev.subjects.includes(subjectId);
      if (isSelected) {
        return { ...prev, subjects: prev.subjects.filter((id) => id !== subjectId) };
      } else {
        return { ...prev, subjects: [...prev.subjects, subjectId] };
      }
    });
  };

  // Filter students based on search term, grade, and subject
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

    // Subject Filter
    const matchesSubject = filterSubject === '' || 
      (student.subjects && student.subjects.some((s) => s.id.toString() === filterSubject));

    return matchesSearch && matchesGrade && matchesSubject;
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
          <p className="text-slate-500">Add, edit, and assign students to sections and subjects.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Student
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
              />
            </div>
            <select
              value={filterGrade}
              onChange={(e) => {
                setFilterGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm min-w-[120px]"
            >
              <option value="">All Grades</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
            <select
              value={filterSubject}
              onChange={(e) => {
                setFilterSubject(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm min-w-[140px]"
            >
              <option value="">All Subjects</option>
              {options?.subjects?.map((sub) => (
                <option key={sub.id} value={sub.id.toString()}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-slate-500 font-medium shrink-0">
            Total: <span className="text-slate-900 font-bold">{filteredStudents.length}</span> students
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">ID Number</th>
                <th className="px-6 py-4">Grade & Section</th>
                <th className="px-6 py-4">Subjects Assigned</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingStudents ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Loading students...
                    </div>
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <User className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="text-slate-600 font-medium">No students found.</p>
                      <p className="text-sm">Try adjusting your search or add a new student.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {student.photo_url ? (
                          <img 
                            src={getImageUrl(student.photo_url)} 
                            alt={student.name} 
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{student.name}</div>
                          <div className="text-sm text-slate-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium font-mono">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        {student.id_number || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {student.student_profile?.section ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">
                            {student.student_profile.grade}
                          </span>
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            {student.student_profile.section.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-sm">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                        {student.subjects && student.subjects.length > 0 ? (
                          student.subjects.map((sub) => (
                            <span key={sub.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[11px] font-semibold">
                              {sub.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(student)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id, student.name)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of{' '}
              <span className="font-medium text-slate-900">{filteredStudents.length}</span> results
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === i + 1 
                      ? 'bg-red-700 text-white' 
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-red-600" />
                  {editingStudent ? 'Edit Student Details' : 'Add New Student'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Fill in the student&apos;s information and assign them to a section or subjects.
                </p>
              </div>

              {saveMutation.isError && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>Failed to save student. Please check all fields and try again.</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="Juan Dela Cruz"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="juan@student.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ID Number (Optional)</label>
                      <input
                        type="text"
                        value={formData.id_number}
                        onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-sm"
                        placeholder="STU-2026-001"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Assigments */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2 flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    Academic Assignment
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Grade Level *</label>
                      <select
                        required
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      >
                        <option value="">Select Grade</option>
                        <option value="Grade 7">Grade 7</option>
                        <option value="Grade 8">Grade 8</option>
                        <option value="Grade 9">Grade 9</option>
                        <option value="Grade 10">Grade 10</option>
                        <option value="Grade 11">Grade 11</option>
                        <option value="Grade 12">Grade 12</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Section (Advisory) *</label>
                      <select
                        required
                        value={formData.section_id}
                        onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      >
                        <option value="">Select Section</option>
                        {options?.sections?.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name} {section.grade_level ? `(${section.grade_level})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Assign Subjects (Optional)</label>
                    <p className="text-xs text-slate-500 mb-3">Select the subjects you teach this student.</p>
                    <div className="flex flex-wrap gap-2">
                      {options?.subjects?.map((subject) => {
                        const isSelected = formData.subjects.includes(subject.id);
                        return (
                          <button
                            key={subject.id}
                            type="button"
                            onClick={() => toggleSubject(subject.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            {subject.name}
                          </button>
                        );
                      })}
                      {(!options?.subjects || options.subjects.length === 0) && (
                        <p className="text-sm text-slate-400 italic">No subjects available in the system yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Parent / Guardian */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2 flex items-center gap-1">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    Parent / Guardian Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Parent Name</label>
                      <input
                        type="text"
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="Maria Dela Cruz"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                      <input
                        type="text"
                        value={formData.parent_phone}
                        onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="09123456789"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  disabled={saveMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {saveMutation.isPending && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {editingStudent ? 'Save Changes' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
