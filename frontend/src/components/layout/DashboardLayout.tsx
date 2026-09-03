'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import api from '@/lib/axios';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Bell,
  LayoutDashboard,
  Users,
  Settings,
  LogOut, 
  Menu,
  ScanFace,
  History,
  GraduationCap,
  Briefcase,
  UserSquare,
  UserPlus,
  BarChart3,
  FileTerminal,
  ShieldCheck,
  ShieldAlert,
  Sun,
  Moon,
  FileText,
  ChevronDown,
  MapPinned,
  CalendarOff,
  UserMinus,
  ClipboardList,
  CalendarDays,
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
  LogIn,
  Info,
  MapPin,
  Presentation,
  Camera,
  Badge
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { PasswordAlert } from '@/components/ui/password-alert';
import { useTheme } from 'next-themes';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NotificationRecord {
  id: string;
  read_at: string | null;
  created_at: string;
  data?: {
    type?: string;
    title?: string;
    message?: string;
  };
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'time_in' | 'time_out' | 'system'>('all');
  const [selectedNotif, setSelectedNotif] = useState<NotificationRecord | null>(null);
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  usePushNotifications();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/me');
      return res.data.user;
    },
    retry: false,
  });

  const { data: systemPreferences } = useQuery({
    queryKey: ['system-preferences'],
    queryFn: async () => {
      const response = await api.get('/api/system/preferences');
      return response.data as { default_theme?: string; compact_tables?: boolean };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!systemPreferences) return;
    document.documentElement.dataset.compactTables = String(!!systemPreferences.compact_tables);
    if (!localStorage.getItem('theme') && systemPreferences.default_theme) {
      setTheme(systemPreferences.default_theme);
    }
  }, [systemPreferences, setTheme]);

  useEffect(() => {
    const applyPreferences = (event: Event) => {
      const preferences = (event as CustomEvent<{ default_theme?: string; compact_tables?: boolean }>).detail;
      document.documentElement.dataset.compactTables = String(!!preferences.compact_tables);
      if (preferences.default_theme) setTheme(preferences.default_theme);
      queryClient.setQueryData(['system-preferences'], preferences);
    };
    window.addEventListener('system-preferences-updated', applyPreferences);
    return () => window.removeEventListener('system-preferences-updated', applyPreferences);
  }, [queryClient, setTheme]);

  const handleLogout = async () => {
    try {
      await api.post('/api/logout');
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('needs_password_change');
    localStorage.removeItem('user_role');
    router.push('/login');
  };

  useIdleTimer(900000, async () => { // 15 mins
    try {
      await api.post('/api/logout');
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('needs_password_change');
    localStorage.removeItem('user_role');
    window.location.href = '/?idle=true';
  });

  const { data: isMaintenanceMode, refetch: refetchMaintenance } = useQuery({
    queryKey: ['maintenanceStatus'],
    queryFn: async () => {
      const res = await api.get('/api/system/maintenance/status');
      return res.data.maintenance_mode;
    },
    enabled: !!user,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });

  const toggleMaintenance = async () => {
    try {
      const newStatus = !isMaintenanceMode;
      queryClient.setQueryData(['maintenanceStatus'], newStatus); // Optimistic update
      
      const toastMsg = newStatus ? '🔧 Maintenance mode is now active. All non-admin users have been logged out for system updates.' : '✅ Maintenance mode has been turned off. The system is now fully operational.';
      localStorage.setItem('toast_message', toastMsg);
      window.dispatchEvent(new Event('toast-trigger')); // Trigger toast instantly

      await api.post('/api/system/maintenance');
      refetchMaintenance();
    } catch {
      queryClient.setQueryData(['maintenanceStatus'], isMaintenanceMode); // Revert on failure
      alert('Failed to toggle maintenance mode');
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      const role = user.roles[0];
      const rootPath = pathname.split('/')[1];
      
      const rolePathMap: Record<string, string> = {
        'student': 'student',
        'teacher': 'teacher',
        'principal': 'principal',
        'guard': 'guard',
        'admin': 'admin',
        'super-admin': 'admin'
      };

      const expectedBasePath = rolePathMap[role];

      // If user tries to access a path they shouldn't, redirect them
      if (rootPath && expectedBasePath && rootPath !== expectedBasePath && ['student', 'teacher', 'principal', 'guard', 'admin'].includes(rootPath)) {
        router.push(`/${expectedBasePath}`);
      }
    }
  }, [user, isLoading, router, pathname]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/api/notifications');
      return res.data.data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const unreadCount = notifications.filter((n: { read_at: string | null }) => n.read_at === null).length;
  const filteredNotifications = notifFilter === 'all'
    ? notifications
    : notifications.filter((n: { data?: { type?: string } }) => n.data?.type === notifFilter);

  // Show toast for new unread notifications
  const prevUnreadRef = useRef(unreadCount);
  useEffect(() => {
    if (prevUnreadRef.current !== 0 && unreadCount > prevUnreadRef.current) {
      const newest = notifications.find((n: { read_at: string | null }) => n.read_at === null);
      if (newest) {
        const msg = newest.data?.message || newest.data?.title || 'New notification';
        localStorage.setItem('toast_message', msg);
        window.dispatchEvent(new Event('toast-trigger'));
      }
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, notifications]);

  const markAsReadMutation = useMutation({
    mutationFn: async (id?: string) => {
      if (id) {
        await api.post(`/api/notifications/${id}/mark-as-read`);
      } else {
        await api.post('/api/notifications/mark-as-read');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Student Geolocation Tracking (placed before early returns to keep hook order consistent)
  useEffect(() => {
    const isStudentRole = user?.roles?.[0] === 'student';
    if (!isStudentRole || typeof navigator === 'undefined' || !navigator.geolocation) return;

    let watchId: number;
    let lastSent = 0;

    const startTracking = () => {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          if (now - lastSent > 15000) {
            lastSent = now;
            api.post('/v1/student/location', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }).then(res => {
              if (res.data.out_of_bounds) {
                if (navigator.vibrate) {
                  navigator.vibrate([200, 100, 200, 100, 500]);
                }
                localStorage.setItem('toast_message', 'WARNING: You are outside the school campus!');
                window.dispatchEvent(new Event('toast-trigger'));
              }
            }).catch(err => console.error('Location report error', err));
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    };

    startTracking();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B3A82] flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 rounded-md bg-white flex items-center justify-center shadow-xl p-1.5">
           <Image src="/school-logo.jpg" alt="TWCES" width={72} height={72} className="w-full h-full object-cover rounded-md" unoptimized priority />
        </div>
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-white text-[15px] font-semibold tracking-wide">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Generate initials for avatar
  const initials = user.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isGuard = user.roles[0] === 'guard';
  const isAdmin = user.roles[0] === 'super-admin' || user.roles[0] === 'admin';
  const isPrincipal = user.roles[0] === 'principal';
  const isTeacher = user.roles[0] === 'teacher';
  const isStudent = user.roles[0] === 'student';
  
  const notifBasePath = `/${user.roles[0] === 'super-admin' ? 'admin' : user.roles[0]}/notifications`;

  // Navigation structure based on image
  const mainNavigation = [
    { name: 'Dashboard', href: `/${user.roles[0] === 'super-admin' ? 'admin' : user.roles[0]}`, icon: LayoutDashboard },
    ...(isGuard ? [{ name: 'Scanner', href: '/guard/scanner', icon: ScanFace }] : []),
    ...(isGuard ? [{ name: 'History', href: '/guard/history', icon: History }] : []),
  ];

  const managementNav = [
    ...(isPrincipal ? [
      { name: 'Employees', href: '/principal/employees', icon: Briefcase },
      { name: 'Students', href: '/principal/students', icon: GraduationCap },
      { name: 'Notices', href: '/principal/notices', icon: FileTerminal },
      { name: 'Announcements', href: '/principal/announcements', icon: BarChart3 },
      { name: 'Leave Management', href: '/principal/leaves', icon: CalendarOff },
      { name: 'School Map', href: '/principal/map', icon: MapPinned }
    ] : isTeacher ? [
      { name: 'Add Students', href: '/teacher/students', icon: UserPlus },
      { name: 'Assigned Class', href: '/teacher/assigned-class', icon: Users },
      { name: 'Assigned Students', href: '/teacher/assigned-students', icon: GraduationCap },
      { name: 'Absent Today', href: '/teacher/absent', icon: UserMinus },
      { name: 'Excuse Students', href: '/teacher/excuse-students', icon: ClipboardList },
      { name: 'Leave Requests', href: '/teacher/leaves', icon: CalendarOff },
      { name: 'Report & Analytics', href: '/teacher/reports', icon: BarChart3 }
    ] : isAdmin ? [
      { name: 'Students', href: '/admin/students', icon: GraduationCap },
      { name: 'Teachers', href: '/admin/teachers', icon: Presentation },
      { name: 'Attendance Logs', href: '/admin/attendance', icon: History },
      { name: 'Category Level', href: '/admin/category-level', icon: ClipboardList },
      { name: 'School Map', href: '/admin/school-map', icon: MapPin },
      { name: 'Photo Booth', href: '/admin/photobooth', icon: Camera }
    ] : isGuard ? [
      { name: 'Visitors', href: '/guard/visitors', icon: UserSquare }
    ] : isStudent ? [
      { name: 'Attendance Record', href: '/student/attendance', icon: ClipboardList },
      { name: 'Schedules', href: '/student/schedules', icon: CalendarDays },
      { name: 'Excuse Letter', href: '/student/excuse-letter', icon: FileTerminal },
    ] : [])
  ];



  const systemNav = [
    ...(isAdmin ? [
      { name: 'Users Logs', href: '/admin/system/logs', icon: FileText },
      { name: 'User Management', href: '/admin/system/users', icon: Users },
      { name: 'ID Management', href: '/admin/system/id-management', icon: Badge }
    ] : []),
    { name: 'Settings', href: `/${isAdmin ? 'admin' : user.roles[0]}/settings`, icon: Settings },
  ];

  const NavItem = ({ item }: { item: { href: string; icon: React.ElementType; name: string } }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={`flex items-center px-4 py-3 mx-4 rounded-md font-bold transition-all duration-200 relative group overflow-visible ${
          isActive 
            ? 'text-white bg-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.1)]' 
            : 'text-white/70 hover:bg-white/5 hover:text-white'
        } ${sidebarCollapsed ? 'mx-3 justify-center px-0' : ''}`}
      >
        <item.icon className={`w-[20px] h-[20px] transition-colors ${sidebarCollapsed ? 'mr-0' : 'mr-4'} ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} strokeWidth={isActive ? 2.5 : 2} />
        
        {!sidebarCollapsed && (
          <span className={`whitespace-nowrap ${isActive ? 'font-bold tracking-tight' : 'font-semibold'}`}>{item.name}</span>
        )}
        
        {/* Tooltip for collapsed state */}
        {sidebarCollapsed && (
          <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100]">
            {item.name}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#F8FAFC] dark:bg-[#0f1115] flex text-slate-900 dark:text-slate-100 font-sans selection:bg-maroon-500 selection:text-white transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#0B3A82] border-r border-[#0B3A82] transition-all duration-300 ease-in-out flex flex-col shrink-0 shadow-2xl 
        ${sidebarCollapsed ? 'md:w-[88px] md:translate-x-0 md:relative z-[60]' : 'md:w-[260px] md:translate-x-0 md:relative'}
        ${sidebarOpen ? 'w-[260px] translate-x-0' : 'w-[260px] -translate-x-full md:translate-x-0'}
      `}>
        
        {/* Collapse Button */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`absolute -right-4 top-8 bg-white text-slate-400 hover:text-slate-600 w-8 h-8 rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.15)] items-center justify-center z-[70] hidden md:flex transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={3} />
        </button>

        {/* Logo */}
        <div className={`flex items-center h-[96px] px-6 w-full shrink-0 ${sidebarCollapsed ? 'justify-center px-0' : ''}`}>
          <div className="flex items-center justify-center shrink-0">
            <Image 
              src="/school-logo.jpg" 
              alt="TWCES" 
              width={52} 
              height={52} 
              priority 
              unoptimized 
              className="w-[52px] h-[52px] object-cover drop-shadow-sm rounded-full bg-white" 
            />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col ml-4 overflow-hidden whitespace-nowrap">
              <span className="font-black text-[20px] text-white tracking-tight leading-tight">
                TWCES
              </span>
            </div>
          )}
        </div>
        
        {/* Navigation List */}
        <nav className="flex-1 py-4 space-y-8 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          <div className="space-y-1 mt-2">
            <p className={`px-8 text-[10px] font-bold tracking-widest text-white/40 mb-3 mt-4 uppercase ${sidebarCollapsed ? 'text-center px-0 text-[8px]' : ''}`}>
              {sidebarCollapsed ? 'MAIN' : 'MAIN'}
            </p>
            {mainNavigation.map((item) => <NavItem key={item.name} item={item} />)}
          </div>

          {managementNav.length > 0 && (
            <div>
              <p className={`px-8 text-[10px] font-bold tracking-widest text-white/40 mb-3 mt-6 uppercase ${sidebarCollapsed ? 'text-center px-0 text-[8px]' : ''}`}>
                {sidebarCollapsed ? 'MGMT' : 'MANAGEMENT'}
              </p>
              <div className="space-y-1">
                {managementNav.map((item) => <NavItem key={item.name} item={item} />)}
              </div>
            </div>
          )}

          {systemNav.length > 0 && (
            <div>
              <p className={`px-8 text-[10px] font-bold tracking-widest text-white/40 mb-3 mt-6 uppercase ${sidebarCollapsed ? 'text-center px-0 text-[8px]' : ''}`}>
                {sidebarCollapsed ? 'SYS' : 'SYSTEM'}
              </p>
              <div className="space-y-1">
                {systemNav.map((item) => <NavItem key={item.name} item={item} />)}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom Support CTA & Profile */}
        <div className={`mt-auto flex flex-col p-4 ${sidebarCollapsed ? 'px-3' : ''}`}>
          
          {(user.roles[0] === 'admin' || user.roles[0] === 'super-admin') && (
            <div 
              onClick={toggleMaintenance}
              className={`bg-[#0A2D6B] rounded-md p-3 flex items-center justify-between mb-4 shadow-sm cursor-pointer hover:bg-[#092558] transition-colors relative group overflow-visible ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center shrink-0">
                  <ShieldAlert className={`w-8 h-8 ${isMaintenanceMode ? 'text-amber-400' : 'text-white/40'}`} />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex flex-col text-left overflow-hidden whitespace-nowrap">
                    <span className="text-[13px] font-bold text-white leading-tight truncate">Maintenance</span>
                    <span className={`text-[11px] font-medium mt-0.5 ${isMaintenanceMode ? 'text-amber-400' : 'text-white/60'}`}>
                      {isMaintenanceMode ? 'System Offline' : 'System Online'}
                    </span>
                  </div>
                )}
              </div>
              {!sidebarCollapsed && (
                <div className={`w-9 h-5 rounded-md flex items-center transition-colors px-0.5 shrink-0 ${isMaintenanceMode ? 'bg-amber-500' : 'bg-black/20'}`}>
                  <div className={`w-4 h-4 rounded-md bg-white shadow-sm transition-transform ${isMaintenanceMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              )}
              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100]">
                  Maintenance: {isMaintenanceMode ? 'ON' : 'OFF'}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-md text-white border border-white/10 hover:bg-white/10 font-bold transition-all bg-[#0A2D6B]/50 shadow-sm text-[13px] relative group overflow-visible ${sidebarCollapsed ? 'px-0' : 'px-6'}`}
          >
            <LogOut className="w-[16px] h-[16px] shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
            
            {/* Tooltip for collapsed state */}
            {sidebarCollapsed && (
              <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100]">
                Sign Out
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-[#0f1115] transition-colors duration-300">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-[#0f1115] border-b border-slate-100 dark:border-b-0 flex items-center justify-between px-6 md:px-8 shrink-0 transition-colors duration-300">
          <div className="flex items-center flex-1">
            <button 
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
                if (sidebarCollapsed) setSidebarCollapsed(false);
              }}
              className="p-2.5 mr-4 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Breadcrumb replacing Title */}
            <div className="hidden md:flex items-center text-[15px] font-bold">
              <span className="text-slate-500 dark:text-slate-300">Dashboard</span>
              <span className="mx-2 text-slate-400 dark:text-slate-500 font-normal">&gt;</span>
              <span className="text-[#0B3A82] dark:text-blue-500 capitalize">
                {pathname.split('/').pop()?.replace('-', ' ') || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
                {/* Notification Modal */}
                <Dialog>
                  <DialogTrigger className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all duration-300 cursor-pointer">
                    <Bell className="w-7 h-7" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-5 h-5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-md text-[10px] font-bold text-white leading-none">
                        {unreadCount}
                      </span>
                    )}
                  </DialogTrigger>
                  <DialogContent 
                    closeClassName="top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 bg-slate-50 rounded-md w-8 h-8 flex items-center justify-center border-none transition-colors"
                    className="sm:max-w-[720px] gap-0 rounded-md overflow-hidden p-0 border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 bg-white"
                  >
                    <DialogHeader className="px-8 pt-8 pb-5 border-none m-0">
                      <div className="flex items-center gap-4">
                        <div className="w-[64px] h-[64px] rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                          <div className="relative">
                            <Bell className="w-[28px] h-[28px] text-[#0B3A82]" strokeWidth={2.5} />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-md border-2 border-blue-50"></div>
                          </div>
                        </div>
                        <div className="flex flex-col items-start mt-1">
                          <DialogTitle className="text-[24px] font-black text-slate-900 tracking-tight">Notifications</DialogTitle>
                          <DialogDescription className="text-[14px] font-medium text-slate-500 mt-0.5">
                            Stay updated with the latest alerts.
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    {/* Filters Row */}
                    <div className="px-8 py-4 flex items-center justify-between border-y border-slate-100 bg-white">
                      <div className="flex items-center gap-2">
                        {[
                          { key: 'all', label: 'All', count: notifications.length },
                          { key: 'time_in', label: 'Time In', count: notifications.filter((n: { data?: { type?: string } }) => n.data?.type === 'time_in').length },
                          { key: 'time_out', label: 'Time Out', count: notifications.filter((n: { data?: { type?: string } }) => n.data?.type === 'time_out').length },
                          { key: 'system', label: 'System', count: notifications.filter((n: { data?: { type?: string } }) => n.data?.type === 'system').length },
                        ].map((f) => (
                          <button
                            key={f.key}
                            onClick={() => setNotifFilter(f.key as typeof notifFilter)}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all ${
                              notifFilter === f.key
                                ? 'bg-[#0B3A82] text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-[12px] font-bold">{f.label}</span>
                            <span className={`flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold ${
                              notifFilter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>{f.count}</span>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => markAsReadMutation.mutate(undefined)} className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#0B3A82] hover:text-[#092558] transition-colors">
                        <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                        Mark all as read
                      </button>
                    </div>

                    <div className="flex flex-col px-8 py-6 max-h-[440px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-7 bg-white">
                       {filteredNotifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 pb-12 text-slate-400">
                            <div className="relative mb-6">
                              <div className="w-[120px] h-[120px] rounded-md bg-blue-50 flex items-center justify-center">
                                <Bell className="w-[56px] h-[56px] text-[#0B3A82]" strokeWidth={1.5} />
                              </div>
                              <div className="absolute bottom-2 right-2 w-[34px] h-[34px] bg-white rounded-md flex items-center justify-center shadow-sm border border-slate-100">
                                <CheckCircle2 className="w-[22px] h-[22px] text-[#0B3A82]" strokeWidth={2.5} />
                              </div>
                            </div>
                           <p className="font-extrabold text-[22px] text-slate-900 mb-2">No new notifications</p>
                           <p className="text-[15px] font-medium text-slate-500">You&apos;re all caught up!</p>
                         </div>
                       ) : (
                         <>
{[
                              { 
                                title: 'TODAY', 
                                items: filteredNotifications.filter((n: { created_at: string }) => new Date(n.created_at).toDateString() === new Date().toDateString()) 
                              },
                              { 
                                title: 'YESTERDAY', 
                                items: filteredNotifications.filter((n: { created_at: string }) => {
                                 const d = new Date(n.created_at);
                                 const y = new Date(); y.setDate(y.getDate() - 1);
                                 return d.toDateString() === y.toDateString();
                               })
                             },
{ 
                                title: 'EARLIER', 
                                items: filteredNotifications.filter((n: { created_at: string }) => {
                                 const d = new Date(n.created_at);
                                 const y = new Date(); y.setDate(y.getDate() - 1);
                                 return d < y && d.toDateString() !== new Date().toDateString() && d.toDateString() !== y.toDateString();
                               })
                             }
                           ].map((group) => group.items.length > 0 && (
                             <div key={group.title} className="space-y-3">
                               <p className="text-[11px] font-bold text-slate-500 tracking-widest">{group.title}</p>
                               <div className="space-y-3">
                                 {group.items.map((notification: { id: string, read_at: string | null, created_at: string, data?: { title?: string, message?: string } }) => {
                                   const isTimeIn = notification.data?.title?.includes('Time In');
                                   const isTimeOut = notification.data?.title?.includes('Time Out');
                                   const isSystem = notification.data?.title?.includes('System');
                                   const isExcuse = notification.data?.title?.includes('Excuse');
                                   
                                   let IconToUse = Bell;
                                   let iconClass = 'bg-blue-50 text-blue-600';
                                   
                                   if (isTimeIn) { IconToUse = LogIn; iconClass = 'bg-emerald-50 text-emerald-600'; }
                                   else if (isTimeOut) { IconToUse = LogOut; iconClass = 'bg-amber-50 text-amber-600'; }
                                   else if (isSystem) { IconToUse = ShieldCheck; iconClass = 'bg-purple-50 text-purple-600'; }
                                   else if (isExcuse) { IconToUse = Info; iconClass = 'bg-blue-50 text-blue-600'; }

                                   return (
                                     <div 
                                       key={notification.id} 
                                       onClick={() => { setSelectedNotif(notification); if (!notification.read_at) markAsReadMutation.mutate(notification.id); }}
                                       className="p-4 rounded-md border border-slate-100 bg-white flex items-center justify-between gap-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] cursor-pointer hover:border-slate-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all"
                                     >
                                       <div className="flex items-center gap-4">
                                         <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${iconClass}`}>
                                           <IconToUse className="w-5 h-5" strokeWidth={2.5} />
                                         </div>
                                         <div className="flex flex-col">
                                           <p className="text-[14px] font-bold text-slate-900 mb-0.5">{notification.data?.title || 'Notification'}</p>
                                           <p className="text-[12px] font-medium text-slate-500">{notification.data?.message || 'You have a new message.'}</p>
                                         </div>
                                       </div>
                                       <div className="flex items-center gap-2.5 shrink-0">
                                         <span className="text-[11px] font-bold text-slate-500">
                                           {group.title === 'YESTERDAY' ? `Yesterday, ` : group.title === 'EARLIER' ? `${new Date(notification.created_at).toLocaleDateString()} - ` : ''}
                                           {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                         </span>
                                         <div className={`w-2 h-2 rounded-md ${notification.read_at ? 'bg-slate-300' : 'bg-red-500'}`} />
                                       </div>
                                     </div>
                                   );
                                 })}
                               </div>
                             </div>
                           ))}
                         </>
                       )}
                    </div>
                    
<div className="px-6 pb-6 bg-white">
                      <Link href={notifBasePath} className="p-4 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-100 flex items-center justify-between transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-md bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center shrink-0 transition-colors">
                            <Bell className="w-5 h-5 text-[#0B3A82]" />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[14px] font-bold text-[#0B3A82]">View all notifications</p>
                            <p className="text-[12px] font-medium text-[#0B3A82]/80">See full history and manage notifications</p>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center shadow-sm shrink-0 group-hover:shadow transition-all">
                          <ArrowRight className="w-5 h-5 text-[#0B3A82]" />
                        </div>
                      </Link>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Notification Detail Modal */}
                <Dialog open={!!selectedNotif} onOpenChange={(open) => { if (!open) setSelectedNotif(null); }}>
                  <DialogContent 
                    closeClassName="top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md w-8 h-8 flex items-center justify-center border-none transition-colors"
                    className="sm:max-w-[480px] rounded-md overflow-hidden p-0 border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]"
                  >
                    {selectedNotif && (
                      <div className="p-7">
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-14 h-14 rounded-md flex items-center justify-center shrink-0 ${
                            selectedNotif.data?.type === 'time_in' ? 'bg-emerald-50 text-emerald-600' :
                            selectedNotif.data?.type === 'time_out' ? 'bg-amber-50 text-amber-600' :
                            selectedNotif.data?.type === 'system' ? 'bg-purple-50 text-purple-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {selectedNotif.data?.type === 'time_in' ? <LogIn className="w-6 h-6" /> :
                             selectedNotif.data?.type === 'time_out' ? <LogOut className="w-6 h-6" /> :
                             selectedNotif.data?.type === 'system' ? <ShieldCheck className="w-6 h-6" /> :
                             <Bell className="w-6 h-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[18px] font-bold text-slate-900 tracking-tight truncate">{selectedNotif.data?.title || 'Notification'}</h3>
                            <p className="text-[13px] font-medium text-slate-400 mt-0.5">{new Date(selectedNotif.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <div className={`w-3 h-3 rounded-md shrink-0 ${selectedNotif.read_at ? 'bg-slate-300' : 'bg-red-500'}`} />
                        </div>
                        <div className="bg-slate-50 rounded-md p-5">
                          <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedNotif.data?.message || 'No additional details.'}</p>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

               {/* Theme Toggle */}
               <button 
                 onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                 className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all duration-300 cursor-pointer"
               >
                 {theme === 'dark' ? (
                   <Sun className="w-7 h-7" />
                 ) : (
                   <Moon className="w-7 h-7" />
                 )}
               </button>
            </div>

             {/* Profile Dropdown */}
             <div className="relative border-l border-slate-200 pl-6 ml-2">
               <div 
                 role="button" 
                 tabIndex={0} 
                 onClick={() => setProfileOpen(!profileOpen)}
                 className="flex items-center gap-3 cursor-pointer group"
               >
                  <div className="hidden md:flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-[22px] h-[22px] text-[#0B3A82]" strokeWidth={2.5} />
                    </div>
                   <div className="flex flex-col text-left mr-1">
                     <span className="text-sm font-bold text-slate-800">{user.name}</span>
                          <span className="text-xs text-slate-500 font-medium capitalize bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md mt-1.5 inline-block">{user?.roles[0].replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                        </div>
                 </div>
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-[#0B3A82] flex items-center justify-center text-white font-bold text-[15px] shadow-sm shrink-0">
                      {initials}
                    </div>
                   <div className="absolute bottom-0 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                 </div>
                 <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
               </div>
              
              {/* Dropdown Menu */}
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-md shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50">
                      <p className="font-bold text-slate-800">Account Options</p>
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <button className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 rounded-md transition-colors text-left group/btn">
                        <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 group-hover/btn:bg-blue-100 transition-colors">
                          <UserSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">My Profile</p>
                          <p className="text-[10px] text-slate-500">View and edit personal details</p>
                        </div>
                      </button>
                      
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 hover:bg-red-50 rounded-md transition-colors text-left group/btn">
                        <div className="w-10 h-10 rounded-md bg-red-50 flex items-center justify-center text-red-600 group-hover/btn:bg-red-100 transition-colors">
                          <LogOut className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-red-600 text-sm">Secure Logout</p>
                          <p className="text-[10px] text-red-500/80">End your current session</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <PasswordAlert />
        <main className="flex-1 overflow-auto p-6 md:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
