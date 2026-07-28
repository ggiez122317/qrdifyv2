/* eslint-disable @next/next/no-img-element */
import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { Printer, IdCard, School } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { getImageUrl } from '@/lib/utils';

export interface IdCardUser {
  id?: number | string;
  name?: string;
  photo_url?: string | null;
  roles?: string[];
  lrn?: string;
  employee_id?: string;
  student_profile?: {
    grade?: string;
    section?: string;
    parent_name?: string;
    parent_phone?: string;
  };
  teacher_profile?: {
    position?: string;
  };
}

interface IdCardProps {
  user: IdCardUser;
  type: 'student' | 'teacher';
}

export function IdCardPreview({ user, type, printRef, activeSide = 'both', photoPreview }: { user: IdCardUser, type: 'student' | 'teacher', printRef?: React.Ref<HTMLDivElement>, activeSide?: 'front' | 'back' | 'both', photoPreview?: string | null }) {
  const name = user?.name?.toUpperCase() || 'UNKNOWN NAME';
  const roleLabel = type === 'teacher' ? (user?.teacher_profile?.position || 'TEACHER') : 'STUDENT';
  const idNumber = type === 'teacher' 
    ? (user?.employee_id || 'TID-2026-0000') 
    : (user?.lrn || 'LRN-2026-0000');
  
  const renderCardFront = () => {
    if (type === 'teacher') {
      return (
        <div style={{ width: '260px', height: '414px', borderRadius: '0', overflow: 'hidden', background: '#fff', position: 'relative', outline: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', flexShrink: 0, display: (activeSide === 'both' || activeSide === 'front') ? 'block' : 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: '#fff', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: '137px', overflow: 'hidden', backgroundColor: '#e84742' }}>
              <img src="/id-assets/bg.png" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              
              <div style={{ position: 'absolute', left: '31px', top: '38px', width: '92px', height: '92px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <img src="/id-assets/kagawaran.png" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} alt="Kagawaran ng Edukasyon" />
              </div>
              
              <div style={{ position: 'absolute', right: '14px', top: '36px', height: '195px', color: '#fff', font: '900 25px/1 Arial,sans-serif', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: 0, whiteSpace: 'nowrap', zIndex: 10 }}>
                {roleLabel}
              </div>
              
              <div style={{ position: 'absolute', left: '13px', right: '70px', top: '144px', color: '#fff', textTransform: 'uppercase', zIndex: 10 }}>
                <div style={{ font: '900 24px/1 Arial,sans-serif', letterSpacing: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name.split(' ').length > 1 ? name.split(' ').slice(1).join(' ') : name},
                </div>
                <div style={{ marginTop: '4px', font: '800 16px/1.05 Arial,sans-serif', letterSpacing: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name.split(' ')[0]}
                </div>
                <div style={{ marginTop: '11px', maxWidth: '148px', maxHeight: '47px', overflow: 'hidden', color: '#fff', font: '800 13px/1.18 Arial,sans-serif', letterSpacing: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  SMART SCHOOL ID<br/>TRACKING SYSTEM
                </div>
              </div>
              
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '19px', padding: '4px 12px 0', overflow: 'hidden', color: '#fff', font: '900 9px/1 "Courier New",monospace', letterSpacing: '.1px', whiteSpace: 'nowrap', background: 'rgba(185,28,28,.42)', zIndex: 10 }}>
                EMPLOYEE NO. <span style={{ fontWeight: 'normal' }}>{idNumber}</span>
              </div>
            </div>

            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '137px', background: '#fff' }}>
              <div style={{ position: 'absolute', left: '12px', top: '9px', right: 'auto', bottom: 'auto', width: '116px', color: '#000' }}>
                <div style={{ font: '900 11px/1.08 Arial,sans-serif', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  REGION 13<br/><span style={{ fontWeight: 'normal', fontSize: '10px' }}>Division of Caraga</span>
                </div>
              </div>
              <div style={{ position: 'absolute', left: '14px', bottom: '13px', width: '112px' }}>
                 <img src="/id-assets/deped.png" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} alt="DepEd" />
              </div>
              
              <div style={{ position: 'absolute', right: '0', bottom: '0', width: '138px', height: '165px', zIndex: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: (photoPreview || user?.photo_url) ? 'transparent' : '#f1f5f9' }}>
                 {(photoPreview || user?.photo_url) ? (
                   <img src={getImageUrl(photoPreview || user?.photo_url)} alt={user?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : (
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                 )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
    <div style={{ width: '260px', height: '414px', borderRadius: '0', overflow: 'hidden', background: '#fff', position: 'relative', outline: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', flexShrink: 0, display: (activeSide === 'both' || activeSide === 'front') ? 'block' : 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#fff', overflow: 'hidden' }}>

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '140px', background: 'linear-gradient(to bottom, #7a1315, #9b1c1e)' }}>
          <div style={{ position: 'absolute', bottom: '-20px', left: '-10%', right: '-10%', height: '40px', background: '#fff', transform: 'rotate(-5deg)' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '-10%', right: '-10%', height: '40px', background: '#fff', transform: 'rotate(5deg)' }} />
        </div>
      </div>
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '24px', paddingBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <School size={28} color="#7a1315" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px', lineHeight: 1.1 }}>SOUTHVILLE</span>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '1px' }}>INTERNATIONAL</span>
          </div>
        </div>
        <div style={{ width: '105px', height: '105px', minWidth: '105px', minHeight: '105px', flexShrink: 0, borderRadius: '50%', padding: '4px', background: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', marginBottom: '16px', zIndex: 10 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(photoPreview || user?.photo_url) ? (
              <img src={getImageUrl(photoPreview || user?.photo_url)} alt={user?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '0 20px', flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '4px', lineHeight: 1.2, textTransform: 'uppercase' }}>{name}</h2>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#7a1315', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>{user?.roles?.[0] || type}</div>
          
          <div style={{ marginTop: 'auto', width: '100%' }}>
            {type === 'student' && user?.student_profile && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Grade</div>
                  <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 800 }}>{user.student_profile.grade}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Section</div>
                  <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 800 }}>{user.student_profile.section}</div>
                </div>
              </div>
            )}
            
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>{type === 'student' ? 'Student ID' : 'Employee ID'}</div>
              <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 800, letterSpacing: '1px', fontFamily: 'monospace' }}>{idNumber}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  };

  const renderCardBack = () => {
    if (type === 'teacher') {
      return (
        <div style={{ width: '260px', height: '414px', borderRadius: '0', overflow: 'hidden', background: '#fff', position: 'relative', outline: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', flexShrink: 0, display: (activeSide === 'both' || activeSide === 'back') ? 'block' : 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: '#fff', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: '137px', overflow: 'hidden', backgroundColor: '#e84742' }}>
              <img src="/id-assets/bg.png" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              
              <div style={{ position: 'absolute', left: '31px', top: '38px', width: '92px', height: '92px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <img src="/id-assets/kagawaran.png" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} alt="Kagawaran ng Edukasyon" />
              </div>
              
              <div style={{ position: 'absolute', right: '14px', top: '36px', height: '195px', color: '#fff', font: '900 25px/1 Arial,sans-serif', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: 0, whiteSpace: 'nowrap', zIndex: 10 }}>
                {roleLabel}
              </div>
              
              <div style={{ position: 'absolute', left: '13px', right: '70px', top: '144px', color: '#fff', textTransform: 'uppercase', zIndex: 10 }}>
                <div style={{ font: '900 24px/1 Arial,sans-serif', letterSpacing: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name.split(' ').length > 1 ? name.split(' ').slice(1).join(' ') : name},
                </div>
                <div style={{ marginTop: '4px', font: '800 16px/1.05 Arial,sans-serif', letterSpacing: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name.split(' ')[0]}
                </div>
                <div style={{ marginTop: '11px', maxWidth: '148px', maxHeight: '47px', overflow: 'hidden', color: '#fff', font: '800 13px/1.18 Arial,sans-serif', letterSpacing: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  SMART SCHOOL ID<br/>TRACKING SYSTEM
                </div>
              </div>
              
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '19px', padding: '4px 12px 0', overflow: 'hidden', color: '#fff', font: '900 9px/1 "Courier New",monospace', letterSpacing: '.1px', whiteSpace: 'nowrap', background: 'rgba(185,28,28,.42)', zIndex: 10 }}>
                EMPLOYEE NO. <span style={{ fontWeight: 'normal' }}>{idNumber}</span>
              </div>
            </div>

            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '137px', background: '#fff' }}>
              <div style={{ position: 'absolute', left: '12px', top: '9px', right: 'auto', bottom: 'auto', width: '116px', color: '#000' }}>
                <div style={{ font: '900 11px/1.08 Arial,sans-serif', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  REGION 13<br/><span style={{ fontWeight: 'normal', fontSize: '10px' }}>Division of Caraga</span>
                </div>
              </div>
              <div style={{ position: 'absolute', left: '14px', bottom: '13px', width: '112px' }}>
                 <img src="/id-assets/deped.png" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} alt="DepEd" />
              </div>
            </div>

            <div style={{ position: 'absolute', right: '8px', bottom: '8px', width: '120px', height: '120px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff', zIndex: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${idNumber}`} 
                 alt={`${type} QR code`} 
                 style={{ width: '100%', height: '100%', display: 'block' }}
               />
            </div>
          </div>
        </div>
      );
    }

    const guardianName = user?.student_profile?.parent_name || 'NOT PROVIDED';
    const guardianPhone = user?.student_profile?.parent_phone || 'NOT PROVIDED';
    
    return (
      <div style={{ width: '260px', height: '414px', borderRadius: '0', overflow: 'hidden', background: '#fff', position: 'relative', outline: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', flexShrink: 0, display: (activeSide === 'both' || activeSide === 'back') ? 'flex' : 'none', flexDirection: 'column' }}>
        <div style={{ backgroundColor: '#b91c1c', padding: '15px', color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          In case of emergency, please notify:
        </div>
        
        <div style={{ padding: '20px 15px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: '#0f172a', fontWeight: '900' }}>{guardianName.toUpperCase()}</p>
            <p style={{ fontSize: '14px', color: '#b91c1c', fontWeight: '800', marginTop: '4px' }}>{guardianPhone}</p>
          </div>
          
          <div style={{ width: '160px', height: '160px', padding: '8px', border: '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', marginBottom: '20px' }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${idNumber}`} 
              alt={`${type} QR code`} 
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>
          
          <div style={{ marginTop: 'auto', textAlign: 'center' }}>
            <p style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.4, fontWeight: '500' }}>
              This card is non-transferable.<br/>
              If found, please return to:<br/>
              <strong style={{ color: '#0f172a' }}>School Administration Office</strong>
            </p>
          </div>
        </div>
        
        <div style={{ height: '8px', backgroundColor: '#e84742', width: '100%' }}></div>
      </div>
    );
  };

  return (
    <div ref={printRef} className="flex gap-8 md:gap-12 shrink-0 justify-center">
      {renderCardFront()}
      {renderCardBack()}
    </div>
  );
}

export function IdCardView({ user, type }: IdCardProps) {
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  return (
    <Dialog>
      <DialogTrigger className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-transparent text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-white/5 font-bold text-[11px] rounded-lg transition-colors border border-blue-200 dark:border-white/10">
        <IdCard className="w-3.5 h-3.5" />
        View ID
      </DialogTrigger>
      
      <DialogContent className="max-w-[800px] sm:max-w-[800px] p-0 overflow-hidden bg-slate-50 dark:bg-[#161920] dark:border-white/10 [&>button]:hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#161920]">
          <div className="flex items-center gap-2">
            <IdCard className="w-5 h-5 text-red-600 dark:text-red-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              {type === 'teacher' ? 'Teacher' : 'Student'} ID Preview
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-[#7a1315] text-white rounded-lg hover:bg-red-700 dark:hover:bg-[#5a0e0f] transition-colors font-medium text-sm shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print ID
            </button>
            <DialogClose className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </div>
        
        <div className="p-8 md:p-12 dark:bg-[#0f1115]">
          <DialogTitle className="sr-only">ID Card Preview</DialogTitle>
          <IdCardPreview user={user} type={type} printRef={printRef} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
