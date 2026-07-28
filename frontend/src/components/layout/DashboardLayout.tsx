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
  AlertTriangle,
  MapPinned,
  CalendarOff,
  UserMinus,
  ClipboardList,
  CalendarDays,
  ChevronLeft,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { PasswordAlert } from '@/components/ui/password-alert';
import { useTheme } from 'next-themes';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
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
    refetchInterval: 3000 // Poll every 3 seconds for instant response
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
    refetchInterval: 15000,
  });

  const unreadCount = notifications.filter((n: { read_at: string | null }) => n.read_at === null).length;

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


  if (isLoading) {
    return <div className="min-h-screen bg-secondary flex items-center justify-center">Loading...</div>;
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
  
  const roleDisplay = user.roles[0]
    ? user.roles[0].split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'User';

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
      { name: 'Teachers', href: '/admin/teachers', icon: Briefcase },
      { name: 'Photo Booth', href: '/admin/photobooth', icon: ScanFace }
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
      { name: 'User Management', href: '/admin/system/users', icon: Users }
    ] : []),
    { name: 'Settings', href: `/${isAdmin ? 'admin' : user.roles[0]}/settings`, icon: Settings },
  ];

  const NavItem = ({ item }: { item: { href: string; icon: React.ElementType; name: string } }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={`flex items-center px-4 py-3 mx-4 rounded-xl font-bold transition-all duration-200 relative group overflow-visible ${
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
          <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100]">
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
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#611013] border-r border-[#611013] transition-all duration-300 ease-in-out flex flex-col shrink-0 shadow-2xl 
        ${sidebarCollapsed ? 'md:w-[88px] md:translate-x-0 md:relative z-[60]' : 'md:w-[260px] md:translate-x-0 md:relative'}
        ${sidebarOpen ? 'w-[260px] translate-x-0' : 'w-[260px] -translate-x-full md:translate-x-0'}
      `}>
        
        {/* Collapse Button */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`absolute -right-4 top-8 bg-white text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] items-center justify-center z-[70] hidden md:flex transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={3} />
        </button>

        {/* Logo */}
        <div className={`flex items-center h-[96px] px-6 w-full shrink-0 ${sidebarCollapsed ? 'justify-center px-0' : ''}`}>
          <div className="flex items-center justify-center shrink-0">
            <Image 
              src="/logo.png" 
              alt="Qridify" 
              width={52} 
              height={52} 
              priority 
              unoptimized 
              className="w-[52px] h-[52px] object-contain drop-shadow-sm rounded-full bg-white" 
            />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col ml-4 overflow-hidden whitespace-nowrap">
              <span className="font-black text-[22px] text-white tracking-widest leading-tight">
                QRIDIFY
              </span>
              <span className="text-[9px] text-white/70 font-bold tracking-[0.1em] mt-0.5 uppercase">
                Smart • Secure • Seamless
              </span>
            </div>
          )}
        </div>
        
        {/* Navigation List */}
        <nav className={`flex-1 py-4 space-y-8 ${sidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
          
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
          
          {user.roles[0] === 'admin' || user.roles[0] === 'super-admin' ? (
            <div 
              onClick={toggleMaintenance}
              className={`bg-[#510b10] rounded-xl p-3 flex items-center justify-between mb-4 shadow-sm cursor-pointer hover:bg-[#4a0a0e] transition-colors relative group overflow-visible ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
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
                <div className={`w-9 h-5 rounded-full flex items-center transition-colors px-0.5 shrink-0 ${isMaintenanceMode ? 'bg-amber-500' : 'bg-black/20'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isMaintenanceMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              )}
              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100]">
                  Maintenance: {isMaintenanceMode ? 'ON' : 'OFF'}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              )}
            </div>
          ) : (
            <div className={`bg-[#510b10] rounded-xl p-3 flex items-center justify-between mb-4 shadow-sm cursor-pointer hover:bg-[#4a0a0e] transition-colors relative group overflow-visible ${sidebarCollapsed ? 'justify-center p-2' : ''}`}>
              <div className="flex items-center gap-3">
                 <div className="relative">
                   <div className="w-10 h-10 rounded-full bg-[#3d080c] flex items-center justify-center text-white font-bold text-[13px] shrink-0">
                     {initials}
                   </div>
                   <div className="absolute bottom-0 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#510b10] rounded-full"></div>
                 </div>
                 {!sidebarCollapsed && (
                   <div className="flex flex-col text-left overflow-hidden whitespace-nowrap">
                     <span className="text-[13px] font-bold text-white leading-tight truncate max-w-[120px]">{user.name}</span>
                     <span className="text-[11px] text-white/60 font-medium capitalize mt-0.5">{roleDisplay}</span>
                   </div>
                 )}
              </div>
              {!sidebarCollapsed && <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
              
              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100]">
                  {user.name}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white border border-white/10 hover:bg-white/10 font-bold transition-all bg-[#7a1315]/20 shadow-sm text-[13px] relative group overflow-visible ${sidebarCollapsed ? 'px-0' : 'px-6'}`}
          >
            <LogOut className="w-[16px] h-[16px] shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
            
            {/* Tooltip for collapsed state */}
            {sidebarCollapsed && (
              <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100]">
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
              className="p-2.5 mr-4 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Breadcrumb replacing Title */}
            <div className="hidden md:flex items-center text-[15px] font-bold">
              <span className="text-slate-500 dark:text-slate-300">Dashboard</span>
              <span className="mx-2 text-slate-400 dark:text-slate-500 font-normal">&gt;</span>
              <span className="text-[#7a1315] dark:text-red-500 capitalize">
                {pathname.split('/').pop()?.replace('-', ' ') || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
               {/* Notification Modal */}
               <Dialog>
                 <DialogTrigger className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-300 cursor-pointer">
                   <Bell className="w-7 h-7" />
                   {unreadCount > 0 && (
                     <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-5 h-5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full text-[10px] font-bold text-white leading-none">
                       {unreadCount}
                     </span>
                   )}
                 </DialogTrigger>
                 <DialogContent 
                   closeClassName="top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full"
                   className="sm:max-w-[440px] gap-0 rounded-[28px] overflow-hidden p-0 border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                 >
                   <DialogHeader className="p-8 pb-6 border-b border-slate-100 m-0">
                     <div className="flex items-start gap-4">
                       <div className="w-[52px] h-[52px] rounded-full bg-red-50 flex items-center justify-center shrink-0">
                         <Bell className="w-[24px] h-[24px] text-[#7a1315]" strokeWidth={2} />
                       </div>
                       <div className="flex flex-col items-start mt-1">
                         <DialogTitle className="text-xl font-extrabold text-slate-900">Notifications</DialogTitle>
                         <DialogDescription className="text-sm font-medium text-slate-500 mt-0.5">
                           Stay updated with the latest alerts.
                         </DialogDescription>
                       </div>
                     </div>
                   </DialogHeader>
                   <div className="flex flex-col px-8 py-2 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 pb-12 text-slate-400">
                          <div className="relative mb-6">
                            <div className="w-[120px] h-[120px] rounded-full bg-[#fff5f5] flex items-center justify-center">
                              <Bell className="w-[56px] h-[56px] text-[#7a1315]" strokeWidth={1.5} />
                            </div>
                            <div className="absolute bottom-2 right-2 w-[34px] h-[34px] bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                              <CheckCircle2 className="w-[22px] h-[22px] text-[#7a1315]" strokeWidth={2.5} />
                            </div>
                          </div>
                          <p className="font-extrabold text-[22px] text-slate-900 mb-2">No new notifications</p>
                          <p className="text-[15px] font-medium text-slate-500">You&apos;re all caught up!</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 py-2">
                          {notifications.map((notification: { id: string; read_at: string | null; type?: string; data?: { type?: string; title?: string; message?: string }; created_at: string }) => (
                            <div 
                              key={notification.id} 
                              onClick={() => !notification.read_at && markAsReadMutation.mutate(notification.id)}
                              className={`shrink-0 p-4 rounded-xl border flex gap-4 relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer ${notification.read_at ? 'bg-white hover:bg-slate-50 border-slate-200' : 'bg-red-50 border-red-100'}`}
                            >
                              {!notification.read_at && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl"></div>}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.data?.type === 'alert' || notification.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                {notification.data?.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                  <p className={`font-bold text-sm ${notification.read_at ? 'text-slate-800' : 'text-red-800'}`}>{notification.data?.title || 'Notification'}</p>
                                  <span className={`text-[10px] font-medium ${notification.read_at ? 'text-slate-400' : 'text-red-500 bg-red-100 px-2 py-0.5 rounded'}`}>
                                    {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className={`text-xs font-medium leading-relaxed ${notification.read_at ? 'text-slate-500' : 'text-red-600/90'}`}>{notification.data?.message || 'You have a new message.'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                    <DialogFooter className="m-0 rounded-none sm:justify-center border-t border-slate-100 p-6 bg-[#f8fafc]/80">
                      <Link href="/admin/notifications" className="flex items-center justify-center gap-2 text-[15px] font-extrabold text-[#7a1315] hover:text-[#5a0d0f] transition-colors w-full">
                        <Bell className="w-4 h-4" strokeWidth={2.5} />
                        View all notifications
                        <ArrowRight className="w-4 h-4 ml-0.5" strokeWidth={2.5} />
                      </Link>
                    </DialogFooter>
                 </DialogContent>
               </Dialog>

               {/* Theme Toggle */}
               <button 
                 onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                 className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-300 cursor-pointer"
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
                   <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                     <ShieldCheck className="w-[22px] h-[22px] text-[#7a1315]" strokeWidth={2.5} />
                   </div>
                   <div className="flex flex-col text-left mr-1">
                     <span className="text-sm font-bold text-slate-800">{user.name}</span>
                          <span className="text-xs text-slate-500 font-medium capitalize bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full mt-1.5 inline-block">{user?.roles[0].replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                        </div>
                 </div>
                 <div className="relative">
                   <div className="w-11 h-11 rounded-full bg-[#7a1315] flex items-center justify-center text-white font-bold text-[15px] shadow-sm shrink-0">
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
                  <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50">
                      <p className="font-bold text-slate-800">Account Options</p>
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <button className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group/btn">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover/btn:bg-blue-100 transition-colors">
                          <UserSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">My Profile</p>
                          <p className="text-[10px] text-slate-500">View and edit personal details</p>
                        </div>
                      </button>
                      
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 hover:bg-red-50 rounded-xl transition-colors text-left group/btn">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover/btn:bg-red-100 transition-colors">
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
