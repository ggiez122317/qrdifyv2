/* eslint-disable @next/next/no-img-element */
import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { Printer, IdCard } from 'lucide-react';
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
                <img src="/id-assets/deped.png" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} alt="DepEd" />
              </div>

              <div style={{ position: 'absolute', right: '0', bottom: '0', width: '138px', height: '165px', zIndex: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: (photoPreview || user?.photo_url) ? 'transparent' : '#f1f5f9' }}>
                {(photoPreview || user?.photo_url) ? (
                  <img src={getImageUrl(photoPreview || user?.photo_url)} alt={user?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
      <div style={{ width: '260px', height: '414px', borderRadius: '0px', overflow: 'hidden', background: '#dcebfa', position: 'relative', outline: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', flexShrink: 0, display: (activeSide === 'both' || activeSide === 'front') ? 'block' : 'none' }}>

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
        <div style={{ position: 'absolute', top: '30px', left: '-5%', width: '115%', height: '90px', zIndex: 5 }}>
          <img src="/id-assets/wave.png" style={{ width: '100%', height: '100%', objectFit: 'fill' }} alt="Waves" />
        </div>

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
        <div style={{ position: 'absolute', left: '-9px', top: '270px', width: '145px', textAlign: 'center', zIndex: 10 }}>
          <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#facc15', WebkitTextStroke: '0.5px #000', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 2px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
            LRN #: {user?.lrn || '100001'}
          </div>
        </div>

        {/* Name Bar */}
        <div style={{ position: 'absolute', bottom: '84px', left: 0, width: '100%', height: '38px', background: '#d9f906', zIndex: 15, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: '8px', right: '0px', top: '3px', bottom: '8px', background: '#fff', clipPath: 'polygon(22px 0, 100% 0, 100% 100%, 8px 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '20px' }}>
            <span style={{ display: 'inline-block', fontSize: '18px', fontWeight: 900, color: '#000', fontFamily: '"Arial Narrow", Impact, Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '-0.5px', transform: 'scaleY(1.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </span>
          </div>
        </div>

        {/* Student Photo */}
        <div style={{ position: 'absolute', right: '0px', bottom: '122px', width: '120px', height: '150px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 10 }}>
          {(photoPreview || user?.photo_url) ? (
            <img src={getImageUrl(photoPreview || user?.photo_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'bottom center', borderRadius: '8px 8px 0 0' }} />
          ) : (
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '2px solid #e2e8f0' }}>
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
          )}
        </div>

        {/* Footer Signature */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '84px', background: '#0c2340', zIndex: 10, overflow: 'hidden' }}>
          {/* Medium blue curve overlay */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50px' }}>
            <svg width="260" height="50" viewBox="0 0 260 50" preserveAspectRatio="none">
              <path d="M 0,0 C 100,5 180,45 260,45 L 260,0 Z" fill="#3b82f6" />
            </svg>
          </div>

          <div style={{ position: 'absolute', bottom: '15px', width: '100%', textAlign: 'center', zIndex: 20 }}>
            {/* Signature image */}
            <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-65%)', width: '90px', height: '45px', zIndex: 25 }}>
              <img src="/id-assets/signature.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div style={{ position: 'relative', zIndex: 20 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', letterSpacing: '0.5px' }}>
                LEMUEL S. DELA VEGA
              </div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                PRINCIPAL II
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

    // Dynamically calculate the school year and format the grade level
    const currentYear = new Date().getFullYear();
    const schoolYearStr = `${currentYear}-${currentYear + 1}`;
    const gradeLevel = user?.student_profile?.grade || 'KINDERGARTEN';
    const sectionName = user?.student_profile?.section || '';
    const gradeAndSection = sectionName ? `${gradeLevel} - ${sectionName}` : gradeLevel;

    return (
      <div style={{ width: '260px', height: '414px', borderRadius: '0px', overflow: 'hidden', background: '#fff', position: 'relative', outline: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', flexShrink: 0, display: (activeSide === 'both' || activeSide === 'back') ? 'flex' : 'none', flexDirection: 'column', padding: '15px' }}>

        {/* Watermark */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.05, pointerEvents: 'none' }}>
          <img src="/id-assets/school-logo.png" style={{ width: '280px', height: '280px', objectFit: 'contain' }} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>

        {/* Table - Only Current Grade */}
        <div style={{ position: 'relative', zIndex: 10, width: '100%', border: '2px solid #000', borderRadius: '4px', overflow: 'hidden', marginBottom: '5px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: '#000' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '2px solid #000', borderRight: '1px solid #000', padding: '6px' }}>School Year</th>
                <th style={{ borderBottom: '2px solid #000', borderRight: '1px solid #000', padding: '6px' }}>Grade &amp; Section</th>
                <th style={{ borderBottom: '2px solid #000', padding: '6px' }}>Signature</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ borderRight: '1px solid #000', padding: '8px 4px' }}>{schoolYearStr}</td>
                <td style={{ borderRight: '1px solid #000', padding: '8px 4px' }}>{gradeAndSection}</td>
                <td style={{ padding: '4px' }}>
                  <img src="/id-assets/signature.png" style={{ height: '14px', margin: '0 auto' }} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </td>
              </tr>
            </tbody>
          </table>
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
        <div style={{ position: 'relative', zIndex: 10, width: '130px', height: '130px', margin: '0 auto', marginTop: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${idNumber}`}
            alt="QR Code"
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
          />
        </div>

        {/* Bottom Text */}
        <div style={{ position: 'relative', zIndex: 10, marginTop: 'auto', textAlign: 'center' }}>
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
        <div style={{ position: 'absolute', bottom: '-18px', left: '-15%', width: '115%', height: '55px', zIndex: 5, pointerEvents: 'none' }}>
          <img src="/id-assets/wave.png" style={{ width: '100%', height: '100%', objectFit: 'fill', transform: 'rotate(180deg)' }} alt="Waves" />
        </div>
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
