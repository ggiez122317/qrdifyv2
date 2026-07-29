'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IdCardPreview } from '@/components/ui/id-card';
import { PhotoUploader } from '@/components/ui/PhotoUploader';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

interface Teacher {
  id: number;
  name: string;
  photo_url?: string;
  teacher_profile?: {
    position?: string;
    subject?: string;
  };
}

export default function CreateStudentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    lrn: '132019240057',
    grade_level: '',
    section: '',
    parent_name: '',
    parent_phone: '',
    photo_base64: '',
    subjects: [] as number[],
    teacher_id: null as number | null
  });
  
  const [gradeLevels, setGradeLevels] = useState<{ id: number; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);

  useEffect(() => {
    api.get('/api/grade-levels').then(r => setGradeLevels(r.data));
    api.get('/api/admin/sections/list-all').then(r => setSections(r.data));
    api.get('/api/teachers').then(r => setTeachers(r.data.data || r.data));
  }, []);

  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const previewUser = {
    name: `${formData.first_name} ${formData.last_name}`.trim() || 'Juan Dela Cruz',
    email: formData.email,
    lrn: formData.lrn,
    photo_url: null as string | null,
    student_profile: {
      grade_level: formData.grade_level,
      section: formData.section,
      parent_name: formData.parent_name,
      parent_phone: formData.parent_phone
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await api.students.create(formData as Record<string, unknown>);
      localStorage.setItem('toast_message', 'Student record created successfully');
      router.push('/admin/students');
    } catch (error: any) {
      // Extract specific validation errors from Laravel 422 response
      const responseData = error?.response?.data;
      let msg = 'Failed to save student.';
      
      if (responseData?.errors) {
        // Flatten all validation field errors into a readable list
        const fieldErrors = Object.values(responseData.errors).flat() as string[];
        msg = fieldErrors.join(' ');
      } else if (responseData?.message) {
        msg = responseData.message;
      } else if (error?.message) {
        msg = error.message;
      }
      
      alert('Error: ' + msg);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row gap-8 h-[calc(100vh-6rem)]">
        
        {/* Left Side: Header and Form */}
        <div className="flex flex-col flex-1 min-w-0 h-full">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6 shrink-0">
            <Link href="/admin/students" className="p-2 bg-white dark:bg-[#161920] border border-slate-200 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm text-slate-500 dark:text-slate-400">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Add New Student</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Create a new student record and preview their ID card in real-time.</p>
            </div>
          </div>
  
          {/* Left Column: Scrollable Form */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-[#161920] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 p-8 h-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
              
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="first_name" className="text-sm font-semibold dark:text-slate-300">First Name <span className="text-red-500">*</span></Label>
                    <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} onFocus={() => setActiveSide('front')} required placeholder="e.g. Juan" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="last_name" className="text-sm font-semibold dark:text-slate-300">Last Name <span className="text-red-500">*</span></Label>
                    <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} onFocus={() => setActiveSide('front')} required placeholder="e.g. Dela Cruz" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="email" className="text-sm font-semibold dark:text-slate-300">Email Address <span className="text-red-500">*</span></Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} onFocus={() => setActiveSide('front')} required placeholder="student@school.edu" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">Academic Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="lrn" className="text-sm font-semibold dark:text-slate-300">Learner Reference Number (LRN) <span className="text-red-500">*</span></Label>
                    <Input id="lrn" name="lrn" value={formData.lrn} readOnly className="bg-slate-100 text-slate-500 cursor-not-allowed dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base font-medium" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="grade_level" className="text-sm font-semibold dark:text-slate-300">Grade Level <span className="text-red-500">*</span></Label>
                    <select
                      id="grade_level"
                      name="grade_level"
                      value={formData.grade_level}
                      onChange={handleChange}
                      onFocus={() => setActiveSide('front')}
                      required
                      className="flex h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#7a1315]/20 focus:border-[#7a1315]/30 dark:border-white/10 dark:bg-[#0f1115] dark:text-white"
                    >
                      <option value="">Select Grade Level</option>
                      {gradeLevels.map(gl => (
                        <option key={gl.id} value={gl.name}>{gl.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="section" className="text-sm font-semibold dark:text-slate-300">Section <span className="text-red-500">*</span></Label>
                    <select
                      id="section"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      onFocus={() => setActiveSide('front')}
                      required
                      className="flex h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#7a1315]/20 focus:border-[#7a1315]/30 dark:border-white/10 dark:bg-[#0f1115] dark:text-white"
                    >
                      <option value="">Select Section</option>
                      {sections.map(sec => (
                        <option key={sec.id} value={sec.name}>{sec.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 md:col-span-2 mt-2 relative">
                    <Label className="text-sm font-semibold dark:text-slate-300">Assign Subject Teacher (Optional)</Label>
                    <p className="text-xs text-slate-500 mb-2">Search and select a teacher for this student.</p>
                    <div className="relative">
                      <Input 
                        placeholder="Type teacher name..." 
                        value={teacherSearch}
                        onChange={(e) => {
                          setTeacherSearch(e.target.value);
                          setIsTeacherDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setIsTeacherDropdownOpen(true);
                          setActiveSide('front');
                        }}
                        className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base w-full"
                      />
                      {isTeacherDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-[#161920] border border-slate-200 dark:border-white/10 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                          {teachers
                            .filter(t => t.name.toLowerCase().includes(teacherSearch.toLowerCase()))
                            .map(teacher => (
                              <div 
                                key={teacher.id}
                                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-slate-100 dark:border-white/5 last:border-0"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, teacher_id: teacher.id }));
                                  setTeacherSearch(teacher.name);
                                  setIsTeacherDropdownOpen(false);
                                }}
                              >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-white/10">
                                  {teacher.photo_url ? (
                                    <img src={getImageUrl(teacher.photo_url)} alt={teacher.name} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                      {teacher.name.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-800 dark:text-white">{teacher.name}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">{teacher.teacher_profile?.subject || teacher.teacher_profile?.position || 'Subject Teacher'}</div>
                                </div>
                              </div>
                          ))}
                          {teachers.filter(t => t.name.toLowerCase().includes(teacherSearch.toLowerCase())).length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center">No teachers found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">Emergency Contact (Parent/Guardian)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="parent_name" className="text-sm font-semibold dark:text-slate-300">Guardian Name</Label>
                    <Input id="parent_name" name="parent_name" value={formData.parent_name} onChange={handleChange} onFocus={() => setActiveSide('back')} placeholder="Full Name" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="parent_phone" className="text-sm font-semibold dark:text-slate-300">Guardian Phone</Label>
                    <Input id="parent_phone" name="parent_phone" value={formData.parent_phone} onChange={handleChange} onFocus={() => setActiveSide('back')} placeholder="09XXXXXXXXX" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
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
                <Link href="/admin/students">
                  <Button type="button" variant="outline" className="text-slate-600 dark:text-slate-300 dark:border-white/10 dark:hover:bg-white/5 h-12 px-6">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="bg-maroon-600 hover:bg-maroon-700 text-white shadow-sm font-bold text-base h-12 px-10 min-w-[240px]">
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

        {/* Right Column: Fixed Preview */}
        <div className="w-[320px] xl:w-[400px] shrink-0 sticky top-0 hidden lg:flex flex-col h-full bg-transparent relative group overflow-visible">
             <div className="p-5 shrink-0 relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase text-sm">Real-time ID Preview</h3>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/10"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/10"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/10"></div>
                  </div>
                </div>
                
                <div className="flex bg-slate-100 dark:bg-[#161920] p-1 rounded-lg">
                  <button 
                    type="button"
                    onClick={() => setActiveSide('front')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeSide === 'front' ? 'bg-white dark:bg-white/10 text-maroon-600 dark:text-white shadow-sm border border-slate-200/50 dark:border-white/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    Front View
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveSide('back')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeSide === 'back' ? 'bg-white dark:bg-white/10 text-maroon-600 dark:text-white shadow-sm border border-slate-200/50 dark:border-white/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    Back View
                  </button>
                </div>
             </div>
             
             <div className="flex-1 p-6 flex flex-col items-center justify-start relative z-10 overflow-visible mt-2">
               <div className="transform scale-[0.70] xl:scale-[0.85] 2xl:scale-[0.95] origin-top transition-transform duration-300">
                 <IdCardPreview user={previewUser} type="student" activeSide={activeSide} photoPreview={formData.photo_base64} />
               </div>
             </div>
             
             <div className="p-4 text-center text-slate-500 font-medium text-xs shrink-0 relative z-10 -mt-24 xl:-mt-12 2xl:mt-0">
               Changes appear in real-time as you type
             </div>
          </div>
        </div>
    </>
  );
}