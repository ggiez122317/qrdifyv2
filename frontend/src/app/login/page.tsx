'use client';

// Trigger rebuild
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Mail, Lock, ShieldCheck, CheckCircle2, Wifi, LineChart, Bell, Shield, ArrowRight, Eye, EyeOff, Users, Calendar, Home } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/login', { email, password });
      return response.data;
    },
    onSuccess: (data) => {
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
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex selection:bg-[#7a1315] selection:text-white font-sans overflow-hidden">
      {/* Left Panel - Hidden on smaller screens */}
      <div className="hidden lg:flex lg:w-[50%] relative bg-gradient-to-br from-[#fff0f2] via-[#ffe6e9] to-[#ffebeb] flex-col p-12 xl:p-16 border-r border-red-50">
        
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d4a5a8 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-[#ffccd2] to-transparent rounded-full blur-3xl opacity-60 pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-tr from-[#ffd4da] to-transparent rounded-full blur-3xl opacity-60 pointer-events-none z-0"></div>
        <div className="absolute bottom-[5%] left-[2%] w-[120px] h-[120px] bg-gradient-to-br from-[#ffb3bc] to-[#ffa3ad] rounded-full blur-sm opacity-90 shadow-2xl pointer-events-none z-10"></div>
        <div className="absolute top-[10%] right-[5%] w-[80px] h-[80px] bg-gradient-to-bl from-[#ffb3bc] to-[#ffa3ad] rounded-full blur-sm opacity-60 shadow-xl pointer-events-none z-10"></div>

        <div className="relative z-10 flex flex-col h-full justify-between max-w-xl">
          {/* Header */}
          <div>
            <div className="flex flex-col items-start mb-12">
              <div className="flex items-center gap-1.5">
                <span className="text-4xl font-black text-[#7a1315] tracking-tight">Q</span>
                <span className="text-4xl font-black text-slate-900 tracking-tight">RIDIFY</span>
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 flex gap-2">
                <span>SMART</span><span className="text-maroon-700 font-black">•</span><span>SECURE</span><span className="text-maroon-700 font-black">•</span><span>SEAMLESS</span>
              </div>
            </div>

            {/* Typography & Subheading */}
            <div className="mb-8 relative z-20">
              <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
                Smart & Secure<br/>
                <span className="text-[#7a1315]">Attendance Platform</span>
              </h1>
              <p className="text-[15px] text-slate-600 font-medium leading-relaxed max-w-sm">
                Manage attendance, students, teachers, and reports efficiently in one centralized system.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              {[
                { icon: ShieldCheck, title: 'Fast QR Scanning', desc: 'Quick and accurate verification' },
                { icon: Wifi, title: 'RFID Support', desc: 'Seamless RFID card scanning' },
                { icon: LineChart, title: 'Real-time Dashboard', desc: 'Live attendance monitoring' },
                { icon: Bell, title: 'Instant Notifications', desc: 'Stay updated in real-time' },
                { icon: Lock, title: 'Secure & Reliable', desc: 'Enterprise-grade security' }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/60 border border-white flex items-center justify-center shadow-sm shrink-0">
                    <feature.icon className="w-5 h-5 text-[#7a1315]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{feature.title}</h3>
                    <p className="text-[11px] font-medium text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="flex items-center gap-4 mt-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/50 flex flex-col items-center flex-1 text-center">
              <Users className="w-5 h-5 text-[#7a1315] mb-2" />
              <span className="text-xl font-black text-slate-900">1,428</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Students Today</span>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/50 flex flex-col items-center flex-1 text-center relative overflow-hidden">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7a1315] to-transparent"></div>
              <CheckCircle2 className="w-5 h-5 text-[#7a1315] mb-2" />
              <span className="text-xl font-black text-slate-900">98.6%</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Attendance Rate</span>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/50 flex flex-col items-center flex-1 text-center">
              <Calendar className="w-5 h-5 text-[#7a1315] mb-2" />
              <span className="text-xl font-black text-slate-900">56</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Classes Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[50%] flex flex-col relative z-20">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden flex flex-col items-center justify-center pt-12 pb-6">
           <div className="flex items-center gap-1.5">
             <span className="text-3xl font-black text-[#7a1315]">Q</span>
             <span className="text-3xl font-black text-slate-900">RIDIFY</span>
           </div>
           <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">SMART • SECURE • SEAMLESS</div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 w-full max-w-[580px] mx-auto">
          
          {/* Main Login Card */}
          <div className="w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 p-8 sm:p-12">
            
            <div className="text-center mb-10">
              <div className="mx-auto w-14 h-14 rounded-full bg-[#fff0f2] flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-[#7a1315]" strokeWidth={2.5} />
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
                    className="h-12 pl-12 bg-white border-slate-200 focus:border-[#7a1315] focus:ring-[#7a1315]/20 rounded-xl transition-all text-slate-900 font-medium shadow-sm"
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
                    className="h-12 pl-12 pr-12 bg-white border-slate-200 focus:border-[#7a1315] focus:ring-[#7a1315]/20 rounded-xl transition-all text-slate-900 font-medium shadow-sm"
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
                  <input type="checkbox" id="remember" defaultChecked className="w-4 h-4 rounded border-slate-300 text-[#7a1315] focus:ring-[#7a1315] cursor-pointer" />
                  <Label htmlFor="remember" className="ml-2.5 text-sm font-semibold text-slate-700 cursor-pointer">Remember me</Label>
                </div>
                <a href="#" className="text-[13px] font-bold text-[#7a1315] hover:text-maroon-800 transition-colors">Forgot password?</a>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 bg-[#8a1518] hover:bg-[#6c0f12] text-white rounded-xl shadow-lg font-bold text-[15px] transition-all flex items-center justify-center gap-2 mt-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Authenticating...' : (
                  <>Sign In <ArrowRight className="w-5 h-5" /></>
                )}
              </Button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">OR CONTINUE WITH</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <Button 
                type="button" 
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full h-14 bg-white border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl shadow-sm font-bold text-[14px] transition-all flex items-center justify-center gap-3"
              >
                <Home className="w-5 h-5 text-slate-500" />
                Return to landing page
              </Button>
            </form>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-[13px] font-medium">
            <Shield className="w-4 h-4 text-emerald-500" />
            Protected with enterprise security
          </div>

        </div>
        
        {/* Footer */}
        <div className="mt-auto flex flex-col md:flex-row items-center justify-center gap-4 py-6 text-[11px] font-bold text-slate-400 w-full px-8">
          <p>© 2026 Qridify. All rights reserved.</p>
          <div className="hidden md:block w-px h-3 bg-slate-200"></div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <div className="w-px h-3 bg-slate-200"></div>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-black ml-2">v1.0.0</span>
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
                  <circle cx="100" cy="120" r="30" fill="#fff1f2" opacity="0.6" />
                  <path d="M 100 80 L 100 90 M 100 150 L 100 160 M 60 120 L 70 120 M 130 120 L 140 120" stroke="#fff1f2" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
                  <circle cx="320" cy="90" r="40" fill="#fff1f2" opacity="0.4" />
                  <circle cx="150" cy="60" r="15" fill="#fff1f2" />
                  <circle cx="280" cy="180" r="20" fill="#fff1f2" />
                  
                  {/* Monitor Base & Screen */}
                  <rect x="110" y="70" width="180" height="110" rx="8" fill="white" stroke="#fda4af" strokeWidth="4" />
                  <rect x="110" y="70" width="180" height="24" rx="8" fill="#fda4af" />
                  {/* Straighten the top bar bottom to remove bottom radius */}
                  <rect x="110" y="80" width="180" height="14" fill="#fda4af" />
                  <circle cx="130" cy="82" r="3" fill="white" />
                  <circle cx="142" cy="82" r="3" fill="white" />
                  <circle cx="154" cy="82" r="3" fill="white" />
                  
                  <rect x="175" y="180" width="50" height="15" fill="#fecdd3" />
                  <path d="M 150 195 L 250 195 L 240 200 L 160 200 Z" fill="#fda4af" />
                  <path d="M 80 200 L 320 200" stroke="#fecdd3" strokeWidth="4" strokeLinecap="round" />
                  
                  {/* Barrier (background) */}
                  <rect x="230" y="150" width="80" height="16" rx="2" fill="#fed7aa" />
                  <path d="M 235 150 L 245 166 M 255 150 L 265 166 M 275 150 L 285 166 M 295 150 L 305 166" stroke="#ea580c" strokeWidth="8" />
                  <rect x="230" y="150" width="80" height="16" rx="2" fill="none" stroke="#ea580c" strokeWidth="2" />
                  <rect x="240" y="166" width="6" height="34" fill="#f97316" />
                  <rect x="280" y="166" width="6" height="34" fill="#f97316" />
                  
                  {/* Gear and Wrench (Center focus) */}
                  <g transform="translate(200, 130)">
                    {/* Teeth */}
                    <path d="M -8 -42 L 8 -42 L 12 -30 L -12 -30 Z" fill="#8a1518" />
                    <path d="M -8 42 L 8 42 L 12 30 L -12 30 Z" fill="#8a1518" />
                    <path d="M -42 -8 L -42 8 L -30 12 L -30 -12 Z" fill="#8a1518" />
                    <path d="M 42 -8 L 42 8 L 30 12 L 30 -12 Z" fill="#8a1518" />
                    <path d="M -30 -30 L -18 -40 L -12 -28 L -24 -20 Z" fill="#8a1518" transform="rotate(15)" />
                    <path d="M 30 30 L 18 40 L 12 28 L 24 20 Z" fill="#8a1518" transform="rotate(15)" />
                    <path d="M 30 -30 L 40 -18 L 28 -12 L 20 -24 Z" fill="#8a1518" transform="rotate(15)" />
                    <path d="M -30 30 L -40 18 L -28 12 L -20 24 Z" fill="#8a1518" transform="rotate(15)" />
                    
                    <circle cx="0" cy="0" r="32" fill="#8a1518" />
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
                  <rect x="125" y="110" width="20" height="20" rx="4" fill="#fff1f2" stroke="#fda4af" strokeWidth="2" strokeDasharray="2 2" />
                  <rect x="130" y="115" width="10" height="10" fill="#fecdd3" />
                  <circle cx="260" cy="115" r="4" fill="#fecdd3" />
                  <circle cx="270" cy="115" r="4" fill="#fecdd3" />
               </svg>
            </div>
            
            <DialogTitle className="text-[24px] font-black text-slate-900 mb-0 tracking-tight">System Maintenance</DialogTitle>
            <div className="w-8 h-[3px] rounded-full bg-[#8a1518] mx-auto mt-4 mb-5"></div>
            
            <DialogDescription className="text-[14px] font-medium text-slate-600 leading-relaxed max-w-[400px] mx-auto mb-8">
              Qridify is currently undergoing maintenance to improve your user experience. We would like to say sorry for the inconveniences while the system have ongoing repairs and updates.
            </DialogDescription>
            
            {/* Notification Box */}
            <div className="w-full bg-[#fff0f2] rounded-2xl p-4 flex items-center gap-4 mb-8 text-left">
              <div className="w-10 h-10 rounded-full bg-[#ffe4e6] flex items-center justify-center shrink-0 shadow-sm border border-red-100">
                <Bell className="w-5 h-5 text-[#e11d48]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#7a1315] tracking-tight">We will notify you as soon as possible.</span>
                <span className="text-[13px] font-semibold text-[#7a1315]/80 mt-1">Thank you for your understanding.</span>
              </div>
            </div>
            
            <Button onClick={() => setIsMaintenanceModalOpen(false)} className="w-full h-12 rounded-xl bg-[#8a1518] hover:bg-[#6c0f12] text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg">
              Got it, thanks! <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
