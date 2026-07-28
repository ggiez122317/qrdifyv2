'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IdCardPreview } from '@/components/ui/id-card';
import { PhotoUploader } from '@/components/ui/PhotoUploader';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateStudentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    lrn: '',
    grade_level: '',
    section: '',
    parent_name: '',
    parent_phone: '',
    photo_base64: ''
  });
  
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Compute a structured user object for the ID Preview
  const previewUser = {
    name: `${formData.first_name} ${formData.last_name}`.trim() || 'Juan Dela Cruz',
    email: formData.email,
    lrn: formData.lrn,
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
      const response = await fetch('http://localhost:8000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        localStorage.setItem('toast_message', 'Student record created successfully');
        router.push('/admin/students');
      } else {
        const errorData = await response.json();
        localStorage.setItem('toast_message', 'Failed to save: ' + (errorData.message || 'Unknown error'));
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('API Error:', error);
      localStorage.setItem('toast_message', 'Network error while saving');
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
                    <Input id="lrn" name="lrn" value={formData.lrn} onChange={handleChange} onFocus={() => setActiveSide('front')} required placeholder="12-digit LRN" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="grade_level" className="text-sm font-semibold dark:text-slate-300">Grade Level <span className="text-red-500">*</span></Label>
                    <Input id="grade_level" name="grade_level" value={formData.grade_level} onChange={handleChange} onFocus={() => setActiveSide('front')} required placeholder="e.g. Grade 12" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="section" className="text-sm font-semibold dark:text-slate-300">Section <span className="text-red-500">*</span></Label>
                    <Input id="section" name="section" value={formData.section} onChange={handleChange} onFocus={() => setActiveSide('front')} required placeholder="e.g. STEM A" className="bg-slate-50 dark:bg-[#0f1115] dark:border-white/10 dark:text-white h-12 text-base" />
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
