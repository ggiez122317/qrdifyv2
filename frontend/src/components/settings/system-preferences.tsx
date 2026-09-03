'use client';

/* eslint-disable @next/next/no-img-element */
import { ChangeEvent, PointerEvent, useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, Clock3, Eraser, Loader2, LogOut, Monitor, PenTool, Save, Send, Sun, Sunrise, Upload } from 'lucide-react';
import api from '@/lib/axios';
import { getImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';

interface SystemPreferences {
  principal_name: string;
  principal_position: string;
  principal_signature: string;
  school_year: string;
  timezone: string;
  date_format: string;
  default_theme: 'light' | 'dark' | 'system';
  compact_tables: boolean;
  enable_push_notifications: boolean;
  enable_sms_notifications: boolean;
  notify_check_in: boolean;
  notify_check_out: boolean;
  notify_late: boolean;
  notify_early: boolean;
  phone_number: string;
}

type SystemPreferencesResponse = Omit<Partial<SystemPreferences>, 'phone_number'> & {
  phone_number?: string | null;
};

const defaults: SystemPreferences = {
  principal_name: 'MERLE B. ALSONADO',
  principal_position: 'PRINCIPAL I',
  principal_signature: '',
  school_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  timezone: 'Asia/Manila',
  date_format: 'MM/DD/YYYY',
  default_theme: 'light',
  compact_tables: false,
  enable_push_notifications: true,
  enable_sms_notifications: false,
  notify_check_in: true,
  notify_check_out: true,
  notify_late: true,
  notify_early: true,
  phone_number: '',
};

function mergePreferences(
  previous: SystemPreferences,
  incoming: SystemPreferencesResponse,
): SystemPreferences {
  return {
    principal_name: incoming.principal_name ?? previous.principal_name,
    principal_position: incoming.principal_position ?? previous.principal_position,
    principal_signature: incoming.principal_signature ?? previous.principal_signature,
    school_year: incoming.school_year ?? previous.school_year,
    timezone: incoming.timezone ?? previous.timezone,
    date_format: incoming.date_format ?? previous.date_format,
    default_theme: incoming.default_theme ?? previous.default_theme,
    compact_tables: incoming.compact_tables ?? previous.compact_tables,
    enable_push_notifications: incoming.enable_push_notifications ?? previous.enable_push_notifications,
    enable_sms_notifications: incoming.enable_sms_notifications ?? previous.enable_sms_notifications,
    notify_check_in: incoming.notify_check_in ?? previous.notify_check_in,
    notify_check_out: incoming.notify_check_out ?? previous.notify_check_out,
    notify_late: incoming.notify_late ?? previous.notify_late,
    notify_early: incoming.notify_early ?? previous.notify_early,
    phone_number: incoming.phone_number ?? previous.phone_number,
  };
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-[#0B3A82]' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

function SignaturePad({ onChange }: { onChange: (signature: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = canvas.getBoundingClientRect().width;
    canvas.width = width * ratio;
    canvas.height = 180 * ratio;
    const context = canvas.getContext('2d');
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }, []);

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const beginDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.strokeStyle = '#0f172a';
    context.lineWidth = 2.4;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    isDrawing.current = true;
    lastPoint.current = point;
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current) return;
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    const point = pointFromEvent(event);
    const midpoint = {
      x: (lastPoint.current.x + point.x) / 2,
      y: (lastPoint.current.y + point.y) / 2,
    };
    context.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midpoint.x, midpoint.y);
    context.stroke();
    lastPoint.current = point;
  };

  const finishDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPoint.current = null;
    onChange(cropSignature(event.currentTarget));
  };

  const cropSignature = (canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d');
    if (!context) return canvas.toDataURL('image/png');
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    let left = canvas.width;
    let right = 0;
    let top = canvas.height;
    let bottom = 0;

    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (pixels.data[(y * canvas.width + x) * 4 + 3] > 0) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }

    if (right <= left || bottom <= top) return '';
    const padding = 16;
    const sourceX = Math.max(0, left - padding);
    const sourceY = Math.max(0, top - padding);
    const sourceWidth = Math.min(canvas.width - sourceX, right - left + padding * 2);
    const sourceHeight = Math.min(canvas.height - sourceY, bottom - top + padding * 2);
    const cropped = document.createElement('canvas');
    cropped.width = sourceWidth;
    cropped.height = sourceHeight;
    cropped.getContext('2d')?.drawImage(canvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
    return cropped.toDataURL('image/png');
  };

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Draw Signature</Label>
        <button type="button" onClick={clearDrawing} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600"><Eraser className="h-3.5 w-3.5" /> Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={beginDrawing}
        onPointerMove={draw}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
        className="h-[180px] w-full cursor-crosshair touch-none border border-slate-300 bg-white shadow-inner"
        aria-label="Draw the principal electronic signature"
      />
      <p className="text-xs text-slate-400">Use a mouse, stylus, or finger. Curves are smoothed automatically.</p>
    </div>
  );
}

