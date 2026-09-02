"use client";

import { useState, useEffect } from 'react';
import { LifeBuoy, User, ChevronDown, Paperclip, Send, Settings2 } from "lucide-react";
import { SecuritySettings } from '@/components/settings/security-settings';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('support');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        setTimeout(() => setActiveTab(tab), 0);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans selection:bg-[#0B3A82] selection:text-white animate-in fade-in zoom-in-95 duration-500">
      
      {/* Page Header */}
      <div className="mb-10 max-w-[1200px] mx-auto">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-[15px] font-medium text-slate-500 mt-2">Manage your account preferences and submit support tickets.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-[1200px] mx-auto">
        
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0 space-y-2">
          
          <button 
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-none font-bold text-[14px] transition-all ${
              activeTab === 'support' 
                ? 'bg-white text-[#0B3A82] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-transparent'
            }`}
          >
            <LifeBuoy className={`w-5 h-5 ${activeTab === 'support' ? 'text-[#0B3A82]' : 'text-slate-400'}`} />
            Report and Feedback
          </button>

          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-none font-bold text-[14px] transition-all ${
              activeTab === 'account' 
                ? 'bg-white text-[#0B3A82] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-transparent'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'account' ? 'text-[#0B3A82]' : 'text-slate-400'}`} />
            Account Settings
          </button>

          <button 
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-none font-bold text-[14px] transition-all ${
              activeTab === 'preferences' 
                ? 'bg-white text-[#0B3A82] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-transparent'
            }`}
          >
            <Settings2 className={`w-5 h-5 ${activeTab === 'preferences' ? 'text-[#0B3A82]' : 'text-slate-400'}`} />
            System Preferences
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          
          {activeTab === 'support' && (
            <div className="bg-white rounded-none border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header Gradient */}
              <div className="bg-gradient-to-r from-[#8a1518] to-[#6c0f12] px-8 py-8 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-[-50%] right-[-10%] w-[200px] h-[200px] bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-[-50%] right-[10%] w-[150px] h-[150px] bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <h2 className="text-2xl font-black text-white flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
                    <LifeBuoy className="w-5 h-5 text-white" />
                  </div>
                  Submit Support Ticket
                </h2>
                <p className="text-white/80 text-[14px] font-medium mt-3 lg:ml-13 relative z-10 max-w-lg">
                  Our technical team will respond to your issue or feedback shortly. Please provide as much detail as possible.
                </p>
              </div>
              
              {/* Form Body */}
              <div className="p-8 space-y-8">
                
                <div className="space-y-3">
                  <Label className="text-[14px] font-bold text-slate-800 flex items-center gap-1.5">
                    Issue Description <span className="text-red-500 text-lg leading-none">*</span>
                  </Label>
                  <textarea 
                    className="w-full min-h-[140px] bg-slate-50 border border-slate-200 rounded-none p-4 text-[14px] font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#0B3A82]/10 focus:border-[#0B3A82]/40 transition-all resize-none placeholder:text-slate-400 placeholder:font-medium"
                    placeholder="Please describe the problem or feedback in detail..."
                  ></textarea>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-[14px] font-bold text-slate-800">Priority Level</Label>
                  <div className="relative">
                    <select className="w-full h-12 appearance-none bg-slate-50 border border-slate-200 rounded-none px-4 text-[14px] font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#0B3A82]/10 focus:border-[#0B3A82]/40 transition-all cursor-pointer">
                      <option value="low">🟢 Low - Feedback / General Question</option>
                      <option value="medium">🟡 Medium - Software Glitch</option>
                      <option value="high">🔴 High - Hardware/Scanner Failure</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-[14px] font-bold text-slate-800 flex justify-between items-end">
                    <span>Attachment</span>
                    <span className="text-slate-400 font-medium text-[12px]">Optional</span>
                  </Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-none p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-[#fff0f2]/50 hover:border-[#0B3A82]/30 transition-colors cursor-pointer group">
                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all text-slate-400 group-hover:text-[#0B3A82] group-hover:scale-110">
                      <Paperclip className="w-6 h-6" />
                    </div>
                    <span className="text-[14px] font-bold text-slate-700 group-hover:text-[#0B3A82] transition-colors mb-1">Click to upload image</span>
                    <span className="text-[12px] font-medium text-slate-400">PNG, JPG or GIF up to 5MB</span>
                  </div>
                </div>
                
                <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
                  <Button className="h-12 px-8 bg-[#8a1518] hover:bg-[#6c0f12] text-white text-[14px] font-bold rounded-none transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
                    Submit Ticket <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="bg-white rounded-none border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden p-8 sm:p-10 min-h-[400px]">
              <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Account Security</h3>
              <SecuritySettings />
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-white rounded-none border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 sm:p-10 flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Settings2 className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">System Preferences</h3>
              <p className="text-[15px] font-medium text-slate-500 max-w-sm">Adjust global notification rules, timezones, and display settings here in the next update.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
