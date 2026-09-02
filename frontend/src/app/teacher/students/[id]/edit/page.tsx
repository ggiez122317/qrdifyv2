'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoUploader } from '@/components/ui/PhotoUploader';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    lrn: '',
    grade_level: '',
    section_id: '',
    parent_name: '',
    parent_phone: '',
    photo_base64: '',
    subjects: [] as number[]
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { data: options } = useQuery({
    queryKey: ['teacher-students-options'],
    queryFn: async () => {
      const response = await api.get('/api/teacher/students/options');
      return response.data;
    },
  });

  useEffect(() => {
    if (!id) return;
    const fetchStudent = async () => {
      try {
        const res = await api.get(`/api/teacher/students/${id}`);
        if (res.data) {
          const data = res.data;
          const parts = data.name ? data.name.split(' ') : [];
          setFormData({
            first_name: parts[0] || '',
            last_name: parts.slice(1).join(' ') || '',
            email: data.email || '',
            lrn: data.id_number || data.lrn || '',
            grade_level: data.student_profile?.grade || '',
            section_id: data.student_profile?.section_id?.toString() || data.student_profile?.section?.id?.toString() || '',
            parent_name: data.student_profile?.parent_name || '',
            parent_phone: data.student_profile?.parent_phone || '',
            photo_base64: '',
            subjects: data.subjects ? data.subjects.map((s: { id: number }) => s.id) : []
          });
          setPhotoUrl(data.photo_url || null);
        }
      } catch (err) {
        console.error('Failed to fetch student:', err);
      }
    };
    fetchStudent();
  }, [id]);

  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await api.put(`/api/teacher/students/${id}`, formData);
      localStorage.setItem('toast_message', 'Student record updated successfully');
      router.push('/teacher/students');
    } catch (error) {
      console.error('API Error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      localStorage.setItem('toast_message', 'Failed to save: ' + (err.response?.data?.message || 'Network error'));
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
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Student Record</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Update the student&apos;s record.</p>
            </div>
          </div>
  
          {/* Form Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-8 w-full">
              
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="first_name" className="text-sm font-semibold">First Name <span className="text-red-500">*</span></Label>
                    <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="e.g. Juan" className="bg-slate-50 h-12 text-base" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="last_name" className="text-sm font-semibold">Last Name <span className="text-red-500">*</span></Label>
                    <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="e.g. Dela Cruz" className="bg-slate-50 h-12 text-base" />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="email" className="text-sm font-semibold">Email Address <span className="text-red-500">*</span></Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="student@school.edu" className="bg-slate-50 h-12 text-base" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Academic Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="lrn" className="text-sm font-semibold">Learner Reference Number (LRN) <span className="text-red-500">*</span></Label>
                    <Input id="lrn" name="lrn" value={formData.lrn} onChange={handleChange} required placeholder="12-digit LRN" className="bg-slate-50 h-12 text-base" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="grade_level" className="text-sm font-semibold dark:text-slate-300">Grade Level <span className="text-red-500">*</span></Label>
                    <select
                      id="grade_level"
                      name="grade_level"
                      value={formData.grade_level}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
                     
                      required
                      className="flex h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#7a1315]/20 focus:border-[#7a1315]/30 dark:border-white/10 dark:bg-[#0f1115] dark:text-white"
                    >
                      <option value="">Select Grade</option>
                      {options?.grade_levels?.map((gl: { id: number; name: string }) => (
                        <option key={gl.id} value={gl.name}>{gl.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="section_id" className="text-sm font-semibold dark:text-slate-300">Section <span className="text-red-500">*</span></Label>
                    <select
                      id="section_id"
                      name="section_id"
                      value={formData.section_id}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
                     
                      required
                      className="flex h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#7a1315]/20 focus:border-[#7a1315]/30 dark:border-white/10 dark:bg-[#0f1115] dark:text-white"
                    >
                      <option value="">Select Section</option>
                      {options?.sections?.map((section: { id: number, name: string, grade_level?: string }) => (
                        <option key={section.id} value={section.id}>
                          {section.name} {section.grade_level ? `(${section.grade_level})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 md:col-span-2 mt-2">
                    <Label className="text-sm font-semibold dark:text-slate-300">Assign Subjects (Optional)</Label>
                    <p className="text-xs text-slate-500 mb-2">Select the subjects you teach this student.</p>
                    <div className="flex flex-wrap gap-2">
                      {options?.subjects?.map((subject: { id: number, name: string }) => {
                        const isSelected = formData.subjects.includes(subject.id);
                        return (
                          <button
                            key={subject.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                subjects: isSelected 
                                  ? prev.subjects.filter(id => id !== subject.id)
                                  : [...prev.subjects, subject.id]
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:bg-[#161920] dark:border-white/10 dark:text-slate-300'
                            }`}
                          >
                            {subject.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Emergency Contact (Parent/Guardian)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="parent_name" className="text-sm font-semibold">Guardian Name</Label>
                    <Input id="parent_name" name="parent_name" value={formData.parent_name} onChange={handleChange} placeholder="Full Name" className="bg-slate-50 h-12 text-base" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="parent_phone" className="text-sm font-semibold">Guardian Phone</Label>
                    <Input id="parent_phone" name="parent_phone" value={formData.parent_phone} onChange={handleChange} placeholder="09XXXXXXXXX" className="bg-slate-50 h-12 text-base" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Profile Photo</h3>
                <PhotoUploader 
                  onCapture={(base64) => setFormData(prev => ({ ...prev, photo_base64: base64 }))} 
                  currentPhoto={formData.photo_base64 || photoUrl} 
                />
              </div>
              
              <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/5 mt-8">
                <Link href="/teacher/students">
                  <Button type="button" variant="outline" className="text-slate-600 h-12 px-6">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="bg-[#0B3A82] hover:bg-[#092f69] text-white shadow-sm font-bold text-base h-12 px-10 min-w-[240px]">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
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
