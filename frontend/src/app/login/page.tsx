'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Mail, Lock, ShieldCheck, Wifi, LineChart, Bell, Shield, ArrowRight, Eye, EyeOff, Home, Users, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  const handleSuccessfulLogin = (data: any) => {
    localStorage.setItem('token', data.access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
    queryClient.clear();
    
    const role = data.user.roles[0];
    if (role === 'super-admin') router.push('/admin');
    else if (role === 'principal') router.push('/principal');
    else if (role === 'teacher') router.push('/teacher');
    else if (role === 'guard') router.push('/guard');
    else if (role === 'student') router.push('/student');
    else router.push('/');
  };

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await api.post('/api/login', { email, password });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.user.needs_password_change) {
        localStorage.setItem('needs_password_change', 'true');
        localStorage.setItem('user_role', data.user.roles[0]);
      } else {
        localStorage.removeItem('needs_password_change');
        localStorage.removeItem('user_role');
      }
      handleSuccessfulLogin(data);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      const msg = err.response?.data?.message;
      if (msg === 'maintenance') {
        setIsMaintenanceModalOpen(true);
        setError(null);
      } else {
        setError(msg || 'Login failed. Please check your credentials.');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex selection:bg-[#0B3A82] selection:text-white font-sans overflow-hidden">
      {/* Left Panel - Image Background */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col p-14 xl:p-20 overflow-hidden">
        
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/loginpagepic1.png)' }}
        ></div>
        
        {/* Clean white overlay - left heavy, fades naturally to right */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/80 via-white/60 to-white/10"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between max-w-2xl">
          {/* Header */}
          <div>
            {/* Logo - matches landing page style */}
            <div className="flex items-center gap-4 mb-14">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md p-1">
                <Image src="/school-logo.jpg" alt="School Logo" width={52} height={52} className="w-full h-full object-cover rounded-full" style={{ width: 'auto', height: 'auto' }} unoptimized priority />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[24px] leading-tight tracking-[0.03em] text-slate-800 drop-shadow-sm">Trento West Central</span>
                <span className="font-extrabold text-[16px] leading-tight tracking-[0.03em] text-slate-600 drop-shadow-sm">Elementary SPED Center</span>
              </div>
            </div>

            {/* Typography & Subheading */}
            <div className="mb-10">
              <h1 className="text-5xl xl:text-[52px] font-extrabold text-slate-900 leading-[1.15] mb-5 drop-shadow-sm">
                Smarter Attendance<br/>
                <span className="text-[#0B3A82]">for Modern Schools.</span>
              </h1>
              <p className="text-[19px] text-slate-700 font-medium leading-relaxed max-w-lg drop-shadow-sm">
                Manage attendance with secure QR technology, real-time insights, and effortless reporting — all in one intelligent platform.
              </p>
            </div>

            {/* Features List - no containers, clean inline icons */}
            <div className="space-y-6 mb-8">
              {[
                { icon: ShieldCheck, title: 'QR Attendance', desc: 'Instant and accurate scanning' },
                { icon: ShieldCheck, title: 'Smart ID System', desc: 'Secure student identification' },
                { icon: LineChart, title: 'Real-time Dashboard', desc: 'Live attendance monitoring' },
                { icon: Lock, title: 'Secure & Reliable', desc: 'Enterprise-grade protection' }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-5">
                  <feature.icon className="w-8 h-8 text-[#0B3A82] shrink-0 drop-shadow-sm" strokeWidth={2} />
                  <div>
                    <h3 className="text-[20px] font-bold text-slate-800 drop-shadow-sm">{feature.title}</h3>
                    <p className="text-[16px] text-slate-600 drop-shadow-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Layered Wavy Divider at Bottom */}
        <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 250" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ height: '180px' }}>
            <path d="M0 140C240 50 480 220 720 150C960 80 1200 200 1440 110V250H0V140Z" fill="#0B3A82" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 250" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ height: '180px' }}>
            <path d="M0 130C240 30 480 210 720 140C960 70 1200 190 1440 100L1440 115C1200 205 960 85 720 155C480 225 240 55 0 145Z" fill="#F5A623" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 250" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ height: '160px' }}>
            <path d="M0 150C240 60 480 230 720 160C960 90 1200 210 1440 120V250H0V150Z" fill="#0B3A82" />
          </svg>
        </div>
      </div>
      <div className="w-full lg:w-[45%] flex flex-col relative z-20 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)]">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden flex flex-col items-center justify-center pt-12 pb-6">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm p-1 border border-slate-100">
               <Image src="/school-logo.jpg" alt="School Logo" width={44} height={44} className="w-full h-full object-cover rounded-full" style={{ width: 'auto', height: 'auto' }} unoptimized priority />
             </div>
             <div className="flex flex-col">
               <span className="font-extrabold text-[16px] leading-tight tracking-[0.03em] text-[#0B3A82]">Trento West Central</span>
               <span className="font-extrabold text-[12px] leading-tight tracking-[0.03em] text-slate-500">Elementary SPED Center</span>
             </div>
           </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 w-full max-w-[580px] mx-auto">
          
          {/* Main Login Card */}
          <div className="w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 p-8 sm:p-12">
            
            <div className="text-center mb-10">
              <div className="mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-lg border border-slate-100 p-1">
                <Image src="/school-logo.jpg" alt="School Logo" width={56} height={56} className="w-full h-full object-cover rounded-full" style={{ width: 'auto', height: 'auto' }} unoptimized priority />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome Back!</h2>
              <p className="text-sm text-slate-500 font-medium">Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm bg-red-50 text-red-600 border border-red-100 rounded-lg font-medium text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-bold text-slate-800">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="guard@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-12 bg-slate-50 border-slate-200 focus:border-[#0B3A82] focus:ring-[#0B3A82]/20 rounded-xl transition-all text-slate-900 font-medium shadow-sm hover:border-slate-300"
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-[13px] font-bold text-slate-800">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-12 pr-12 bg-slate-50 border-slate-200 focus:border-[#0B3A82] focus:ring-[#0B3A82]/20 rounded-xl transition-all text-slate-900 font-medium shadow-sm hover:border-slate-300"
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center">
                  <input type="checkbox" id="remember" defaultChecked className="w-4 h-4 rounded border-slate-300 text-[#0B3A82] focus:ring-[#0B3A82] cursor-pointer" />
                  <Label htmlFor="remember" className="ml-2.5 text-sm font-semibold text-slate-700 cursor-pointer">Remember me</Label>
                </div>
                <a href="#" className="text-[13px] font-bold text-[#0B3A82] hover:text-[#154FA3] transition-colors">Forgot password?</a>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 bg-gradient-to-r from-[#0B3A82] to-[#154FA3] hover:from-[#154FA3] hover:to-[#0B3A82] text-white rounded-xl shadow-lg shadow-[#0B3A82]/25 font-bold text-[15px] transition-all flex items-center justify-center gap-2 mt-2 hover:shadow-xl hover:shadow-[#0B3A82]/30 hover:-translate-y-0.5"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>Sign In <ArrowRight className="w-5 h-5" /></>
                )}
              </Button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">OR CONTINUE WITH</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button 
                type="button" 
                onClick={() => router.push('/')}
                className="w-full py-3 text-[14px] font-semibold text-slate-500 hover:text-[#0B3A82] transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return to landing page
              </button>
            </form>
          </div>

        </div>
        
        {/* Footer */}
        <div className="mt-auto flex flex-col md:flex-row items-center justify-center gap-4 py-6 text-[11px] font-bold text-slate-400 w-full px-8">
          <p>&copy; 2026 Trento West Central Elementary SPED Center. All rights reserved.</p>
          <div className="hidden md:block w-px h-3 bg-slate-200"></div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <div className="w-px h-3 bg-slate-200"></div>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
            <span className="px-2 py-0.5 rounded-full bg-[#0B3A82]/10 text-[#0B3A82] font-black ml-2">v1.0.0</span>
          </div>
        </div>
      </div>
      
      {/* Maintenance Mode Modal */}
      <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl rounded-[24px]">
          <div className="bg-white p-8 sm:p-10 flex flex-col items-center justify-center text-center relative">
            {/* Custom SVG Illustration mimicking the image */}
            <div className="w-full max-w-[280px] h-[160px] relative mb-6">
               <svg viewBox="0 0 400 240" className="w-full h-full">
                  {/* Background faint gears / shapes */}
                  <circle cx="100" cy="120" r="30" fill="#f0f6ff" opacity="0.6" />
                  <path d="M 100 80 L 100 90 M 100 150 L 100 160 M 60 120 L 70 120 M 130 120 L 140 120" stroke="#f0f6ff" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
                  <circle cx="320" cy="90" r="40" fill="#f0f6ff" opacity="0.4" />
                  <circle cx="150" cy="60" r="15" fill="#f0f6ff" />
                  <circle cx="280" cy="180" r="20" fill="#f0f6ff" />
                  
                  {/* Monitor Base & Screen */}
                  <rect x="110" y="70" width="180" height="110" rx="8" fill="white" stroke="#93c5fd" strokeWidth="4" />
                  <rect x="110" y="70" width="180" height="24" rx="8" fill="#93c5fd" />
                  {/* Straighten the top bar bottom to remove bottom radius */}
                  <rect x="110" y="80" width="180" height="14" fill="#93c5fd" />
                  <circle cx="130" cy="82" r="3" fill="white" />
                  <circle cx="142" cy="82" r="3" fill="white" />
                  <circle cx="154" cy="82" r="3" fill="white" />
                  
                  <rect x="175" y="180" width="50" height="15" fill="#bfdbfe" />
                  <path d="M 150 195 L 250 195 L 240 200 L 160 200 Z" fill="#93c5fd" />
                  <path d="M 80 200 L 320 200" stroke="#bfdbfe" strokeWidth="4" strokeLinecap="round" />
                  
                  {/* Barrier (background) */}
                  <rect x="230" y="150" width="80" height="16" rx="2" fill="#fed7aa" />
                  <path d="M 235 150 L 245 166 M 255 150 L 265 166 M 275 150 L 285 166 M 295 150 L 305 166" stroke="#ea580c" strokeWidth="8" />
                  <rect x="230" y="150" width="80" height="16" rx="2" fill="none" stroke="#ea580c" strokeWidth="2" />
                  <rect x="240" y="166" width="6" height="34" fill="#f97316" />
                  <rect x="280" y="166" width="6" height="34" fill="#f97316" />
                  
                  {/* Gear and Wrench (Center focus) */}
                  <g transform="translate(200, 130)">
                    {/* Teeth */}
                    <path d="M -8 -42 L 8 -42 L 12 -30 L -12 -30 Z" fill="#0B3A82" />
                    <path d="M -8 42 L 8 42 L 12 30 L -12 30 Z" fill="#0B3A82" />
                    <path d="M -42 -8 L -42 8 L -30 12 L -30 -12 Z" fill="#0B3A82" />
                    <path d="M 42 -8 L 42 8 L 30 12 L 30 -12 Z" fill="#0B3A82" />
                    <path d="M -30 -30 L -18 -40 L -12 -28 L -24 -20 Z" fill="#0B3A82" transform="rotate(15)" />
                    <path d="M 30 30 L 18 40 L 12 28 L 24 20 Z" fill="#0B3A82" transform="rotate(15)" />
                    <path d="M 30 -30 L 40 -18 L 28 -12 L 20 -24 Z" fill="#0B3A82" transform="rotate(15)" />
                    <path d="M -30 30 L -40 18 L -28 12 L -20 24 Z" fill="#0B3A82" transform="rotate(15)" />
                    
                    <circle cx="0" cy="0" r="32" fill="#0B3A82" />
                    <circle cx="0" cy="0" r="14" fill="white" />
                    
                    {/* Wrench */}
                    <path d="M -12 12 L -24 24 A 6 6 0 0 0 -16 32 L -4 20" fill="white" />
                    <path d="M -6 16 L 4 6 A 12 12 0 1 1 18 -8 C 12 -2 8 2 0 6 Z" fill="white" />
                  </g>
                  
                  {/* Left Cone */}
                  <path d="M 100 200 L 115 150 L 130 200 Z" fill="#f97316" />
                  <path d="M 106 180 L 124 180" stroke="white" strokeWidth="8" />
                  <path d="M 112 160 L 118 160" stroke="white" strokeWidth="6" />
                  <rect x="95" y="194" width="40" height="6" rx="2" fill="#ea580c" />
                  
                  {/* Right Cone */}
                  <path d="M 270 200 L 282 160 L 294 200 Z" fill="#f97316" />
                  <path d="M 274 185 L 290 185" stroke="white" strokeWidth="6" />
                  <rect x="265" y="194" width="34" height="6" rx="2" fill="#ea580c" />
                  
                  {/* Warning Sign */}
                  <circle cx="285" cy="140" r="16" fill="#ef4444" stroke="white" strokeWidth="3" />
                  <path d="M 285 130 L 285 142 M 285 148 L 285 149" stroke="white" strokeWidth="4" strokeLinecap="round" />
                  
                  {/* Some floating UI elements on monitor */}
                  <rect x="125" y="110" width="20" height="20" rx="4" fill="#f0f6ff" stroke="#93c5fd" strokeWidth="2" strokeDasharray="2 2" />
                  <rect x="130" y="115" width="10" height="10" fill="#bfdbfe" />
                  <circle cx="260" cy="115" r="4" fill="#bfdbfe" />
                  <circle cx="270" cy="115" r="4" fill="#bfdbfe" />
               </svg>
            </div>
            
            <DialogTitle className="text-[24px] font-black text-slate-900 mb-0 tracking-tight">System Maintenance</DialogTitle>
            <div className="w-8 h-[3px] rounded-full bg-[#0B3A82] mx-auto mt-4 mb-5"></div>
            
            <DialogDescription className="text-[14px] font-medium text-slate-600 leading-relaxed max-w-[400px] mx-auto mb-8">
              Trento West Central Elementary SPED Center is currently undergoing maintenance to improve your user experience. We would like to say sorry for the inconveniences while the system have ongoing repairs and updates.
            </DialogDescription>
            
            {/* Notification Box */}
            <div className="w-full bg-[#0B3A82]/5 rounded-2xl p-4 flex items-center gap-4 mb-8 text-left border border-[#0B3A82]/10">
              <div className="w-10 h-10 rounded-full bg-[#0B3A82] flex items-center justify-center shrink-0 shadow-md">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#0B3A82] tracking-tight">We will notify you as soon as possible.</span>
                <span className="text-[13px] font-semibold text-slate-500 mt-1">Thank you for your understanding.</span>
              </div>
            </div>
            
            <Button onClick={() => setIsMaintenanceModalOpen(false)} className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0B3A82] to-[#154FA3] hover:from-[#154FA3] hover:to-[#0B3A82] text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Got it, thanks! <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
