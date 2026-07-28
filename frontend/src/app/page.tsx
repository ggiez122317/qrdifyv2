'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Lenis from 'lenis';
import Image from 'next/image';
import { 
  School, Menu, Star, CheckCircle2,
  ScanLine, LayoutDashboard, LineChart, ShieldCheck, 
  Smartphone, Users, ArrowRight, PlayCircle, Briefcase, Zap, Shield,
  Settings, MonitorSmartphone, FileText, ShieldAlert, X
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for auth messages in URL parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('blocked') === 'true') {
      setIsBlocked(true);
      setTimeout(() => setIsBlocked(false), 8000);
    }
    if (params.get('maintenance') === 'true') {
      setIsMaintenance(true);
      setTimeout(() => setIsMaintenance(false), 8000);
    }
    if (params.get('idle') === 'true') {
      setIsIdle(true);
      setTimeout(() => setIsIdle(false), 8000);
    }
    
    // Clear the URL parameters without reloading
    if (params.has('blocked') || params.has('maintenance') || params.has('idle')) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // Subtle fade-up animations for sections
    const sections = gsap.utils.toArray('.gsap-fade-up') as HTMLElement[];
    sections.forEach((section) => {
      gsap.fromTo(section, 
        { y: 40, opacity: 0 }, 
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    gsap.to(window, { duration: 1.2, scrollTo: { y: id, offsetY: 72 }, ease: 'power3.inOut' });
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#7a1315] selection:text-white pb-0">
      {/* Blocked Notification Toast */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${isBlocked ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-full opacity-0 scale-95 pointer-events-none'}`}>
        <div className="bg-[#7a1315]/95 backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(122,19,21,0.3)] flex items-center gap-3 border border-red-500/20">
          <ShieldAlert className="w-5 h-5 text-red-200 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-white">Access Denied</span>
            <span className="text-[12px] font-medium text-red-100">Your account has been blocked from accessing the system.</span>
          </div>
          <button onClick={() => setIsBlocked(false)} className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-red-200 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iOS-style Maintenance Notification Toast */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${isMaintenance ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-full opacity-0 scale-95 pointer-events-none'}`}>
        <div className="bg-slate-900/95 backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center gap-3 border border-slate-700/50">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-white">Maintenance Mode</span>
            <span className="text-[12px] font-medium text-slate-300">The system is under maintenance. Only admins can log in.</span>
          </div>
          <button onClick={() => setIsMaintenance(false)} className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iOS-style Idle Logout Notification Toast */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${isIdle ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-full opacity-0 scale-95 pointer-events-none'}`}>
        <div className="bg-slate-900/95 backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center gap-3 border border-slate-700/50">
          <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-white">Session Expired</span>
            <span className="text-[12px] font-medium text-slate-300">You were logged out due to inactivity.</span>
          </div>
          <button onClick={() => setIsIdle(false)} className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Navbar */}
      <nav className="fixed w-full top-0 z-50 bg-[#fafafa]/95 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex justify-between items-center h-[72px]">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm p-0.5">
                <Image src="/logo.png" alt="Qridify" width={36} height={36} className="w-9 h-9 object-contain rounded-full" unoptimized priority />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[17px] leading-none tracking-[0.15em] uppercase">QRIDIFY</span>
                <span className="text-[9px] text-slate-500 font-bold tracking-[0.1em] uppercase mt-0.5">Smart • Secure • Seamless</span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-10">
              <a href="#features" onClick={(e) => scrollToSection(e, '#features')} className="text-slate-500 hover:text-[#7a1315] font-bold text-[13px] transition-colors cursor-pointer">Features</a>
              <a href="#solutions" onClick={(e) => scrollToSection(e, '#solutions')} className="text-slate-500 hover:text-[#7a1315] font-bold text-[13px] transition-colors cursor-pointer">Solutions</a>
              <a href="#pricing" onClick={(e) => scrollToSection(e, '#pricing')} className="text-slate-500 hover:text-[#7a1315] font-bold text-[13px] transition-colors cursor-pointer">Pricing</a>
              <a href="#resources" onClick={(e) => scrollToSection(e, '#resources')} className="text-slate-500 hover:text-[#7a1315] font-bold text-[13px] transition-colors cursor-pointer">Resources</a>
              <a href="#about" onClick={(e) => scrollToSection(e, '#about')} className="text-slate-500 hover:text-[#7a1315] font-bold text-[13px] transition-colors cursor-pointer">About</a>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center">
              <Link href="/login">
                <button className="h-10 px-6 font-bold text-[13px] rounded-full bg-[#7a1315] hover:bg-[#5a0e10] text-white transition-colors flex items-center shadow-md shadow-[#7a1315]/20">
                  Login <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 p-2">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-4 shadow-lg absolute w-full">
            <a href="#features" onClick={(e) => scrollToSection(e, '#features')} className="block px-3 py-3 text-slate-600 font-bold border-b border-slate-50 cursor-pointer">Features</a>
            <a href="#solutions" onClick={(e) => scrollToSection(e, '#solutions')} className="block px-3 py-3 text-slate-600 font-bold border-b border-slate-50 cursor-pointer">Solutions</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, '#pricing')} className="block px-3 py-3 text-slate-600 font-bold border-b border-slate-50 cursor-pointer">Pricing</a>
            <a href="#resources" onClick={(e) => scrollToSection(e, '#resources')} className="block px-3 py-3 text-slate-600 font-bold border-b border-slate-50 cursor-pointer">Resources</a>
            <a href="#about" onClick={(e) => scrollToSection(e, '#about')} className="block px-3 py-3 text-slate-600 font-bold border-b border-slate-50 cursor-pointer">About</a>
            <Link href="/login" className="block px-3 py-3 text-[#7a1315] font-bold mt-2">Login</Link>
          </div>
        )}
      </nav>

      <main className="pt-[72px]">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-12 gsap-fade-up">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              
              {/* Hero Content */}
              <div className="text-center lg:text-left mb-16 lg:mb-0">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-50 text-[#7a1315] text-[11px] font-bold tracking-wider mb-6">
                  Modern • Secure • Reliable
                </div>
                <h1 className="text-[44px] sm:text-[56px] lg:text-[64px] font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-6">
                  Smart Attendance, <br/><span className="text-[#7a1315]">Stronger Schools.</span>
                </h1>
                <p className="text-[17px] text-slate-500 mb-8 max-w-[480px] mx-auto lg:mx-0 font-medium leading-relaxed">
                  Automate attendance tracking with RFID & QR technology, real-time monitoring, and insightful reports — all in one secure platform.
                </p>
                
                {/* Trust indicator */}
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-10">
                  <div className="flex">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                    <div className="flex -space-x-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden"><img src="https://i.pravatar.cc/100?img=1" alt="user" className="w-full h-full object-cover" /></div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 overflow-hidden"><img src="https://i.pravatar.cc/100?img=2" alt="user" className="w-full h-full object-cover" /></div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-400 overflow-hidden"><img src="https://i.pravatar.cc/100?img=3" alt="user" className="w-full h-full object-cover" /></div>
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">+</div>
                    </div>
                    <div>
                       <div className="font-extrabold text-slate-900 text-sm leading-none">4.9/5</div>
                       <div className="text-[11px] font-bold text-slate-500">Trusted by 500+ Schools</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/login">
                    <button className="w-full sm:w-auto h-[52px] px-8 bg-[#7a1315] hover:bg-[#5a0e10] text-white font-bold text-[14px] rounded-full shadow-lg shadow-[#7a1315]/20 flex items-center justify-center transition-all">
                      Get Started <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </Link>
                  <Link href="#features">
                    <button className="w-full sm:w-auto h-[52px] px-8 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[14px] rounded-full flex items-center justify-center transition-all bg-white">
                      <PlayCircle className="w-5 h-5 mr-2 text-[#7a1315]" /> View Features
                    </button>
                  </Link>
                </div>
              </div>
              
              {/* Hero Graphic / Dashboard Mockup */}
              <div className="relative w-full h-[500px] hidden md:block">
                {/* Background decorative blob */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-50 rounded-full blur-3xl opacity-60"></div>
                
                {/* Main Dashboard UI Mockup */}
                <div className="absolute right-0 top-10 w-[500px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden z-10 flex">
                  {/* Mockup Sidebar */}
                  <div className="w-16 border-r border-slate-100 bg-[#fafafa] flex flex-col items-center py-4 gap-6 shrink-0">
                    <div className="w-8 h-8 bg-[#7a1315] rounded-lg flex items-center justify-center"><School className="w-4 h-4 text-white" /></div>
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-[#7a1315] flex items-center justify-center"><LayoutDashboard className="w-4 h-4" /></div>
                    <div className="w-8 h-8 rounded-lg text-slate-400 flex items-center justify-center"><Users className="w-4 h-4" /></div>
                    <div className="w-8 h-8 rounded-lg text-slate-400 flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>
                    <div className="w-8 h-8 rounded-lg text-slate-400 flex items-center justify-center"><LineChart className="w-4 h-4" /></div>
                    <div className="mt-auto w-8 h-8 rounded-lg text-slate-400 flex items-center justify-center"><Settings className="w-4 h-4" /></div>
                  </div>
                  {/* Mockup Content */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-extrabold text-slate-800">Dashboard</h3>
                      <div className="flex gap-2">
                         <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                         <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                      </div>
                    </div>
                    
                    <h4 className="text-[11px] font-bold text-slate-500 mb-3">Today&apos;s Overview</h4>
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      <div className="bg-[#fafafa] rounded-xl p-3 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-500 mb-1">Students</div>
                        <div className="font-extrabold text-slate-800 text-lg">1,248</div>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100/50">
                        <div className="text-[10px] font-bold text-emerald-600 mb-1">Present</div>
                        <div className="font-extrabold text-emerald-700 text-lg">1,156</div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3 border border-red-100/50">
                        <div className="text-[10px] font-bold text-red-600 mb-1">Absent</div>
                        <div className="font-extrabold text-red-700 text-lg">72</div>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100/50">
                        <div className="text-[10px] font-bold text-amber-600 mb-1">Late</div>
                        <div className="font-extrabold text-amber-700 text-lg">92</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-[11px] font-bold text-slate-500">Attendance Overview</h4>
                      <div className="text-[9px] font-bold text-slate-400 px-2 py-1 rounded bg-slate-100">This Week ⌄</div>
                    </div>
                    <div className="h-32 bg-[#fafafa] border border-slate-100 rounded-xl relative p-4 flex items-end">
                       <svg className="w-full h-24 overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                         <path d="M0,30 L20,10 L40,25 L60,5 L80,20 L100,0" fill="none" stroke="#7a1315" strokeWidth="2" strokeLinejoin="round" />
                         <circle cx="20" cy="10" r="2" fill="#7a1315" />
                         <circle cx="40" cy="25" r="2" fill="#7a1315" />
                         <circle cx="60" cy="5" r="2" fill="#7a1315" />
                         <circle cx="80" cy="20" r="2" fill="#7a1315" />
                         <circle cx="100" cy="0" r="2" fill="#7a1315" />
                       </svg>
                    </div>
                  </div>
                </div>

                {/* Floating active badge */}
                <div className="absolute left-[-20px] top-[260px] bg-white rounded-xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-4 z-20 animate-bounce" style={{animationDuration: '4s'}}>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 relative">
                    <ScanLine className="w-5 h-5 text-emerald-600" />
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <div className="font-extrabold text-slate-800 text-[13px]">Live Monitoring</div>
                       <div className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-50 text-emerald-600 uppercase tracking-wider">Active</div>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500">All systems running smoothly</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Cards Grid Section */}
        <section id="features" className="py-12 bg-[#fafafa] gsap-fade-up">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  title: 'RFID Attendance', 
                  desc: 'Fast & accurate check-in',
                  image: '/rfid_card.png',
                  bg: 'bg-red-50/50'
                },
                { 
                  title: 'QR Code Scan', 
                  desc: 'Easy mobile scanning',
                  image: '/qr_card.png',
                  bg: 'bg-slate-100/50'
                },
                { 
                  title: 'Real-time Dashboard', 
                  desc: 'Live attendance updates',
                  image: '/dashboard_card.png',
                  bg: 'bg-red-50/50'
                },
                { 
                  title: 'Reports & Analytics', 
                  desc: 'Insights for better decisions',
                  image: '/reports_card.png',
                  bg: 'bg-slate-100/50'
                }
              ].map((card, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className={`h-[200px] ${card.bg} rounded-2xl mb-4 relative overflow-hidden border border-slate-200/60 transition-transform duration-300 group-hover:-translate-y-1`}>
                    <Image src={card.image} alt={card.title} fill className="object-cover transform group-hover:scale-105 transition-transform duration-700" unoptimized />
                  </div>
                  <h3 className="font-extrabold text-[15px] text-slate-900">{card.title}</h3>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="solutions" className="py-20 border-t border-b border-slate-200/50 bg-white gsap-fade-up">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold tracking-wider mb-6 border border-slate-200 uppercase">
              Built for Schools That Aim Higher
            </div>
            <h2 className="text-[28px] md:text-[36px] font-extrabold text-slate-900 leading-tight max-w-[600px] mx-auto mb-16">
              We help schools save time, reduce errors, and improve accountability.
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {[
                { val: '230+', label: 'Schools Onboarded', sub: 'Across all levels', icon: School, color: 'text-red-500', bg: 'bg-red-50' },
                { val: '98%', label: 'Attendance Accuracy', sub: 'Through automation', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { val: '35X', label: 'Faster Processing', sub: 'Compared to manual', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
                { val: '24/7', label: 'System Monitoring', sub: 'Always secure', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50' }
              ].map((stat, i) => (
                <div key={i} className="bg-[#fafafa] p-6 rounded-2xl border border-slate-200/60">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div className="font-extrabold text-[28px] text-slate-900 leading-none">{stat.val}</div>
                  </div>
                  <div className="font-bold text-[14px] text-slate-800">{stat.label}</div>
                  <div className="text-[12px] font-medium text-slate-500 mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 Easy Steps */}
        <section className="py-24 bg-[#fafafa] gsap-fade-up">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-50 text-[#7a1315] text-[11px] font-bold tracking-wider mb-6 uppercase">
              Simple Process
            </div>
            <h2 className="text-[32px] md:text-[40px] font-extrabold text-slate-900 leading-tight mb-4">
              Get started in 3 easy steps
            </h2>
            <p className="text-[15px] text-slate-500 font-medium mb-16">
              From setup to reports in just a few clicks.
            </p>

            <div className="flex flex-col md:flex-row justify-between relative max-w-[900px] mx-auto">
               {/* Connecting Line */}
               <div className="hidden md:block absolute top-[24px] left-[15%] right-[15%] h-[2px] bg-slate-200 z-0"></div>
               
               {[
                 { step: '1', title: 'Set Up Your School', desc: 'Register your school, add classes, teachers, and students.' },
                 { step: '2', title: 'Track Attendance', desc: 'Use RFID or QR code for fast and accurate attendance.' },
                 { step: '3', title: 'Generate Reports', desc: 'View real-time analytics and export detailed reports.' }
               ].map((item, i) => (
                 <div key={i} className="relative z-10 flex flex-col items-center flex-1 mb-10 md:mb-0">
                   <div className="w-12 h-12 rounded-full bg-[#7a1315] text-white flex items-center justify-center font-extrabold text-lg border-[6px] border-[#fafafa] shadow-sm mb-6">
                     {item.step}
                   </div>
                   <h3 className="font-extrabold text-[17px] text-slate-900 mb-2">{item.title}</h3>
                   <p className="text-[13px] font-medium text-slate-500 max-w-[220px] text-center">{item.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Dark Maroon Banner 1 */}
        <section className="bg-[#7a1315] py-16 text-white border-b border-[#5a0e10] gsap-fade-up">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {[
                { icon: ShieldCheck, title: 'Secure & Reliable', desc: 'Your data is protected with enterprise security.' },
                { icon: Smartphone, title: 'Easy to Use', desc: 'Intuitive design for teachers and admins.' },
                { icon: LayoutDashboard, title: 'Works Anywhere', desc: 'Access anytime, from any device.' },
                { icon: CheckCircle2, title: 'Always Updated', desc: 'New features and improvements regularly.' }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col text-left">
                  <feature.icon className="w-8 h-8 text-red-200 mb-5" strokeWidth={1.5} />
                  <h4 className="font-extrabold text-[15px] mb-2">{feature.title}</h4>
                  <p className="text-[13px] text-red-200/80 font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Schools Choose SAS Grid */}
        <section className="py-24 bg-white gsap-fade-up">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-50 text-[#7a1315] text-[11px] font-bold tracking-wider mb-6 uppercase">
              Why Schools Choose SAS
            </div>
            <h2 className="text-[32px] md:text-[40px] font-extrabold text-slate-900 leading-tight mb-16">
              Everything you need for <br className="hidden md:block"/>
              <span className="text-[#7a1315]">smarter attendance.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {[
                { icon: <MonitorSmartphone className="w-8 h-8 text-blue-500" strokeWidth={1.5}/>, title: 'Real-time Monitoring', desc: 'Track attendance as it happens with live updates.', bg: 'bg-blue-50' },
                { icon: <ScanLine className="w-8 h-8 text-[#7a1315]" strokeWidth={1.5}/>, title: 'RFID & QR Technology', desc: 'Flexible attendance tracking that fits your school.', bg: 'bg-red-50' },
                { icon: <ShieldCheck className="w-8 h-8 text-emerald-500" strokeWidth={1.5}/>, title: 'Secure & Reliable', desc: 'Enterprise-grade security to protect your data.', bg: 'bg-emerald-50' },
                { icon: <FileText className="w-8 h-8 text-indigo-500" strokeWidth={1.5}/>, title: 'Automated Reports', desc: 'Generate accurate reports in seconds.', bg: 'bg-indigo-50' },
                { icon: <Users className="w-8 h-8 text-amber-500" strokeWidth={1.5}/>, title: 'Role-based Access', desc: 'Secure access for admins, teachers, and staff.', bg: 'bg-amber-50' },
                { icon: <LayoutDashboard className="w-8 h-8 text-purple-500" strokeWidth={1.5}/>, title: 'Multi-Device Access', desc: 'Access the system on web, tablet, or mobile.', bg: 'bg-purple-50' },
              ].map((card, i) => (
                <div key={i} className="p-8 rounded-2xl border border-slate-200/60 hover:shadow-lg transition-shadow bg-[#fafafa]">
                  <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center mb-6`}>
                    {card.icon}
                  </div>
                  <h3 className="font-extrabold text-[16px] text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-[14px] text-slate-500 font-medium">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dark CTA Section */}
        <section id="pricing" className="py-24 bg-[#7a1315] text-white text-center relative overflow-hidden gsap-fade-up">
          {/* Background decorations */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(white 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
          
          <div className="max-w-[800px] mx-auto px-6 relative z-10">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 text-white text-[11px] font-bold tracking-wider mb-8 uppercase backdrop-blur-sm">
              Trusted by Schools
            </div>
            <h2 className="text-[32px] md:text-[44px] font-extrabold leading-tight mb-6">
              Ready to transform your <br/> attendance management?
            </h2>
            <p className="text-[16px] text-red-100/90 font-medium mb-10 max-w-[500px] mx-auto">
              Join hundreds of schools improving efficiency and accuracy.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/login">
                <button className="w-full sm:w-auto h-[52px] px-8 bg-white text-[#7a1315] font-extrabold text-[14px] rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </Link>
              <button className="w-full sm:w-auto h-[52px] px-8 border border-red-300/30 text-white hover:bg-white/10 font-bold text-[14px] rounded-full flex items-center justify-center transition-colors">
                Contact Sales <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
              </button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 md:gap-12">
              {[
                { icon: CheckCircle2, text: 'Free Demo', sub: 'No obligation' },
                { icon: CheckCircle2, text: 'Easy Setup', sub: 'Get started quickly' },
                { icon: CheckCircle2, text: 'Dedicated Support', sub: "We're here to help" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-red-200" />
                  </div>
                  <div>
                    <div className="font-bold text-[13px]">{item.text}</div>
                    <div className="text-[11px] text-red-200/80 font-medium">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Designed for Every Role */}
        <section id="resources" className="py-24 bg-[#fafafa] gsap-fade-up">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
            <h2 className="text-[32px] md:text-[36px] font-extrabold text-slate-900 leading-tight mb-4">
              Designed for Every Role
            </h2>
            <p className="text-[15px] text-slate-500 font-medium mb-16">
              Powerful features for administrators, teachers, and staff.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                { icon: <Shield className="w-8 h-8 text-indigo-500" strokeWidth={1.5} />, title: 'For Administrators', desc: 'Manage users, settings, and school operations with ease.', bg: 'bg-indigo-50' },
                { icon: <Users className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />, title: 'For Teachers', desc: 'Take attendance quickly and track students effortlessly.', bg: 'bg-emerald-50' },
                { icon: <Briefcase className="w-8 h-8 text-amber-500" strokeWidth={1.5} />, title: 'For Staff', desc: 'Generate reports and monitor attendance effectively.', bg: 'bg-amber-50' }
              ].map((role, i) => (
                <div key={i} className="p-8 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start">
                  <div className={`w-14 h-14 rounded-2xl ${role.bg} flex items-center justify-center mb-6`}>
                    {role.icon}
                  </div>
                  <h3 className="font-extrabold text-[17px] text-slate-900 mb-3">{role.title}</h3>
                  <p className="text-[14px] text-slate-500 font-medium mb-6 flex-1">{role.desc}</p>
                  <a href="#" className="font-bold text-[13px] text-[#7a1315] flex items-center hover:underline">
                    Learn More <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section id="about" className="py-24 bg-white border-t border-slate-100 gsap-fade-up">
          <div className="max-w-[900px] mx-auto px-6 text-center">
            <h2 className="text-[32px] font-extrabold text-slate-900 mb-12">
              Loved by Educators
            </h2>
            
            <div className="flex flex-col items-center">
               <div className="flex gap-1 mb-6">
                 {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
               </div>
               <p className="text-[18px] md:text-[22px] font-bold text-slate-700 leading-relaxed max-w-[700px] mb-8 italic">
                 &quot;SAS has made attendance tracking so much easier and more accurate. It&apos;s a game-changer for our school!&quot;
               </p>
               
               <div className="flex items-center gap-4">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src="https://i.pravatar.cc/150?img=47" className="w-14 h-14 rounded-full shadow-sm" alt="Mrs. Angela D." />
                 <div className="text-left">
                   <div className="font-extrabold text-slate-900">Mrs. Angela D.</div>
                   <div className="text-[13px] text-slate-500 font-medium">Principal, Greenfield Academy</div>
                 </div>
               </div>
               
               {/* Controls */}
               <div className="flex gap-2 mt-8">
                 <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50">
                   <ArrowRight className="w-4 h-4 rotate-180" />
                 </button>
                 <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50">
                   <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm p-0.5">
              <Image src="/logo.png" alt="Qridify" width={28} height={28} className="w-7 h-7 object-contain rounded-full" unoptimized />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[15px] leading-none tracking-[0.15em] uppercase">QRIDIFY</span>
              <span className="text-[8px] text-slate-500 font-bold tracking-[0.1em] uppercase mt-0.5">Smart • Secure • Seamless</span>
            </div>
          </div>
          <div className="text-[13px] font-medium text-slate-500">
            © 2026 QRIDIFY. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
