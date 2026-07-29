'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export function PasswordAlert() {
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Only show if the user needs a password change
    const token = localStorage.getItem('token');
    const needsPasswordChange = localStorage.getItem('needs_password_change');
    const userRole = localStorage.getItem('user_role');
    
    setTimeout(() => {
      if (token && needsPasswordChange === 'true' && userRole) {
        setRole(userRole);
        
        // Check if dismissed within the last 5 minutes (300,000 ms)
        const dismissedAt = localStorage.getItem('password_alert_dismissed_at');
        if (dismissedAt) {
          const dismissTime = parseInt(dismissedAt, 10);
          if (Date.now() - dismissTime < 300000) {
            setIsVisible(false);
            return;
          }
        }

        // Don't show the alert on settings tab, landing page, or login page
        if (!pathname.includes('/settings') && pathname !== '/' && pathname !== '/login') {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } else {
        setIsVisible(false);
      }
    }, 0);
  }, [pathname]);

  // Strictly prevent rendering on the landing page, login, or any settings page
  if (
    !isVisible || 
    !role || 
    pathname === '/' || 
    pathname.startsWith('/login') || 
    pathname.includes('/settings')
  ) {
    return null;
  }

  const navigateToSecurity = () => {
    setIsVisible(false);
    
    // Normalize role string for routing (e.g., 'super-admin' -> 'admin')
    const routeRole = role === 'super-admin' ? 'admin' : role;
    router.push(`/${routeRole}/settings?tab=account`);
  };

  const alertContent = (
    <div className="fixed top-0 left-0 w-full z-[9999] animate-in slide-in-from-top duration-500">
      <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-bold text-sm">Action Required:</span>
              <span className="text-sm text-red-50 font-medium">
                For your security, please update your default password.
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={navigateToSecurity}
              className="flex-1 sm:flex-none bg-white text-red-600 hover:bg-red-50 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              Update Now <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                localStorage.setItem('password_alert_dismissed_at', Date.now().toString());
                setIsVisible(false);
              }}
              className="p-2 text-red-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(alertContent, document.body) : null;
}
