'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Palette, MessageSquare, Star, Settings as SettingsIcon, Bell, Send, Lock, Smartphone, Moon, Sun, Monitor, User } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function StudentSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, setTheme } = useTheme();
  
  // Dummy states for interactions
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, currentState: boolean, featureName: string) => {
    const newState = !currentState;
    setter(newState);
    localStorage.setItem('toast_message', `${featureName} ${newState ? 'enabled' : 'disabled'}`);
  };

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: User },
    { id: 'account', name: 'Account & Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'feedback', name: 'Report & Feedback', icon: MessageSquare },
    { id: 'reviews', name: 'App Reviews', icon: Star },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <Card className="border border-slate-100 shadow-sm bg-white dark:bg-[#161920] dark:border-white/5 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Profile Information</CardTitle>
              <CardDescription>Update your personal details and public profile.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">First Name</label>
                  <input type="text" defaultValue="Alex" className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-maroon-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Last Name</label>
                  <input type="text" defaultValue="Student" className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-maroon-500/50" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                <input type="email" defaultValue="student@school.edu" className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-maroon-500/50" />
              </div>
              <div className="pt-4 flex justify-end">
                <button className="bg-maroon-600 hover:bg-maroon-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors">
                  Save Changes
                </button>
              </div>
            </CardContent>
          </Card>
        );

      case 'account':
        return (
          <Card className="border border-slate-100 shadow-sm bg-white dark:bg-[#161920] dark:border-white/5 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Account & Security</CardTitle>
              <CardDescription>Manage your password and security preferences.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-maroon-600" />
                  Change Password
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Current Password</label>
                    <input type="password" placeholder="••••••••" className="mt-1 w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-maroon-500/50" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Password</label>
                      <input type="password" placeholder="••••••••" className="mt-1 w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-maroon-500/50" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                      <input type="password" placeholder="••••••••" className="mt-1 w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-maroon-500/50" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="bg-maroon-600 hover:bg-maroon-700 text-white px-5 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm">
                    Update Password
                  </button>
                </div>
              </div>
              
              <div className="border-t border-slate-100 dark:border-white/5 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-maroon-600" />
                      Two-Factor Authentication (2FA)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={twoFactor} onChange={() => handleToggle(setTwoFactor, twoFactor, 'Two-Factor Authentication')} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-maroon-600"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'notifications':
        return (
          <Card className="border border-slate-100 shadow-sm bg-white dark:bg-[#161920] dark:border-white/5 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Notification Preferences</CardTitle>
              <CardDescription>Control how you want to be notified about updates.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0f1115] rounded-xl border border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Email Notifications</h3>
                  <p className="text-xs text-slate-500 mt-1">Receive daily attendance summaries and notices via email.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={emailNotif} onChange={() => handleToggle(setEmailNotif, emailNotif, 'Email Notifications')} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-maroon-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0f1115] rounded-xl border border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Push Notifications</h3>
                  <p className="text-xs text-slate-500 mt-1">Real-time alerts for schedule alarms and messages.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={pushNotif} onChange={() => handleToggle(setPushNotif, pushNotif, 'Push Notifications')} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-maroon-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>
        );

      case 'appearance':
        return (
          <Card className="border border-slate-100 shadow-sm bg-white dark:bg-[#161920] dark:border-white/5 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Appearance</CardTitle>
              <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Light Theme */}
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-maroon-600 bg-maroon-50 dark:bg-maroon-900/10' : 'border-slate-100 dark:border-white/5 hover:border-slate-300'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                    <Sun className="w-6 h-6 text-amber-500" />
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Light Mode</span>
                </button>
                
                {/* Dark Theme */}
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-maroon-600 bg-maroon-50 dark:bg-maroon-900/10' : 'border-slate-100 dark:border-white/5 hover:border-slate-300'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                    <Moon className="w-6 h-6 text-slate-300" />
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Dark Mode</span>
                </button>

                {/* System Theme */}
                <button 
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-maroon-600 bg-maroon-50 dark:bg-maroon-900/10' : 'border-slate-100 dark:border-white/5 hover:border-slate-300'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#0f1115] flex items-center justify-center mb-3 border border-slate-200 dark:border-white/10">
                    <Monitor className="w-6 h-6 text-slate-500" />
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">System Default</span>
                </button>
              </div>
            </CardContent>
          </Card>
        );

      case 'feedback':
        return (
          <Card className="border border-slate-100 shadow-sm bg-white dark:bg-[#161920] dark:border-white/5 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Report & Feedback</CardTitle>
              <CardDescription>Found a bug or have a suggestion? Let us know!</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Feedback Type</label>
                <select className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-maroon-500/50">
                  <option>Bug Report</option>
                  <option>Feature Request</option>
                  <option>General Feedback</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
                <textarea rows={5} placeholder="Describe your issue or suggestion in detail..." className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-maroon-500/50 resize-none"></textarea>
              </div>
              <div className="pt-2 flex justify-end">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </button>
              </div>
            </CardContent>
          </Card>
        );

      case 'reviews':
        return (
          <Card className="border border-slate-100 shadow-sm bg-white dark:bg-[#161920] dark:border-white/5 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">App Reviews</CardTitle>
              <CardDescription>Rate your experience using the School Attendance System.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-8 bg-slate-50 dark:bg-[#0f1115] rounded-xl border border-slate-100 dark:border-white/5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">How would you rate this app?</h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} className="p-2 hover:scale-110 transition-transform">
                      <Star className="w-8 h-8 text-slate-300 dark:text-slate-700 hover:text-amber-400 dark:hover:text-amber-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Write a Review (Optional)</label>
                <textarea rows={4} placeholder="Tell us what you love or what could be improved..." className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-maroon-500/50 resize-none"></textarea>
              </div>
              <div className="pt-2 flex justify-end">
                <button className="bg-maroon-600 hover:bg-maroon-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2">
                  Post Review
                </button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 pb-20 max-w-6xl mx-auto h-full overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-maroon-50 dark:bg-maroon-900/20 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-maroon-600 dark:text-maroon-400" />
            </div>
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-13">Manage your account preferences, notifications, and system feedback.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left Sidebar Menu */}
          <Card className="w-full md:w-72 shrink-0 flex flex-col gap-1 border border-slate-100 shadow-sm bg-white dark:bg-[#161920] dark:border-white/5 rounded-2xl p-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm transition-all text-left ${
                    isActive 
                      ? 'bg-maroon-50 text-maroon-700 dark:bg-maroon-500/10 dark:text-maroon-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${isActive ? 'text-maroon-600 dark:text-maroon-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  {tab.name}
                </button>
              );
            })}
          </Card>

          {/* Right Content Area */}
          <div className="flex-1 w-full animate-in fade-in slide-in-from-right-4 duration-500">
            {renderContent()}
          </div>
          
        </div>
      </div>
    </DashboardLayout>
  );
}
