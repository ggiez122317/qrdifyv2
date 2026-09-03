'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings as SettingsIcon, Bell, Save, CheckCircle2, User, Mail, Phone, ShieldCheck, GraduationCap, ChevronDown, Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SecuritySettings } from '@/components/settings/security-settings';
import api from '@/lib/axios';

type TeacherSettings = {
  email_notifications: boolean;
  sms_notifications: boolean;
  phone_number: string;
  display_name: string;
  email: string;
  grade_level: string;
  section_id: number | null;
};

type AcademicOption = { id: number; name: string; grade_level?: string };

const emptySettings: TeacherSettings = {
  email_notifications: true,
  sms_notifications: false,
  phone_number: '',
  display_name: '',
  email: '',
  grade_level: '',
  section_id: null,
};

export default function TeacherSettingsPage() {
  const [draft, setDraft] = useState<TeacherSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [newSectionName, setNewSectionName] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['teacher-settings'],
    queryFn: async () => (await api.get('/api/teacher/settings')).data as {
      settings: TeacherSettings;
      grade_levels: AcademicOption[];
      sections: AcademicOption[];
    },
  });

  const settings = draft ?? data?.settings ?? emptySettings;

  const availableSections = useMemo(
    () => (data?.sections ?? []).filter(section => section.grade_level === settings.grade_level),
    [data?.sections, settings.grade_level]
  );

  const handleChange = <K extends keyof TeacherSettings>(key: K, value: TeacherSettings[K]) => {
    setDraft({ ...settings, [key]: value });
    setSaveSuccess(false);
    setError('');
  };

  const handleGradeChange = (gradeLevel: string) => {
    setDraft({ ...settings, grade_level: gradeLevel, section_id: null });
    setSaveSuccess(false);
    setError('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      await api.put('/api/teacher/settings', {
        ...settings,
        section_id: newSectionName.trim() ? null : settings.section_id,
        new_section_name: newSectionName.trim() || undefined,
      });
      await refetch();
      setDraft(null);
      setNewSectionName('');
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-slate-500">
          <SettingsIcon aria-hidden="true" className="mb-4 h-12 w-12 animate-spin opacity-50" />
          <p>Loading account settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto min-h-screen max-w-[1400px] space-y-8 bg-[#F8FAFC] p-4 sm:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f172a]">Account Settings</h1>
            <p className="mt-1 text-[15px] font-medium text-slate-600">Manage your profile and the class used when adding students.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {saveSuccess && (
              <span role="status" className="flex h-[46px] items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-[14px] font-bold text-emerald-700">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> Settings saved
              </span>
            )}
            <Button onClick={handleSave} disabled={isSaving || !settings.grade_level || (!settings.section_id && !newSectionName.trim())} className="h-[46px] rounded-xl bg-[#a81616] px-6 text-[15px] font-bold text-white shadow-sm hover:bg-[#8b1111] disabled:opacity-60">
              {isSaving ? <SettingsIcon aria-hidden="true" className="mr-2 h-5 w-5 animate-spin" /> : <Save aria-hidden="true" className="mr-2 h-5 w-5" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:px-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100"><User aria-hidden="true" className="h-5 w-5 text-slate-600" /></div>
              <div className="flex flex-col space-y-1">
                <CardTitle className="text-[17px] font-extrabold text-slate-800">Profile Information</CardTitle>
                <CardDescription className="text-[13px] font-medium text-slate-600">Update your contact details and display name.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <SettingInput label="Display Name" type="text" value={settings.display_name} icon={User} onChange={value => handleChange('display_name', value)} />
                <SettingInput label="Email Address" type="email" value={settings.email} icon={Mail} onChange={value => handleChange('email', value)} />
                <SettingInput label="Phone Number" type="tel" value={settings.phone_number} icon={Phone} onChange={value => handleChange('phone_number', value)} />
              </div>

              <section className="border-t border-slate-100 pt-8" aria-labelledby="academic-assignment-heading">
                <div className="mb-5 flex items-start gap-3">
                  <GraduationCap aria-hidden="true" className="mt-0.5 h-5 w-5 text-[#0B3A82]" />
                  <div>
                    <h2 id="academic-assignment-heading" className="text-[16px] font-bold text-slate-900">Academic Assignment</h2>
                    <p className="mt-1 text-sm text-slate-600">New students will automatically use this grade level and section.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="grade-level" className="text-sm font-bold text-slate-800">Grade Level <span className="text-red-600">*</span></label>
                    <select id="grade-level" value={settings.grade_level} onChange={event => handleGradeChange(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-700 focus:border-[#0B3A82] focus:outline-none focus:ring-2 focus:ring-blue-100">
                      <option value="">Select grade level</option>
                      {data?.grade_levels.map(grade => <option key={grade.id} value={grade.name}>{grade.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="section" className="text-sm font-bold text-slate-800">Section <span className="text-red-600">*</span></label>
                    <SectionDropdown
                      id="section"
                      disabled={false}
                      gradeLevel={settings.grade_level}
                      options={availableSections}
                      value={settings.section_id}
                      customValue={newSectionName}
                      onSelect={sectionId => {
                        handleChange('section_id', sectionId);
                        setNewSectionName('');
                      }}
                      onCustomChange={value => {
                        setNewSectionName(value);
                        handleChange('section_id', null);
                      }}
                    />
                  </div>
                </div>
              </section>

              <div className="border-t border-slate-100 pt-8">
                <h2 className="mb-6 flex items-center gap-2 text-[16px] font-bold text-slate-900"><ShieldCheck aria-hidden="true" className="h-5 w-5 text-[#a81616]" /> Account Security</h2>
                <SecuritySettings />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:px-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100"><Bell aria-hidden="true" className="h-5 w-5 text-slate-600" /></div>
              <div className="flex flex-col space-y-1"><CardTitle className="text-[17px] font-extrabold text-slate-800">Notifications</CardTitle><CardDescription className="text-[13px] font-medium text-slate-600">How you prefer to be alerted.</CardDescription></div>
            </CardHeader>
            <CardContent className="space-y-4 p-6 sm:p-8">
              <NotificationToggle label="Email Alerts" description="Daily attendance summaries" active={settings.email_notifications} icon={Mail} onToggle={() => handleChange('email_notifications', !settings.email_notifications)} />
              <NotificationToggle label="SMS Alerts" description="Urgent leave requests" active={settings.sms_notifications} icon={Phone} onToggle={() => handleChange('sms_notifications', !settings.sms_notifications)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SettingInput({ label, type, value, icon: Icon, onChange }: { label: string; type: string; value: string; icon: typeof User; onChange: (value: string) => void }) {
  const id = label.toLowerCase().replaceAll(' ', '-');
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-bold text-slate-800">{label}</label>
      <div className="relative flex items-center">
        <Icon aria-hidden="true" className="pointer-events-none absolute left-4 h-[18px] w-[18px] text-slate-400" />
        <input id={id} type={type} value={value} required onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-[15px] font-medium text-slate-700 focus:border-[#0B3A82] focus:outline-none focus:ring-2 focus:ring-blue-100" />
      </div>
    </div>
  );
}

function NotificationToggle({ label, description, active, icon: Icon, onToggle }: { label: string; description: string; active: boolean; icon: typeof Mail; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={active} onClick={onToggle} className="flex min-h-14 w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100">
      <span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50"><Icon aria-hidden="true" className="h-4 w-4 text-blue-700" /></span><span className="flex flex-col"><span className="text-[14px] font-bold text-slate-800">{label}</span><span className="text-[12px] font-medium text-slate-600">{description}</span></span></span>
      <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${active ? 'bg-[#a81616]' : 'bg-slate-300'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${active ? 'left-[22px]' : 'left-0.5'}`} /></span>
    </button>
  );
}

function SectionDropdown({ id, disabled, gradeLevel, options, value, customValue, onSelect, onCustomChange }: {
  id: string;
  disabled: boolean;
  gradeLevel: string;
  options: AcademicOption[];
  value: number | null;
  customValue: string;
  onSelect: (value: number) => void;
  onCustomChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedSection = options.find(option => option.id === value);
  const displayValue = customValue || selectedSection?.name || '';

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            setIsOpen(false);
            setIsCreating(false);
          }
        }}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left text-[15px] font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-[#0B3A82] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      >
        <span className={displayValue ? 'text-slate-800' : 'text-slate-500'}>
          {displayValue || 'Select or add a section'}
        </span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl" role="listbox" aria-label={`Sections for ${gradeLevel}`}>
          <div className="max-h-52 overflow-y-auto p-1.5">
            {options.length > 0 ? options.map(option => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={value === option.id && !customValue}
                onClick={() => {
                  onSelect(option.id);
                  setIsOpen(false);
                  setIsCreating(false);
                }}
                className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none ${value === option.id && !customValue ? 'bg-blue-50 font-bold text-[#0B3A82]' : 'font-medium text-slate-700'}`}
              >
                <span>{option.name}</span>
                {value === option.id && !customValue && <Check aria-hidden="true" className="h-4 w-4" />}
              </button>
            )) : (
              <p className="px-3 py-4 text-center text-sm text-slate-500">
                {gradeLevel ? `No sections recorded for ${gradeLevel}.` : 'Choose a grade to view its existing sections, or add your own below.'}
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 p-2">
            {!isCreating ? (
              <button type="button" onClick={() => setIsCreating(true)} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-[#0B3A82] transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-100">
                <Plus aria-hidden="true" className="h-4 w-4" /> Add a new section
              </button>
            ) : (
              <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor={`${id}-new`} className="text-sm font-bold text-slate-800">New section name</label>
                  <button type="button" aria-label="Cancel adding section" onClick={() => { setIsCreating(false); onCustomChange(''); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100"><X aria-hidden="true" className="h-4 w-4" /></button>
                </div>
                <input
                  id={`${id}-new`}
                  autoFocus
                  value={customValue}
                  maxLength={255}
                  onChange={event => onCustomChange(event.target.value)}
                  placeholder="e.g. Rizal"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-800 focus:border-[#0B3A82] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-xs leading-5 text-slate-600">
                  {gradeLevel
                    ? `Saving will automatically add this section to the admin records under ${gradeLevel}.`
                    : 'You can enter the section now. Choose its grade level before saving.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
