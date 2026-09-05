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
  ScanLine, ShieldCheck,
  Smartphone, Users, ArrowRight, Shield,
  FileText, Briefcase, Bell
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll state for navbar and scroll hint
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      if (window.scrollY > 100) {
        setShowScrollHint(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

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

    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // Fade-up animations
    const sections = gsap.utils.toArray('.gsap-fade-up') as HTMLElement[];
    sections.forEach((section) => {
      gsap.fromTo(section, 
        { y: 50, opacity: 0 }, 
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    // Floating animations
    if (document.querySelector('.gsap-float')) {
      gsap.to('.gsap-float', {
        y: -15,
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: 0.2
      });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    gsap.to(window, { duration: 1.2, scrollTo: { y: id, offsetY: 84 }, ease: 'power3.inOut' });
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-white font-sans text-slate-900 selection:bg-[#0B3A82] selection:text-white pb-0">
      
      {/* Navbar */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-[84px]">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm p-1 border border-slate-100">
                <Image src="/school-logo.jpg" alt="TWCES" width={40} height={40} className="w-10 h-10 object-cover rounded-full" style={{ width: 'auto', height: 'auto' }} unoptimized priority />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[16px] leading-none tracking-[0.05em] text-[#0B3A82]">TWCES</span>
                <span className="text-[10px] text-slate-500 font-bold tracking-[0.15em] uppercase mt-1">Smart • Secure • Seamless</span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-12">
              <a href="#features" onClick={(e) => scrollToSection(e, '#features')} className="text-slate-600 hover:text-[#0B3A82] font-semibold text-[14px] transition-colors cursor-pointer">Features</a>
              <a href="#solutions" onClick={(e) => scrollToSection(e, '#solutions')} className="text-slate-600 hover:text-[#0B3A82] font-semibold text-[14px] transition-colors cursor-pointer">Solutions</a>
              <a href="#resources" onClick={(e) => scrollToSection(e, '#resources')} className="text-slate-600 hover:text-[#0B3A82] font-semibold text-[14px] transition-colors cursor-pointer">Resources</a>
              <a href="#about" onClick={(e) => scrollToSection(e, '#about')} className="text-slate-600 hover:text-[#0B3A82] font-semibold text-[14px] transition-colors cursor-pointer">About</a>
              <a href="#contact" onClick={(e) => scrollToSection(e, '#contact')} className="text-slate-600 hover:text-[#0B3A82] font-semibold text-[14px] transition-colors cursor-pointer">Contact</a>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center">
              <Link href="/login">
                <button className="h-[44px] px-8 font-semibold text-[14px] rounded-full bg-[#0B3A82] hover:bg-[#154FA3] text-white transition-all flex items-center shadow-md shadow-[#0B3A82]/20 hover:shadow-lg">
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
      </nav>

      <main className="pt-[84px]">
        
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 lg:pt-32 lg:pb-40 overflow-hidden text-center min-h-[80vh] flex items-center justify-center">
          
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0 z-0">
            <Image 
              src="/herobg1.png" 
              alt="School Background" 
              fill 
              className="object-cover object-center"
              priority
              unoptimized
            />
            {/* Stronger overlay for text visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/60 to-white/30"></div>
            {/* Soft radial overlay behind text */}
            <div className="absolute inset-0 bg-radial-[at_center_top] from-white/50 to-transparent"></div>
          </div>

          <div className="max-w-[1000px] w-full mx-auto px-6 lg:px-12 relative z-10 flex flex-col items-center">
              
              {/* Hero Content */}
              <div className="gsap-fade-up flex flex-col items-center w-full">
                
                <h1 className="text-[52px] sm:text-[64px] lg:text-[76px] font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-8">
                  The Smarter Way to<br />
                  <span className="text-[#0B3A82]">Manage School Attendance.</span>
                </h1>
                
                <p className="text-[18px] sm:text-[22px] text-slate-500 mb-10 font-medium leading-[1.6] max-w-[640px]">
                  QR codes and Smart IDs. Get real-time monitoring, automated reports, and parent notifications in one platform built for your school.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center w-full">
                  <Link href="/login">
                    <button className="w-full sm:w-auto h-[56px] px-10 bg-[#0B3A82] hover:bg-[#154FA3] text-white font-semibold text-[16px] rounded-full shadow-xl shadow-[#0B3A82]/20 flex items-center justify-center transition-all hover:scale-[1.02]">
                      Get Started
                    </button>
                  </Link>
                  <Link href="#features">
                    <button className="w-full sm:w-auto h-[56px] px-10 bg-white border-2 border-slate-300 text-slate-700 hover:border-[#0B3A82] hover:text-[#0B3A82] font-semibold text-[16px] rounded-full flex items-center justify-center transition-all shadow-sm">
                      View Features
                    </button>
                  </Link>
                </div>

                {/* Scroll Down Indicator */}
                {showScrollHint && (
                  <div className="flex flex-col items-center gap-2 animate-bounce mt-4">
                    <span className="text-[12px] sm:text-[13px] font-bold text-[#0B3A82] uppercase tracking-widest">Scroll Down</span>
                    <svg className="w-5 h-5 text-[#0B3A82]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
                
              </div>
              
          </div>

          {/* Layered Wavy Divider at Bottom of Hero - above all overlays */}
          <div className="absolute bottom-0 left-0 w-full pointer-events-none" style={{ zIndex: 30 }}>
            <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 250" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ height: '180px' }}>
              <path d="M0 150C240 50 480 230 720 150C960 70 1200 200 1440 120V250H0V150Z" fill="#0B3A82" />
            </svg>
            <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 250" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ height: '180px' }}>
              <path d="M0 155C240 55 480 235 720 155C960 75 1200 205 1440 125" stroke="#F5A623" strokeWidth="4" fill="none" />
            </svg>
            <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 250" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ height: '160px' }}>
              <path d="M0 160C240 60 480 240 720 160C960 80 1200 210 1440 130V250H0V160Z" fill="#F7F9FC" />
            </svg>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-24 bg-[#F7F9FC] gsap-fade-up">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12 text-center">
            <h2 className="text-[36px] md:text-[48px] font-extrabold text-slate-900 leading-tight mb-20 tracking-tight">
              A Day Inside Your School
            </h2>

            <div className="relative max-w-[1000px] mx-auto">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-1/2 left-[5%] right-[5%] h-[2px] bg-slate-200 -translate-y-1/2 z-0"></div>

              <div className="flex flex-col md:flex-row justify-between relative z-10 gap-8 md:gap-0">
                {[
                  { title: 'Student Arrives', icon: Users },
                  { title: 'Scan QR', icon: ScanLine },
                  { title: 'Attendance Recorded', icon: CheckCircle2 },
                  { title: 'Teacher Notified', icon: Smartphone },
                  { title: 'Parent Notified', icon: Bell },
                  { title: 'Reports Generated', icon: FileText }
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    {/* Icon without the circle container. bg-[#F7F9FC] is used to mask the connecting line behind it */}
                    <div className="bg-[#F7F9FC] px-4 py-2 mb-4 relative z-10">
                      <step.icon className="w-8 h-8 text-[#0B3A82]" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-semibold text-[15px] text-slate-900 text-center max-w-[120px] leading-tight">
                      {step.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Platform Benefits - Editorial Layout */}
        <section id="features" className="py-32 bg-white overflow-hidden">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
            
            {/* Feature 1 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center mb-32 gsap-fade-up">
              <div className="order-2 lg:order-1">
                <h3 className="text-[32px] md:text-[40px] font-bold text-slate-900 leading-tight mb-6 tracking-tight">
                  Lightning Fast QR Attendance
                </h3>
                <p className="text-[18px] text-slate-500 font-medium leading-relaxed mb-8 max-w-[480px]">
                  Eliminate long lines and manual checking. Students simply scan their unique QR codes to securely record their attendance in less than a second.
                </p>
              </div>
              <div className="order-1 lg:order-2 h-[400px] bg-slate-100 border border-slate-200 flex items-center justify-center relative overflow-hidden group shadow-lg">
                 <Image src="/mock1.png" alt="QR Attendance Scan" fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center mb-32 gsap-fade-up">
              <div className="h-[400px] bg-slate-100 border border-slate-200 flex items-center justify-center relative overflow-hidden group shadow-lg">
                 <Image src="/mock2.png" alt="Dashboard Monitoring" fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
              </div>
              <div className="pl-0 lg:pl-12">
                <h3 className="text-[32px] md:text-[40px] font-bold text-slate-900 leading-tight mb-6 tracking-tight">
                  Real-time Dashboard Monitoring
                </h3>
                <p className="text-[18px] text-slate-500 font-medium leading-relaxed mb-8 max-w-[480px]">
                  Administrators and teachers get a live view of campus presence. Spot trends, track late arrivals, and manage school safety instantaneously.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Smart ID Showcase */}
        <section className="py-24 bg-[#F7F9FC] gsap-fade-up">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
               
               <div>
                  <h2 className="text-[36px] md:text-[48px] font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
                    One Smart ID, <br/> Endless Possibilities.
                  </h2>
                  <p className="text-[18px] text-slate-500 font-medium leading-relaxed mb-10 max-w-[400px]">
                    Upgrade from traditional plastic cards. Our smart IDs combine visual identity, secure QR codes, and durable design for everyday student use.
                  </p>
                  
                  <div className="space-y-4">
                     {['Durable & Waterproof', 'Instant QR Verification', 'Clear Typography', 'Official School Design'].map((item, i) => (
                       <div key={i} className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded-full bg-[#0B3A82]/10 flex items-center justify-center">
                           <CheckCircle2 className="w-4 h-4 text-[#0B3A82]" />
                         </div>
                         <span className="text-[16px] font-semibold text-slate-700">{item}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="flex justify-center lg:justify-end">
                  {/* Apple Wallet Style Horizontal Card */}
                  <div className="w-full max-w-[600px] aspect-[1.58] bg-white rounded-[24px] shadow-2xl shadow-slate-300/50 border border-slate-100 relative overflow-hidden flex">
                     {/* Blue Wave Background Decoration */}
                     <div className="absolute top-0 right-0 w-3/4 h-full bg-[#0B3A82] rounded-l-[100%] opacity-5"></div>
                     <div className="absolute bottom-0 left-0 w-full h-4 bg-[#FFD22E]"></div>
                     
                     <div className="p-8 flex flex-col justify-between w-full z-10">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-4">
                              {/* Photo Placeholder */}
                              <div className="w-24 h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                                 <span className="text-[10px] text-slate-400 font-bold">PHOTO</span>
                              </div>
                              <div>
                                 <h4 className="text-[24px] font-extrabold text-slate-900 uppercase tracking-wide">STUDENT NAME</h4>
                                 <div className="text-[14px] text-slate-500 font-semibold mb-1">Grade 6 - Section A</div>
                                 <div className="text-[12px] text-slate-400 font-medium tracking-widest">LRN: 123456789012</div>
                              </div>
                           </div>
                           <div className="w-14 h-14 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center">
                              <span className="text-[8px] text-slate-300 font-bold">LOGO</span>
                           </div>
                        </div>

                        <div className="flex justify-between items-end pb-2">
                           {/* QR Placeholder */}
                           <div className="w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center p-1">
                              <div className="w-full h-full border-2 border-slate-300 border-dashed rounded flex items-center justify-center">
                                 <span className="text-[10px] text-slate-400 font-bold">QR</span>
                              </div>
                           </div>
                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                               TWCES
                            </div>
                        </div>
                     </div>
                  </div>
               </div>

            </div>
          </div>
        </section>

        {/* Security Section - Dark */}
        <section className="py-24 bg-[#0B3A82] text-white overflow-hidden gsap-fade-up">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12 text-center">
            <h2 className="text-[36px] md:text-[48px] font-extrabold leading-tight mb-6 tracking-tight">
              Built for School Safety
            </h2>
            <p className="text-[18px] text-blue-100/80 font-medium max-w-[600px] mx-auto mb-20">
              Your students&apos; attendance data is protected with industry-leading security. Only authorized teachers, staff, and administrators can access sensitive records, keeping your school&apos;s information safe at all times.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: 'Role Permissions', desc: 'Granular access control for admins, teachers, and staff.' },
                { title: 'Cloud Backup', desc: 'Automated daily backups ensure data is never lost.' },
                { title: 'Encrypted Data', desc: 'End-to-end encryption for all sensitive student records.' },
                { title: 'Audit Logs', desc: 'Comprehensive tracking of all system modifications.' }
              ].map((feature, i) => (
                <div key={i} className="text-left">
                  <h3 className="text-[20px] font-bold mb-3">{feature.title}</h3>
                  <p className="text-[15px] text-blue-200/70 font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section id="solutions" className="py-32 bg-white gsap-fade-up">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
            <h2 className="text-[36px] md:text-[48px] font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
              Designed for everyone.
            </h2>
            <p className="text-[18px] text-slate-500 font-medium mb-16 max-w-[520px]">
              One platform with the right tools and access for every role.
            </p>
            
            <div className="grid md:grid-cols-5 gap-10">
              {[
                { icon: Shield,       title: 'Admin',     desc: 'Full system access to manage users, settings, reports, and school operations.' },
                { icon: Users,        title: 'Teacher',   desc: 'Take attendance, track student records, and stay connected with parents.' },
                { icon: Briefcase,    title: 'Principal', desc: 'Monitor school-wide attendance, view analytics, and generate summary reports.' },
                { icon: School,       title: 'Student',   desc: 'Scan QR or tap Smart ID to record attendance quickly and accurately.' },
                { icon: ShieldCheck,  title: 'Guard',     desc: 'Monitor entry and exit points in real time with a simple, dedicated interface.' }
              ].map((role, i) => (
                <div key={i} className="flex flex-col">
                  <role.icon className="w-8 h-8 text-[#0B3A82] mb-6" strokeWidth={1.5} />
                  <h3 className="font-bold text-[20px] text-slate-900 mb-3">{role.title}</h3>
                  <p className="text-[15px] text-slate-500 font-medium leading-relaxed">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Schools Choose Full Width Band */}
        <section className="py-16 bg-[#154FA3] text-white gsap-fade-up">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
             <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
                <h3 className="text-[28px] font-bold text-white shrink-0">Why schools choose us</h3>
                <div className="flex flex-wrap justify-center lg:justify-end gap-x-12 gap-y-6 flex-1">
                   {['Secure', 'Easy', 'Fast', 'Reliable', 'Cloud', 'Analytics'].map((feature, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[#FFD22E]" />
                        <span className="text-[18px] font-semibold">{feature}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </section>

        {/* Testimonial */}
        <section id="about" className="py-32 bg-white gsap-fade-up">
          <div className="max-w-[1000px] mx-auto px-6 text-center">
            <div className="flex justify-center gap-2 mb-10">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-8 h-8 fill-[#FFD22E] text-[#FFD22E]" />)}
            </div>
            
            <h2 className="text-[32px] md:text-[48px] font-bold text-slate-900 leading-tight mb-12 tracking-tight">
              &quot;QRIDIFY has transformed our morning routines. What used to take 20 minutes of manual checking now happens seamlessly as students walk through the gates. It is an absolute game-changer for our school&apos;s efficiency.&quot;
            </h2>
            
            <div className="text-[18px] font-semibold text-slate-900 mb-2">Mrs. Angela D.</div>
            <div className="text-[16px] text-slate-500 font-medium mb-16">Principal, TWCES</div>

            <div className="border-t border-slate-100 pt-16">
               <div className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest mb-8">Trusted by leading educational institutions</div>
               <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  {/* Logos Placeholders */}
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-10 flex items-center font-bold text-slate-400 tracking-wider">
                       SCHOOL LOGO
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="contact" className="py-32 bg-white border-t border-slate-100 text-center gsap-fade-up">
          <div className="max-w-[800px] mx-auto px-6">
            <h2 className="text-[48px] md:text-[64px] font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight">
              Ready to modernize attendance?
            </h2>
            <p className="text-[20px] text-slate-500 font-medium mb-12">
              Join leading schools in providing a safer, smarter environment for students and staff.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <button className="w-full sm:w-auto h-[60px] px-10 bg-[#0B3A82] hover:bg-[#154FA3] text-white font-semibold text-[18px] rounded-full shadow-xl shadow-[#0B3A82]/20 flex items-center justify-center transition-transform hover:scale-105">
                  Get Started
                </button>
              </Link>
              <button className="w-full sm:w-auto h-[60px] px-10 border-2 border-slate-200 text-slate-700 hover:border-slate-900 hover:text-slate-900 font-semibold text-[18px] rounded-full flex items-center justify-center transition-colors">
                Contact Us
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#0B3A82] text-white py-20">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
           <div className="md:col-span-1">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 shrink-0">
                   <Image src="/school-logo.jpg" alt="TWCES" width={32} height={32} className="w-8 h-8 object-cover rounded-full" style={{ width: 'auto', height: 'auto' }} unoptimized />
                </div>
                <span className="font-extrabold text-[16px] tracking-wide text-white leading-tight">TWCES</span>
             </div>
             <p className="text-[14px] text-blue-200/80 font-medium max-w-[240px]">
               Smart attendance platform developed for modern educational institutions.
             </p>
          </div>
          
          <div>
            <h4 className="font-bold text-[16px] mb-6 text-white">Quick Links</h4>
            <ul className="space-y-4">
              <li><a href="#features" className="text-[14px] text-blue-200/80 hover:text-white transition-colors">Features</a></li>
              <li><a href="#solutions" className="text-[14px] text-blue-200/80 hover:text-white transition-colors">Solutions</a></li>
              <li><a href="#resources" className="text-[14px] text-blue-200/80 hover:text-white transition-colors">Resources</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-[16px] mb-6 text-white">Support</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-[14px] text-blue-200/80 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-[14px] text-blue-200/80 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-[14px] text-blue-200/80 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[16px] mb-6 text-white">Legal</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-[14px] text-blue-200/80 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-[14px] text-blue-200/80 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-8 border-t border-blue-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="text-[13px] font-medium text-blue-200/60">
             © 2026 TWCES. All rights reserved.
           </div>
           <div className="text-[13px] font-medium text-blue-200/60">
             Built for TWCES
           </div>
        </div>
      </footer>
    </div>
  );
}
