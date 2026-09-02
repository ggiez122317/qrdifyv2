'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings as SettingsIcon, Clock, Bell, Save, CheckCircle2, Info, ChevronDown, Sun, Sunrise, LogOut, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SecuritySettings } from '@/components/settings/security-settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    school_start_time: '07:30',
    late_threshold: '07:45',
    school_end_time: '16:00',
    enable_sms_notifications: false,
    notify_check_in: true,
    notify_check_out: true,
    notify_late: true,
    notify_early: true,
    phone_number: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [testSmsResult, setTestSmsResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/principal/settings');
        // Merge with existing defaults in case backend doesn't have all new fields yet
        setSettings(prev => ({ ...prev, ...res.data }));
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
    setTestSmsResult(null);
  };

  const handleTestSms = async () => {
    setIsTestingSms(true);
    setTestSmsResult(null);

    try {
      const response = await api.post('/api/principal/settings/test-sms', {
        phone_number: settings.phone_number,
      });
      setTestSmsResult({ type: 'success', message: response.data.message });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.errors?.phone_number?.[0]
          ?? error.response?.data?.message
          ?? 'Unable to queue the test SMS.'
        : 'Unable to queue the test SMS.';
      setTestSmsResult({ type: 'error', message });
    } finally {
      setIsTestingSms(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/api/principal/settings', { settings });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <SettingsIcon className="w-12 h-12 animate-spin-slow mb-4 opacity-50" />
        <p>Loading System Configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-[#F8FAFC] min-h-screen">
      
      {/* Header Section (Uniform with Employees Page) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight">System Settings</h1>
          <p className="text-slate-500 text-[15px] font-medium mt-1">Configure global parameters for attendance, thresholds, and notifications.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <span className="flex items-center gap-2 text-emerald-600 font-bold text-[14px] animate-in fade-in slide-in-from-right-4 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 h-[46px]">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully
            </span>
          )}
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#a81616] hover:bg-[#8b1111] text-white font-bold h-[46px] px-6 rounded-xl shadow-sm disabled:opacity-70 transition-all text-[15px]"
          >
            {isSaving ? (
              <SettingsIcon className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* School Hours & Attendance Thresholds */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-5 flex flex-row items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-slate-800 text-[17px] font-extrabold">School Hours & Attendance Thresholds</CardTitle>
            <CardDescription className="text-[13px] font-medium text-slate-500">
              Define when the school opens, closes, and when a student is officially marked as &quot;<span className="text-amber-600 font-bold">Late</span>&quot;.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
            {/* Left Column */}
            <div className="space-y-10">
              <div className="space-y-3">
                <label className="text-[15px] font-bold text-slate-800">School Start Time</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <Clock className="w-[18px] h-[18px] text-slate-400" />
                  </div>
                  <input 
                    type="time" 
                    value={settings.school_start_time}
                    onChange={(e) => handleChange('school_start_time', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-[15px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                  />
                  <div className="absolute right-4 pointer-events-none">
                    <ChevronDown className="w-[18px] h-[18px] text-slate-400" />
                  </div>
                </div>
                <p className="text-[13px] font-medium text-slate-500">The official time classes begin.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[15px] font-bold text-slate-800">School End Time</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <Clock className="w-[18px] h-[18px] text-slate-400" />
                  </div>
                  <input 
                    type="time" 
                    value={settings.school_end_time}
                    onChange={(e) => handleChange('school_end_time', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-[15px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                  />
                  <div className="absolute right-4 pointer-events-none">
                    <ChevronDown className="w-[18px] h-[18px] text-slate-400" />
                  </div>
                </div>
                <p className="text-[13px] font-medium text-slate-500">The official time classes end.</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-10">
              <div className="space-y-3">
                <label className="text-[15px] font-bold text-slate-800">Late Threshold</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <Clock className="w-[18px] h-[18px] text-slate-400" />
                  </div>
                  <input 
                    type="time" 
                    value={settings.late_threshold}
                    onChange={(e) => handleChange('late_threshold', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-[15px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                  />
                  <div className="absolute right-4 pointer-events-none">
                    <ChevronDown className="w-[18px] h-[18px] text-slate-400" />
                  </div>
                </div>
                <p className="text-[13px] font-medium text-slate-500">Scans after this time are marked as <span className="font-bold text-amber-600">Late</span>.</p>
              </div>

              {/* Info Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start gap-4 mt-2">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-4 h-4 text-slate-500" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-slate-900 text-[15px]">About Late Threshold</h4>
                  <p className="text-[13px] font-medium text-slate-600 mt-2 leading-relaxed">
                    Any scan time as the student&apos;s first entry after the late threshold will be automatically counted as <span className="font-bold text-amber-600">Late</span> by the system.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-5 flex flex-row items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-slate-800 text-[17px] font-extrabold">Notification Settings</CardTitle>
            <CardDescription className="text-[13px] font-medium text-slate-500">
              Configure automated SMS alerts to parents when students scan their RFID.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4 bg-slate-50/60">
              <div>
                <p className="text-[15px] font-bold text-slate-800">Automated SMS Notifications</p>
                <p className="text-[13px] font-medium text-slate-500 mt-1">Enable parent messages for accepted attendance scans.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.enable_sms_notifications}
                onClick={() => handleChange('enable_sms_notifications', !settings.enable_sms_notifications)}
                className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${settings.enable_sms_notifications ? 'bg-[#a81616]' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-all ${settings.enable_sms_notifications ? 'left-[22px]' : 'left-[2px]'}`}></span>
              </button>
            </div>

            <label className="text-[15px] font-bold text-slate-800">Notify Parents When</label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              
              {/* Toggle: Check In */}
              <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-white hover:border-slate-300 transition-colors cursor-pointer" onClick={() => handleChange('notify_check_in', !settings.notify_check_in)}>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-orange-400" />
                  <span className="text-[13px] font-bold text-slate-800">Check In <span className="font-medium text-slate-500">(Morning)</span></span>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-colors ${settings.notify_check_in ? 'bg-[#a81616]' : 'bg-slate-200'}`}>
                  <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-all ${settings.notify_check_in ? 'left-[22px]' : 'left-[2px]'}`}></div>
                </div>
              </div>

              {/* Toggle: Check Out */}
              <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-white hover:border-slate-300 transition-colors cursor-pointer" onClick={() => handleChange('notify_check_out', !settings.notify_check_out)}>
                <div className="flex items-center gap-2">
                  <Sunrise className="w-4 h-4 text-orange-400" />
                  <span className="text-[13px] font-bold text-slate-800">Check Out <span className="font-medium text-slate-500">(Dismissal)</span></span>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-colors ${settings.notify_check_out ? 'bg-[#a81616]' : 'bg-slate-200'}`}>
                  <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-all ${settings.notify_check_out ? 'left-[22px]' : 'left-[2px]'}`}></div>
                </div>
              </div>

              {/* Toggle: Late Arrival */}
              <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-white hover:border-slate-300 transition-colors cursor-pointer" onClick={() => handleChange('notify_late', !settings.notify_late)}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-[13px] font-bold text-slate-800">Late Arrival</span>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-colors ${settings.notify_late ? 'bg-[#a81616]' : 'bg-slate-200'}`}>
                  <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-all ${settings.notify_late ? 'left-[22px]' : 'left-[2px]'}`}></div>
                </div>
              </div>

              {/* Toggle: Early Dismissal */}
              <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-white hover:border-slate-300 transition-colors cursor-pointer" onClick={() => handleChange('notify_early', !settings.notify_early)}>
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span className="text-[13px] font-bold text-slate-800">Early Dismissal</span>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-colors ${settings.notify_early ? 'bg-[#a81616]' : 'bg-slate-200'}`}>
                  <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-all ${settings.notify_early ? 'left-[22px]' : 'left-[2px]'}`}></div>
                </div>
              </div>

            </div>

            <div className="pt-6">
              <label className="text-[15px] font-bold text-slate-800 mb-3 block">Test Recipient Number</label>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <input 
                  type="text" 
                  value={settings.phone_number}
                  onChange={(e) => handleChange('phone_number', e.target.value)}
                  placeholder="09XX XXX XXXX"
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 h-[46px] text-[15px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium w-full"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestSms}
                  disabled={isTestingSms || !settings.phone_number.trim()}
                  className="h-[46px] rounded-xl px-6 font-bold text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center gap-2 shrink-0 w-full sm:w-auto"
                >
                  <Send className="w-4 h-4" />
                  {isTestingSms ? 'Queuing...' : 'Test SMS Alert'}
                </Button>
              </div>
              {testSmsResult && (
                <p className={`text-[13px] font-semibold mt-3 ${testSmsResult.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {testSmsResult.message}
                </p>
              )}
              <p className="text-[13px] font-medium text-slate-500 mt-3">The modem will send a test message to this number. The modem SIM remains the sender.</p>
            </div>
            
          </div>

        </CardContent>
      </Card>

      {/* Account Security Settings */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-5 flex flex-row items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-slate-800 text-[17px] font-extrabold">Account Security</CardTitle>
            <CardDescription className="text-[13px] font-medium text-slate-500">
              Update your password to keep your account secure.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <SecuritySettings />
        </CardContent>
      </Card>

    </div>
  );
}
