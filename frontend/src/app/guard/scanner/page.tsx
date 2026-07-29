'use client';

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { ScanFace, CheckCircle2, XCircle, GraduationCap, Users, Clock, User } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ScanResponse {
  message: string;
  type: string;
  status?: string;
  user: {
    name: string;
    role: string;
    photo_url?: string;
    profile: any;
  };
}

interface CachedUser {
  id: number;
  name: string;
  photo_url: string | null;
  role: string;
  grade?: string;
  section?: string;
  subject?: string;
  contact_number?: string;
}

export default function GuardScanner() {
  const [inputValue, setInputValue] = useState('');
  const [recentScan, setRecentScan] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userCacheRef = useRef<Map<string, CachedUser>>(new Map());
  const queryClient = useQueryClient();

  useEffect(() => {
    api.get<Record<string, CachedUser>>('/api/scan/cache-all').then((res) => {
      const map = new Map<string, CachedUser>();
      for (const [idNumber, user] of Object.entries(res.data)) {
        map.set(idNumber, user);
      }
      userCacheRef.current = map;
    }).catch(() => {});
  }, []);

  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^\/?storage\//, '');
    return `/storage/${cleanPath}`;
  };

  // Global wedge reader listener (robust, doesn't require focus)
  useEffect(() => {
    let buffer = '';
    let timeoutId: NodeJS.Timeout;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys and ignore if they are typing in a normal input (though scanner page only has one)
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      
      // If Enter is pressed, process buffer
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = buffer.trim();
        if (value) {
          doScan(value);
        }
        buffer = '';
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
      
      // Append printable characters
      if (e.key.length === 1) {
        buffer += e.key;
      }
      
      // Clear buffer if typing is too slow (differentiates scanner from human typing)
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        buffer = '';
      }, 150); // Scanners type very fast
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      clearTimeout(timeoutId);
    };
  }, []);

  const doScan = (idNumber: string) => {
    const cached = userCacheRef.current.get(idNumber);
    if (cached) {
      setRecentScan({
        message: 'Scan registered',
        type: 'Scan',
        status: 'Processing...',
        user: {
          name: cached.name,
          photo_url: cached.photo_url || undefined,
          role: cached.role,
          profile: cached.role === 'student'
            ? { grade: cached.grade, section: cached.section }
            : { subject: cached.subject, contact_number: cached.contact_number },
        },
      });
      setError(null);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setRecentScan(null);
        setError(null);
      }, 3000);

      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });

      api.post('/api/scan', { id_number: idNumber }).catch(() => {});
    } else {
      api.post('/api/scan/lookup', { id_number: idNumber }).then((res) => {
        setRecentScan(res.data as ScanResponse);
        setError(null);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setRecentScan(null);
          setError(null);
        }, 3000);
        queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
        api.post('/api/scan', { id_number: idNumber }).catch(() => {});
      }).catch((err) => {
        setRecentScan(null);
        setError(err.response?.data?.message || 'Scan failed');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setRecentScan(null);
          setError(null);
        }, 3000);
      });
    }
  };

  // Note: Local handleKeyDown is removed since global listener captures everything

  return (
    <>
      <div className="flex flex-col items-center justify-center h-full min-h-[80vh] relative">
        
        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-maroon-50/50 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="w-full max-w-5xl text-center flex flex-col items-center justify-center space-y-12">
          
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight">Active Scanner</h1>
            <p className="text-slate-500 text-xl font-medium">Please scan your QR code below.</p>
          </div>
            
          <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
            
            {/* Hidden input to capture scanner strokes */}
            <Input 
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-default"
              autoFocus
              readOnly
            />{recentScan ? (
              <div className="w-full max-w-5xl mx-auto bg-white rounded-[2rem] shadow-sm p-10 text-left relative z-10">
                <div className="flex gap-12 items-center">
                  <div className="w-[340px] h-[400px] shrink-0 bg-slate-100 rounded-3xl overflow-hidden relative">
                    {recentScan.user.photo_url ? (
                      <img 
                        src={getImageUrl(recentScan.user.photo_url)} 
                        alt={recentScan.user.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                           (e.target as HTMLImageElement).style.display = 'none';
                           (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center text-7xl font-bold text-slate-400 ${recentScan.user.photo_url ? 'hidden' : ''}`}>
                      {recentScan.user.name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-[#0f172a] text-6xl font-bold leading-[1.1] tracking-tight mb-8">
                      {recentScan.user.name.split(' ').slice(0, 2).join(' ')}<br />
                      {recentScan.user.name.split(' ').slice(2).join(' ')}
                    </h2>
                    <div className="h-px w-full bg-gray-100 mb-8"></div>
                    
                    <div className="space-y-8">
                      {recentScan.user.profile?.grade ? (
                        <>
                          <div className="flex items-center gap-6">
                            <div className="w-[72px] h-[72px] bg-[#fdf4f4] rounded-2xl flex items-center justify-center shrink-0">
                               <GraduationCap className="text-[#7a1315] w-9 h-9" />
                            </div>
                            <div>
                              <p className="text-slate-500 font-medium text-xl mb-1">Grade</p>
                              <p className="text-[#7a1315] font-bold text-3xl">{recentScan.user.profile.grade}</p>
                            </div>
                          </div>
                          {recentScan.user.profile?.section && (
                            <div className="flex items-center gap-6">
                              <div className="w-[72px] h-[72px] bg-[#fdf4f4] rounded-2xl flex items-center justify-center shrink-0">
                                 <Users className="text-[#7a1315] w-9 h-9" />
                              </div>
                              <div>
                                <p className="text-slate-500 font-medium text-xl mb-1">Section</p>
                                <p className="text-[#7a1315] font-bold text-3xl">{recentScan.user.profile.section}</p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : recentScan.user.profile?.department ? (
                        <div className="flex items-center gap-6">
                          <div className="w-[72px] h-[72px] bg-[#fdf4f4] rounded-2xl flex items-center justify-center shrink-0">
                             <Users className="text-[#7a1315] w-9 h-9" />
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium text-xl mb-1">Department</p>
                            <p className="text-[#7a1315] font-bold text-3xl">{recentScan.user.profile.department}</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="w-full text-center">
                <XCircle size={140} className="mx-auto mb-6 text-red-500 drop-shadow-sm" />
                <h3 className="text-4xl font-extrabold text-slate-800">Scan Failed</h3>
                <p className="text-red-600 font-bold text-xl mt-6 bg-red-100/50 border border-red-200 py-4 px-8 rounded-2xl inline-block shadow-sm">{error}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-300 transition-all">
                <div className="relative group">
                  <div className="absolute -inset-8 bg-maroon-100 rounded-full animate-pulse opacity-60"></div>
                  <ScanFace size={160} className="relative z-10 text-slate-300 group-hover:text-maroon-400 transition-colors duration-500" />
                </div>
                <p className="mt-12 text-2xl font-semibold text-slate-400">Waiting for next scan...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
