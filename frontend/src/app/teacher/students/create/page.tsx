'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoUploader } from '@/components/ui/PhotoUploader';
import { ChevronLeft, GraduationCap, Loader2, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function CreateStudentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    lrn: '',
    parent_name: '',
    parent_phone: '',
    photo_base64: ''
  });
  
  const { data: options } = useQuery({
    queryKey: ['teacher-students-options'],
    queryFn: async () => {
      const response = await api.get('/api/teacher/students/options');
      return response.data;
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const assignment = options?.teacher_assignment as {
    grade_level?: string | null;
    section_id?: number | null;
    section_name?: string | null;
  } | undefined;
  const hasAcademicAssignment = Boolean(assignment?.grade_level && assignment?.section_id);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await api.post('/api/teacher/students', formData);
      const createdStudent = { ...response.data.student, subjects: response.data.student.subjects ?? [] };

      queryClient.setQueryData<unknown[]>(['teacher-students'], current => [
        createdStudent,
        ...(current ?? []).filter((student: unknown) => (
          typeof student !== 'object' || student === null || !('id' in student) || student.id !== createdStudent.id
        )),
      ]);
      await queryClient.invalidateQueries({ queryKey: ['teacher-students'], refetchType: 'none' });
      localStorage.setItem('toast_message', 'Student record created successfully');
      router.push('/teacher/students');
      router.refresh();
    } catch (error) {
      console.error('API Error:', error);
      localStorage.setItem('toast_message', error instanceof Error ? error.message : 'Failed to save student');
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row gap-8 pb-12 pt-6">
        
        {/* Left Side: Header and Form */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6 shrink-0">
            <Link href="/teacher/students" className="p-2 bg-white dark:bg-[#161920] border border-slate-200 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm text-slate-500 dark:text-slate-400">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Add New Student</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Create a new student record.</p>
            </div>
          </div>
  
          {/* Form Area */}
          <div className="flex-1 bg-white dark:bg-[#161920] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 p-8">
            <form onSubmit={handleSubmit} className="space-y-8 w-full">
              
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="first_name" className="text-sm font-semibold dark:text-slate-300">First Name <span className="text-red-500">*</span></Label>
                    <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="e.g. Juan" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="last_name" className="text-sm font-semibold dark:text-slate-300">Last Name <span className="text-red-500">*</span></Label>
                    <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="e.g. Dela Cruz" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="email" className="text-sm font-semibold dark:text-slate-300">Email Address <span className="text-red-500">*</span></Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="student@school.edu" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">Academic Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="lrn" className="text-sm font-semibold dark:text-slate-300">Learner Reference Number (LRN) <span className="text-red-500">*</span></Label>
                    <Input id="lrn" name="lrn" value={formData.lrn} onChange={handleChange} required placeholder="12-digit LRN" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label className="text-sm font-semibold dark:text-slate-300">Grade Level &amp; Section</Label>
                    {hasAcademicAssignment ? (
                      <div className="flex min-h-16 items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                        <GraduationCap aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-700 dark:text-blue-300" />
                        <div>
                          <p className="font-bold">{assignment?.grade_level} — {assignment?.section_name}</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">Automatically applied from Account Settings</p>
                        </div>
                      </div>
                    ) : (
                      <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                        <div>
                          <p className="font-bold">Academic assignment required</p>
                          <p className="mt-1 text-sm">Choose your grade level and section once in Account Settings.</p>
                        </div>
                        <Link href="/teacher/settings" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-900 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500">
                          <Settings aria-hidden="true" className="h-4 w-4" /> Open Settings
                        </Link>
                      </div>
                    )}
                  </div>

                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">Emergency Contact (Parent/Guardian)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="parent_name" className="text-sm font-semibold dark:text-slate-300">Guardian Name</Label>
                    <Input id="parent_name" name="parent_name" value={formData.parent_name} onChange={handleChange} placeholder="Full Name" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="parent_phone" className="text-sm font-semibold dark:text-slate-300">Guardian Phone</Label>
                    <Input id="parent_phone" name="parent_phone" value={formData.parent_phone} onChange={handleChange} placeholder="09XXXXXXXXX" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">Profile Photo</h3>
                <PhotoUploader 
                  onCapture={(base64) => setFormData(prev => ({ ...prev, photo_base64: base64 }))} 
                  currentPhoto={formData.photo_base64} 
                />
              </div>
              
              <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/5 mt-8">
                <Link href="/teacher/students">
                  <Button type="button" variant="outline" className="text-slate-600 dark:text-slate-300 dark:border-white/10 dark:hover:bg-white/5 h-12 px-6">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting || !hasAcademicAssignment} className="bg-[#0B3A82] hover:bg-[#092f69] text-white shadow-sm font-bold text-base h-12 px-10 min-w-[240px] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Student Record'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
