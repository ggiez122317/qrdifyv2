import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IdCardView } from '@/components/ui/id-card';
import { Mail, Phone, Briefcase, Hash } from 'lucide-react';

interface TeacherViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any | null;
}

export function TeacherViewModal({ isOpen, onClose, teacher }: TeacherViewModalProps) {
  if (!teacher) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl sm:max-w-5xl bg-slate-50 p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white flex flex-row items-center justify-between sticky top-0 z-10">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-800">Teacher Details</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">Viewing full profile information.</p>
          </div>
        </DialogHeader>

        <div className="p-6 md:p-8 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Left Column: ID & Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-slate-50 shadow-sm">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=800000&color=fff&size=128`} alt={teacher.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{teacher.name}</h3>
                <p className="text-sm text-maroon-600 font-medium mb-4">{teacher.teacher_profile?.position || 'Teacher'}</p>
                
                <div className="w-full pt-4 border-t border-slate-100 flex flex-col gap-3 text-left">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{teacher.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{teacher.phone || 'No phone provided'}</span>
                  </div>
                </div>
              </div>

              {/* Quick ID Preview Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col items-center">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 w-full border-b pb-2">School ID</p>
                <div className="w-full flex justify-center">
                  <IdCardView user={teacher} type="teacher" />
                </div>
              </div>
            </div>

            {/* Right Column: Detailed Info */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">Employment Details</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Hash className="w-4 h-4" /> Teacher ID Number
                      </div>
                      <p className="font-semibold text-slate-900">{teacher.employee_id || 'Not assigned'}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Briefcase className="w-4 h-4" /> Department
                      </div>
                      <p className="font-semibold text-slate-900">{teacher.teacher_profile?.department || 'Unassigned'}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Briefcase className="w-4 h-4" /> Position
                      </div>
                      <p className="font-semibold text-slate-900">{teacher.teacher_profile?.position || 'Teacher'}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 
                        Status
                      </div>
                      <div className="mt-1 flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider
                          ${teacher.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                            teacher.status === 'on_leave' ? 'bg-amber-100 text-amber-700' : 
                            'bg-slate-100 text-slate-700'}`}>
                          {teacher.status?.replace('_', ' ') || 'unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">Assigned Subjects / Schedule</h3>
                </div>
                <div className="p-6 text-center text-slate-500 py-10">
                  <p className="text-sm">No schedule assigned yet.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