export function SystemPreferencesForm() {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<SystemPreferences>(defaults);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [testSmsResult, setTestSmsResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    queryClient.fetchQuery({
      queryKey: ['system-preferences'],
      queryFn: async () => (await api.get<SystemPreferencesResponse>('/api/system/preferences')).data,
      staleTime: 5 * 60 * 1000,
    })
      .then(data => setPreferences(previous => mergePreferences(previous, data)))
      .catch(() => setError('Unable to load system preferences.'))
      .finally(() => setIsLoading(false));
  }, [queryClient]);

  const updatePreference = <K extends keyof SystemPreferences>(key: K, value: SystemPreferences[K]) => {
    setPreferences(previous => ({ ...previous, [key]: value }));
    setMessage(null);
    setError(null);
    setTestSmsResult(null);
  };

  const handleSignature = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Use a PNG, JPG, or WEBP signature image up to 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updatePreference('principal_signature', String(reader.result));
    reader.readAsDataURL(file);
  };

  const savePreferences = async () => {
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.post<{ settings: SystemPreferencesResponse }>('/api/system/preferences', { settings: preferences });
      const savedPreferences = mergePreferences(preferences, response.data.settings);
      setPreferences(savedPreferences);
      queryClient.setQueryData(['system-preferences'], savedPreferences);
      setMessage('System preferences saved and connected to the ID card.');
      window.dispatchEvent(new CustomEvent('system-preferences-updated', { detail: savedPreferences }));
    } catch (requestError: unknown) {
      const responseData = typeof requestError === 'object' && requestError !== null && 'response' in requestError
        ? (requestError as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
        : undefined;
      const validationMessage = responseData?.errors
        ? Object.values(responseData.errors).flat().join(' ')
        : responseData?.message;
      setError(validationMessage || 'Unable to save system preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const testSms = async () => {
    setIsTestingSms(true);
    setTestSmsResult(null);

    try {
      const response = await api.post('/api/system/preferences/test-sms', {
        phone_number: preferences.phone_number,
      });
      setTestSmsResult({ type: 'success', message: response.data.message });
    } catch (requestError: unknown) {
      const responseData = typeof requestError === 'object' && requestError !== null && 'response' in requestError
        ? (requestError as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
        : undefined;
      const validationMessage = responseData?.errors
        ? Object.values(responseData.errors).flat().join(' ')
        : responseData?.message;
      setTestSmsResult({ type: 'error', message: validationMessage || 'Unable to queue the test SMS.' });
    } finally {
      setIsTestingSms(false);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[420px] items-center justify-center text-slate-500"><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Loading preferences...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900">System Preferences</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage ID authorization, notifications, localization, and display defaults.</p>
        </div>
        <Button onClick={savePreferences} disabled={isSaving} className="h-11 bg-[#0B3A82] px-6 font-bold text-white hover:bg-[#092f69]">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      {message && <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />{message}</div>}
      {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <section className="border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <PenTool className="h-5 w-5 text-[#0B3A82]" />
          <div><h4 className="font-bold text-slate-900">Principal ID Authorization</h4><p className="text-xs text-slate-500">Printed in the third column on the back of every student ID.</p></div>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="space-y-2"><Label>Principal Name</Label><Input value={preferences.principal_name} onChange={event => updatePreference('principal_name', event.target.value)} placeholder="Full principal name" /></div>
            <div className="space-y-2"><Label>Position</Label><Input value={preferences.principal_position} onChange={event => updatePreference('principal_position', event.target.value)} placeholder="e.g. PRINCIPAL I" /></div>
            <div className="space-y-2"><Label>School Year</Label><Input value={preferences.school_year} onChange={event => updatePreference('school_year', event.target.value)} placeholder="2026-2027" /></div>
          </div>
          <div className="space-y-4">
            <Label>Principal E-Signature</Label>
            <div className="flex min-h-28 flex-col items-center justify-center border border-slate-200 bg-slate-50 p-4">
              {preferences.principal_signature ? (
                <img src={getImageUrl(preferences.principal_signature)} alt="Principal signature preview" className="max-h-20 max-w-full object-contain" />
              ) : (
                <span className="text-xs font-medium text-slate-400">Your uploaded or drawn signature preview appears here.</span>
              )}
            </div>
            <SignaturePad onChange={signature => updatePreference('principal_signature', signature)} />
            <div className="flex flex-col items-center border-2 border-dashed border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-semibold text-slate-500">Or upload an existing signature image</p>
              <label className="inline-flex cursor-pointer items-center gap-2 bg-[#0B3A82] px-4 py-2 text-sm font-bold text-white hover:bg-[#092f69]">
                <Upload className="h-4 w-4" /> Upload Signature
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleSignature} className="hidden" />
              </label>
              <p className="mt-2 text-center text-xs text-slate-400">Transparent PNG recommended. Maximum 2 MB.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        <section className="border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4"><Clock3 className="h-5 w-5 text-[#0B3A82]" /><h4 className="font-bold text-slate-900">Localization</h4></div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="space-y-2"><Label>Timezone</Label><select value={preferences.timezone} onChange={event => updatePreference('timezone', event.target.value)} className="h-10 w-full border border-slate-200 bg-white px-3 text-sm"><option value="Asia/Manila">Asia/Manila</option><option value="Asia/Shanghai">Asia/Shanghai</option><option value="UTC">UTC</option></select></div>
            <div className="space-y-2"><Label>Date Format</Label><select value={preferences.date_format} onChange={event => updatePreference('date_format', event.target.value)} className="h-10 w-full border border-slate-200 bg-white px-3 text-sm"><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option></select></div>
          </div>
        </section>

        <section className="border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
            <Bell className="h-5 w-5 text-[#0B3A82]" />
            <div>
              <h4 className="font-bold text-slate-900">Attendance Notifications</h4>
              <p className="text-xs text-slate-500">Admin-only controls for teacher push alerts and parent SMS delivery.</p>
            </div>
          </div>
          <div className="space-y-6 p-6">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-sm font-bold text-slate-800">Push notifications</p><p className="text-xs text-slate-500">Attendance alerts for assigned teachers.</p></div>
              <Toggle checked={preferences.enable_push_notifications} onChange={value => updatePreference('enable_push_notifications', value)} />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
              <div><p className="text-sm font-bold text-slate-800">Automated parent SMS notifications</p><p className="text-xs text-slate-500">Master switch for attendance messages sent through the modem SIM.</p></div>
              <Toggle checked={preferences.enable_sms_notifications} onChange={value => updatePreference('enable_sms_notifications', value)} />
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="mb-4 text-sm font-bold text-slate-800">Notify Parents When</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-center justify-between gap-3 border border-slate-200 p-4">
                  <div className="flex items-center gap-2"><Sun className="h-4 w-4 text-orange-400" /><span className="text-sm font-semibold text-slate-700">Check In</span></div>
                  <Toggle checked={preferences.notify_check_in} onChange={value => updatePreference('notify_check_in', value)} />
                </div>
                <div className="flex items-center justify-between gap-3 border border-slate-200 p-4">
                  <div className="flex items-center gap-2"><Sunrise className="h-4 w-4 text-orange-400" /><span className="text-sm font-semibold text-slate-700">Check Out</span></div>
                  <Toggle checked={preferences.notify_check_out} onChange={value => updatePreference('notify_check_out', value)} />
                </div>
                <div className="flex items-center justify-between gap-3 border border-slate-200 p-4">
                  <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-500" /><span className="text-sm font-semibold text-slate-700">Late Arrival</span></div>
                  <Toggle checked={preferences.notify_late} onChange={value => updatePreference('notify_late', value)} />
                </div>
                <div className="flex items-center justify-between gap-3 border border-slate-200 p-4">
                  <div className="flex items-center gap-2"><LogOut className="h-4 w-4 text-red-500" /><span className="text-sm font-semibold text-slate-700">Early Dismissal</span></div>
                  <Toggle checked={preferences.notify_early} onChange={value => updatePreference('notify_early', value)} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <Label htmlFor="sms-test-recipient">Test Recipient Number</Label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Input
                  id="sms-test-recipient"
                  value={preferences.phone_number}
                  onChange={event => updatePreference('phone_number', event.target.value)}
                  placeholder="09XX XXX XXXX"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={testSms}
                  disabled={isTestingSms || !preferences.phone_number.trim()}
                  className="shrink-0 font-bold"
                >
                  {isTestingSms ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {isTestingSms ? 'Queuing...' : 'Test SMS Alert'}
                </Button>
              </div>
              {testSmsResult && (
                <p className={`mt-3 text-sm font-semibold ${testSmsResult.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {testSmsResult.message}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">The modem SIM remains the sender for this test and all attendance alerts.</p>
            </div>
          </div>
        </section>
      </div>

      <section className="border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4"><Monitor className="h-5 w-5 text-[#0B3A82]" /><h4 className="font-bold text-slate-900">Display</h4></div>
        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <div className="space-y-2"><Label>Default Theme</Label><select value={preferences.default_theme} onChange={event => updatePreference('default_theme', event.target.value as SystemPreferences['default_theme'])} className="h-10 w-full border border-slate-200 bg-white px-3 text-sm"><option value="light">Light</option><option value="dark">Dark</option><option value="system">Use device setting</option></select></div>
          <div className="flex items-center justify-between gap-4 border border-slate-100 p-4"><div><p className="text-sm font-bold text-slate-800">Compact tables</p><p className="text-xs text-slate-500">Reduce table row spacing across dashboards.</p></div><Toggle checked={preferences.compact_tables} onChange={value => updatePreference('compact_tables', value)} /></div>
        </div>
      </section>
    </div>
  );
}
