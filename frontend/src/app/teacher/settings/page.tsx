'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings as SettingsIcon, Bell, Save, CheckCircle2, User, Mail, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TeacherSettingsPage() {
  const [settings, setSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    phone_number: '+63 912 345 6789',
    display_name: 'Teacher Mary',
    email: 'mary.teacher@school.edu'
  });
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // In a real implementation, we would fetch from /api/teacher/settings
  // useEffect(() => { ... }, []);

  const handleChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // await api.post('/api/teacher/settings', { settings });
      // Mock network delay
      await new Promise(resolve => setTimeout(resolve, 800));
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
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
          <SettingsIcon className="w-12 h-12 animate-spin-slow mb-4 opacity-50" />
          <p>Loading Account Settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-[#F8FAFC] min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight">Account Settings</h1>
          <p className="text-slate-500 text-[15px] font-medium mt-1">Manage your personal profile and notification preferences.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <span className="flex items-center gap-2 text-emerald-600 font-bold text-[14px] animate-in fade-in slide-in-from-right-4 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 h-[46px]">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Information */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-5 flex flex-row items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex flex-col space-y-1">
              <CardTitle className="text-slate-800 text-[17px] font-extrabold">Profile Information</CardTitle>
              <CardDescription className="text-[13px] font-medium text-slate-500">
                Update your contact details and display name.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[15px] font-bold text-slate-800">Display Name</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <User className="w-[18px] h-[18px] text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    value={settings.display_name}
                    onChange={(e) => handleChange('display_name', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-[15px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[15px] font-bold text-slate-800">Email Address</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <Mail className="w-[18px] h-[18px] text-slate-400" />
                  </div>
                  <input 
                    type="email" 
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-[15px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[15px] font-bold text-slate-800">Phone Number</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <Phone className="w-[18px] h-[18px] text-slate-400" />
                  </div>
                  <input 
                    type="tel" 
                    value={settings.phone_number}
                    onChange={(e) => handleChange('phone_number', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-[15px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-slate-900 text-[15px]">Security Notice</h4>
                <p className="text-[13px] font-medium text-slate-600 mt-2 leading-relaxed">
                  Your password can only be reset by the school administrator. Please contact the Principal&apos;s office if you need to update your credentials.
                </p>
              </div>
            </div>
            
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-5 flex flex-row items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex flex-col space-y-1">
              <CardTitle className="text-slate-800 text-[17px] font-extrabold">Notifications</CardTitle>
              <CardDescription className="text-[13px] font-medium text-slate-500">
                How you prefer to be alerted.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            
            {/* Toggle: Email */}
            <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-white hover:border-slate-300 transition-colors cursor-pointer" onClick={() => handleChange('email_notifications', !settings.email_notifications)}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-slate-800">Email Alerts</span>
                  <span className="text-[12px] font-medium text-slate-500">Daily attendance summaries</span>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors ${settings.email_notifications ? 'bg-[#a81616]' : 'bg-slate-200'}`}>
                <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-all ${settings.email_notifications ? 'left-[22px]' : 'left-[2px]'}`}></div>
              </div>
            </div>

            {/* Toggle: SMS */}
            <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-white hover:border-slate-300 transition-colors cursor-pointer" onClick={() => handleChange('sms_notifications', !settings.sms_notifications)}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-slate-800">SMS Alerts</span>
                  <span className="text-[12px] font-medium text-slate-500">Urgent leave requests</span>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors ${settings.sms_notifications ? 'bg-[#a81616]' : 'bg-slate-200'}`}>
                <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-all ${settings.sms_notifications ? 'left-[22px]' : 'left-[2px]'}`}></div>
              </div>
            </div>

          </CardContent>
        </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}
