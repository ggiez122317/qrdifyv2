/* eslint-disable @next/next/no-img-element */
import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { Printer, IdCard } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { getImageUrl } from '@/lib/utils';
import api from '@/lib/axios';

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
  const currentYear = new Date().getFullYear();
  const defaultIdPreferences = {
    principal_name: 'MERLE B. ALSONADO',
    principal_position: 'PRINCIPAL I',
    principal_signature: '',
    student_id_template_mode: 'default',
    student_id_front_template: '',
    student_id_back_template: '',
    school_year: `${currentYear}-${currentYear + 1}`,
  };
  const { data: idPreferences = defaultIdPreferences } = useQuery({
    queryKey: ['system-preferences'],
    queryFn: async () => {
      const response = await api.get('/api/system/preferences');
      return { ...defaultIdPreferences, ...response.data };
    },
    staleTime: 5 * 60 * 1000,
  });

  const name = user?.name?.toUpperCase() || 'UNKNOWN NAME';
  const roleLabel = type === 'teacher' ? (user?.teacher_profile?.position || 'TEACHER') : 'STUDENT';
  const idNumber = type === 'teacher'
    ? (user?.employee_id || 'TID-2026-0000')
    : (user?.lrn || '132019240057');
  const useCustomStudentTemplates = idPreferences.student_id_template_mode === 'custom';
  const studentFrontTemplate = useCustomStudentTemplates ? getImageUrl(idPreferences.student_id_front_template) : undefined;
  const studentBackTemplate = useCustomStudentTemplates ? getImageUrl(idPreferences.student_id_back_template) : undefined;

  const renderCardFront = () => {
    if (type === 'teacher') {
      return (
        <div style={{ width: '260px', height: '414px', borderRadius: '0', overflow: 'hidden', background: '#fff', position: 'relative', outline: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', flexShrink: 0, display: (activeSide === 'both' || activeSide === 'front') ? 'block' : 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: '#fff', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: '137px', overflow: 'hidden', backgroundColor: '#e84742' }}>
              <img src="/id-assets/bg.png" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />

              <div style={{ position: 'absolute', left: '31px', top: '38px', width: '92px', height: '92px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <img src="/id-assets/kagawaran.png" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} alt="Kagawaran ng Edukasyon" onError={(e) => { e.currentTarget.style.display = 'none' }} />
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
                  SMART SCHOOL ID<br />TRACKING SYSTEM
                </div>
              </div>

              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '19px', padding: '4px 12px 0', overflow: 'hidden', color: '#fff', font: '900 9px/1 "Courier New",monospace', letterSpacing: '.1px', whiteSpace: 'nowrap', background: 'rgba(185,28,28,.42)', zIndex: 10 }}>
                EMPLOYEE NO. <span style={{ fontWeight: 'normal' }}>{idNumber}</span>
              </div>
            </div>

            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '137px', background: '#fff' }}>
              <div style={{ position: 'absolute', left: '12px', top: '9px', right: 'auto', bottom: 'auto', width: '116px', color: '#000' }}>
                <div style={{ font: '900 11px/1.08 Arial,sans-serif', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  REGION 13<br /><span style={{ fontWeight: 'normal', fontSize: '10px' }}>Division of Caraga</span>
                </div>
              </div>
              <div style={{ position: 'absolute', left: '14px', bottom: '13px', width: '112px' }}>
                <img src="/id-assets/deped.png" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} alt="DepEd" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>

              <div style={{ position: 'absolute', right: '0', bottom: '0', width: '138px', height: '165px', zIndex: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: (photoPreview || user?.photo_url) ? 'transparent' : '#f1f5f9' }}>
                {(photoPreview || user?.photo_url) ? (
                  <img src={getImageUrl(photoPreview || user?.photo_url)} alt={user?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ width: '260px', height: '414px', borderRadius: '0px', overflow: 'hidden', background: studentFrontTemplate ? '#fff' : '#dcebfa', position: 'relative', outline: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', flexShrink: 0, display: (activeSide === 'both' || activeSide === 'front') ? 'block' : 'none' }}>

        {studentFrontTemplate && (
          <img src={studentFrontTemplate} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        )}

        {/* Faint Watermark (Center) */}
        <div style={{ position: 'absolute', top: '130px', left: '10px', width: '240px', height: '240px', opacity: 0.08, zIndex: 1, pointerEvents: 'none' }}>
          <img src="/id-assets/school-logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>

        {/* Top Header */}
        <div style={{ position: 'relative', height: '65px', paddingTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
          <div style={{ width: '42px', height: '42px', flexShrink: 0, marginRight: '8px' }}>
            <img src="/id-assets/kagawaran.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', color: '#000', lineHeight: 1.1 }}>Department of Education</span>
            <span style={{ fontSize: '9px', color: '#000', lineHeight: 1.1 }}>Caraga Administrative Region</span>
            <span style={{ fontSize: '10.5px', color: '#000', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 'bold', lineHeight: 1.2 }}>Division of Agusan del Sur</span>
            <span style={{ fontSize: '9px', color: '#000', marginTop: '1px', lineHeight: 1 }}>TRENTO DISTRICT II</span>
          </div>
        </div>

        {/* Waves SVG */}
        {/* Waves Image */}
        {!studentFrontTemplate && (
          <div style={{ position: 'absolute', top: '30px', left: '-5%', width: '115%', height: '90px', zIndex: 5 }}>
            <img src="/id-assets/wave.png" style={{ width: '100%', height: '100%', objectFit: 'fill' }} alt="Waves" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        )}

        {/* Middle Section (Text) */}
        <div style={{ position: 'relative', marginTop: '25px', textAlign: 'center', zIndex: 10 }}>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#0c2340', lineHeight: 1.1 }}>TRENTO WEST CENTRAL</div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#0c2340', lineHeight: 1.1 }}>ELEMENTARY SPED CENTER</div>
          <div style={{ fontSize: '8px', color: '#2563eb', letterSpacing: '1px', marginTop: '3px' }}>TRENTO, AGUSAN DEL SUR</div>
        </div>

        {/* School Logo */}
        <div style={{ position: 'absolute', left: '-2px', top: '125px', width: '160px', height: '165px', zIndex: 10 }}>
          <img src="/id-assets/school-logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="School Logo"
            onError={(e) => { e.currentTarget.src = '/id-assets/deped.png'; }} />
        </div>

        {/* LRN */}
        <div style={{ position: 'absolute', left: '-2px', top: '265px', width: '150px', textAlign: 'center', zIndex: 10 }}>
          <div style={{ fontSize: idNumber.length > 8 ? '10.5px' : '13px', fontWeight: 900, color: '#facc15', WebkitTextStroke: '0.5px #000', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 2px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
            LRN: {idNumber}
          </div>
        </div>

        {/* Name Bar */}
        <div style={{ position: 'absolute', bottom: '84px', left: 0, width: '100%', height: '38px', background: '#02285F', zIndex: 15, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: '8px', right: '0px', top: '3px', bottom: '3px', background: '#fff', clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '15px', paddingRight: '8px' }}>
            <span style={{ display: 'inline-block', fontSize: name.length > 25 ? '16px' : name.length > 20 ? '18px' : name.length > 15 ? '20px' : '24px', fontWeight: 700, color: '#000', fontFamily: '"Arial Narrow", Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '-0.5px', transform: 'scaleY(1.6) scaleX(0.95)', transformOrigin: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'clip', marginTop: '-2px' }}>
              {name}
            </span>
          </div>
        </div>

        {/* Student Photo */}
        <div style={{ position: 'absolute', right: '0px', bottom: '122px', width: '120px', height: '150px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 10 }}>
          {(photoPreview || user?.photo_url) ? (
            <img src={getImageUrl(photoPreview || user?.photo_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'bottom center', borderRadius: '8px 8px 0 0' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '2px solid #e2e8f0' }}>
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
          )}
        </div>

        {/* Footer Signature */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '84px', background: studentFrontTemplate ? 'transparent' : '#D7ECFA', zIndex: 10, overflow: 'hidden' }}>
          {/* Mirrored continuation of the wave used on the back of the ID. */}
          {!studentFrontTemplate && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '30px', zIndex: 5, overflow: 'hidden', pointerEvents: 'none' }}>
              <img src="/id-assets/wave.png" style={{ position: 'absolute', top: '-17px', left: 0, width: '100%', height: '68px', objectFit: 'fill', transform: 'rotate(180deg) scaleX(-1)', transformOrigin: 'center' }} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          )}

          <div style={{ position: 'absolute', inset: 0, width: '100%', textAlign: 'center', zIndex: 20 }}>
            {idPreferences.principal_signature && (
              <img
                src={getImageUrl(idPreferences.principal_signature)}
                style={{ position: 'absolute', top: '14px', left: '50%', width: '76px', height: '27px', objectFit: 'contain', transform: 'translateX(-50%)', filter: 'brightness(0) drop-shadow(0 0 0.7px #000) drop-shadow(0 0 0.7px #000)' }}
                alt="Principal e-signature"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div style={{ position: 'absolute', top: '34px', left: '10px', right: '10px', zIndex: 20 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.15, color: '#000', letterSpacing: '0.4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {idPreferences.principal_name.toUpperCase()}
              </div>
              <div style={{ fontSize: '9px', fontWeight: 800, lineHeight: 1.15, color: '#000', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {idPreferences.principal_position.toUpperCase()}
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
              <img src="/id-assets/bg.png" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />

              <div style={{ position: 'absolute', left: '31px', top: '38px', width: '92px', height: '92px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <img src="/id-assets/kagawaran.png" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} alt="Kagawaran ng Edukasyon" onError={(e) => { e.currentTarget.style.display = 'none' }} />
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
                  SMART SCHOOL ID<br />TRACKING SYSTEM
                </div>
              </div>

              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '19px', padding: '4px 12px 0', overflow: 'hidden', color: '#fff', font: '900 9px/1 "Courier New",monospace', letterSpacing: '.1px', whiteSpace: 'nowrap', background: 'rgba(185,28,28,.42)', zIndex: 10 }}>
                EMPLOYEE NO. <span style={{ fontWeight: 'normal' }}>{idNumber}</span>
              </div>
            </div>

            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '137px', background: '#fff' }}>
              <div style={{ position: 'absolute', left: '12px', top: '9px', right: 'auto', bottom: 'auto', width: '116px', color: '#000' }}>
                <div style={{ font: '900 11px/1.08 Arial,sans-serif', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  REGION 13<br /><span style={{ fontWeight: 'normal', fontSize: '10px' }}>Division of Caraga</span>
                </div>
              </div>
              <div style={{ position: 'absolute', left: '14px', bottom: '13px', width: '112px' }}>
                <img src="/id-assets/deped.png" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} alt="DepEd" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            </div>

            <div style={{ position: 'absolute', right: '8px', bottom: '8px', width: '120px', height: '120px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff', zIndex: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${idNumber}`}
                alt={`${type} QR code`}
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', display: 'block' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        </div>
      );
    }

    const guardianName = user?.student_profile?.parent_name || 'NOT PROVIDED';
    const guardianPhone = user?.student_profile?.parent_phone || 'NOT PROVIDED';

    // Dynamically calculate the school year and format the grade level
    const schoolYearStr = String(idPreferences.school_year || `${currentYear}-${currentYear + 1}`);
    const gradeLevel = String(user?.student_profile?.grade || 'KINDERGARTEN');
    const sectionName = user?.student_profile?.section?.trim() || '';
    const gradeAndSection = sectionName ? `${gradeLevel} - ${sectionName}` : gradeLevel;

    return (
      <div style={{ width: '260px', height: '414px', borderRadius: '0px', overflow: 'hidden', background: '#fff', position: 'relative', outline: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', flexShrink: 0, display: (activeSide === 'both' || activeSide === 'back') ? 'flex' : 'none', flexDirection: 'column', padding: '15px' }}>

        {studentBackTemplate && (
          <img src={studentBackTemplate} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        )}

        {/* Watermark */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.05, pointerEvents: 'none' }}>
          <img src="/id-assets/school-logo.png" style={{ width: '280px', height: '280px', objectFit: 'contain' }} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>

        {/* Current school-year authorization record */}
        <div style={{ position: 'relative', zIndex: 10, width: '100%', border: '1px solid #111', overflow: 'hidden', marginBottom: '5px', color: '#000', background: '#fff', flexShrink: 0, fontFamily: 'Arial, sans-serif' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', height: '23px', borderBottom: '1px solid #111', textAlign: 'center', fontWeight: 700, color: '#000', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #111', padding: '2px', fontSize: '7px', lineHeight: 1, color: '#000' }}>School Year</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #111', padding: '2px', fontSize: '7px', lineHeight: 1, color: '#000' }}>Grade</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', fontSize: '6.5px', lineHeight: 1, color: '#000' }}>Principal&apos;s Signature</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', height: '48px', textAlign: 'center', color: '#000', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #111', padding: '2px', fontSize: '8.5px', lineHeight: 1, fontWeight: 700, whiteSpace: 'nowrap', color: '#000' }}>{schoolYearStr}</div>
            <div title={gradeAndSection} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #111', padding: '2px', fontSize: '8.5px', lineHeight: 1, fontWeight: 700, textTransform: 'uppercase', overflow: 'hidden', color: '#000' }}>{gradeLevel}</div>
            <div style={{ position: 'relative', minWidth: 0, overflow: 'hidden', color: '#000' }}>
              {idPreferences.principal_signature && (
                <img src={getImageUrl(idPreferences.principal_signature)} style={{ position: 'absolute', top: '2px', left: '50%', width: '44px', height: '17px', objectFit: 'contain', display: 'block', transform: 'translateX(-50%)' }} alt="Principal e-signature" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              )}
              <div style={{ position: 'absolute', top: '20px', left: '2px', right: '2px', height: '9px', fontSize: '5.8px', fontWeight: 700, lineHeight: '9px', color: '#000', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idPreferences.principal_name || 'NOT SET'}</div>
              <div style={{ position: 'absolute', top: '30px', left: '2px', right: '2px', height: '8px', fontSize: '5.5px', fontWeight: 700, lineHeight: '8px', color: '#000', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idPreferences.principal_position || 'NOT SET'}</div>
            </div>
          </div>
        </div>

        {/* Emergency Box */}
        <div style={{ position: 'relative', zIndex: 10, width: '100%', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#f8fafc', marginBottom: '5px', marginTop: '5px' }}>
          <div style={{ fontSize: '10px', fontWeight: 900, color: '#3b82f6', marginBottom: '6px', textTransform: 'uppercase', lineHeight: 1.1 }}>
            In Case of Emergency
          </div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
            {guardianName.toUpperCase()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', lineHeight: 1.2, marginTop: '2px' }}>
            POBLACION, TRENTO
          </div>
          <div style={{ fontSize: '12px', fontWeight: 900, color: '#b91c1c', marginTop: '6px' }}>
            {guardianPhone}
          </div>
        </div>

        {/* QR Code */}
        <div style={{ position: 'relative', zIndex: 10, width: '105px', height: '105px', margin: '4px auto 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${idNumber}`}
            alt="QR Code"
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        {/* Bottom Text */}
        <div style={{ position: 'absolute', zIndex: 10, left: '15px', right: '15px', bottom: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#000', lineHeight: 1.2 }}>
            THIS IS TO CERTIFY THAT THE
          </div>
          <div style={{ fontSize: '10px', fontWeight: 900, color: '#000', lineHeight: 1.2 }}>
            BEARER IS A BONAFIDE PUPIL OF
          </div>
          <div style={{ fontSize: '12px', fontWeight: 900, color: '#dc2626', lineHeight: 1.2, marginTop: '4px', textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}>
            TRENTO WEST CENTRAL ELEMENTARY
          </div>
          <div style={{ fontSize: '12px', fontWeight: 900, color: '#dc2626', lineHeight: 1.2, textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}>
            SPED CENTER
          </div>
        </div>

        {/* Bottom Wave Image */}
        {!studentBackTemplate && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '48px', zIndex: 5, overflow: 'hidden', pointerEvents: 'none' }}>
            <img src="/id-assets/wave.png" style={{ position: 'absolute', top: '-25px', left: 0, width: '100%', height: '105px', objectFit: 'fill', transform: 'rotate(180deg)', transformOrigin: 'center' }} alt="Waves" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={printRef} className="flex gap-8 md:gap-12 shrink-0 justify-center print:mt-16">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
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
