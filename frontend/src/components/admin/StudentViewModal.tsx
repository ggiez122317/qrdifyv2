import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IdCardView } from '@/components/ui/id-card';
import { Mail, Phone, BookOpen, Hash, Users } from 'lucide-react';

interface StudentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any | null;
}

export function StudentViewModal({ isOpen, onClose, student }: StudentViewModalProps) {
  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl sm:max-w-5xl bg-slate-50 dark:bg-[#0f1115] p-0 overflow-hidden dark:border-white/10">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#161920] flex flex-row items-center justify-between sticky top-0 z-10">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Student Details</DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Viewing full profile information.</p>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full h-8 w-8" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="p-6 md:p-8 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Left Column: ID & Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-[#161920] rounded-xl shadow-sm border border-slate-200 dark:border-white/5 p-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-slate-50 dark:border-[#1c1215] shadow-sm">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=800000&color=fff&size=128`} alt={student.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{student.name}</h3>
                <p className="text-sm text-maroon-600 dark:text-red-400 font-medium mb-4">{student.student_profile?.grade_level || 'Student'}</p>
                
                <div className="w-full pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3 text-left">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span className="truncate">{student.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>{student.phone || 'No phone provided'}</span>
                  </div>
                </div>
              </div>

              {/* Quick ID Preview Actions */}
              <div className="bg-white dark:bg-[#161920] rounded-xl shadow-sm border border-slate-200 dark:border-white/5 p-5 flex flex-col items-center">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 w-full border-b dark:border-white/5 pb-2">School ID</p>
                <div className="w-full flex justify-center">
                  <IdCardView user={student} type="student" />
                </div>
              </div>
            </div>

            {/* Right Column: Detailed Info */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white dark:bg-[#161920] rounded-xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Academic Details</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <Hash className="w-4 h-4" /> Learner Reference No. (LRN)
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">{student.lrn || 'Not assigned'}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <BookOpen className="w-4 h-4" /> Grade Level
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">{student.student_profile?.grade_level || 'Unassigned'}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <BookOpen className="w-4 h-4" /> Section
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">{student.student_profile?.section || 'Unassigned'}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 
                        Status
                      </div>
                      <div className="mt-1 flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider
                          ${student.status === 'enrolled' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 
                            'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}>
                          {student.status?.replace('_', ' ') || 'unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-[#161920] rounded-xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Emergency Contact</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <Users className="w-4 h-4" /> Guardian Name
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">{student.student_profile?.parent_name || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <Phone className="w-4 h-4" /> Contact Number
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">{student.student_profile?.parent_phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
