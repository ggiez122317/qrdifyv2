'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';

export function IosToast() {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const triggerNotification = (msg: string) => {
      setMessage(msg);
      setIsVisible(true);

      // Native OS Push Notification
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("SAS Super Admin", {
            body: msg,
            icon: "/id-assets/deped.png"
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              new Notification("SAS Super Admin", {
                body: msg,
                icon: "/id-assets/deped.png"
              });
            }
          });
        }
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShow(true);
        });
      });

      setTimeout(() => {
        setShow(false);
        setTimeout(() => setIsVisible(false), 400);
      }, 3000);
    };

    const checkToast = () => {
      const storedMessage = localStorage.getItem('toast_message');
      if (storedMessage) {
        localStorage.removeItem('toast_message');
        triggerNotification(storedMessage);
      }
    };

    checkToast();
    // Poll every 500ms since the layout no longer unmounts between pages
    const intervalId = setInterval(checkToast, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  if (!mounted || !isVisible) return null;

  const toastContent = (
    <div 
      className={`fixed top-8 left-1/2 z-[9999] transition-all duration-400 ease-out pointer-events-none ${
        show ? 'opacity-100 translate-y-0 -translate-x-1/2 scale-100' : 'opacity-0 -translate-y-4 -translate-x-1/2 scale-95'
      }`}
    >
      <div className="flex flex-col overflow-hidden bg-white border border-slate-200 shadow-xl rounded-[20px] text-slate-800 w-max min-w-[320px]">
        <div className="flex items-center gap-3 px-5 py-3.5">
          <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-[15px] leading-none tracking-tight">{message}</p>
          </div>
        </div>
        {/* Progress indicator bar */}
        <div className="h-[4px] w-full bg-slate-100 relative">
          <div 
            className="absolute top-0 left-0 h-full bg-emerald-500 rounded-r-full"
            style={{ 
              width: show ? '0%' : '100%', 
              transition: show ? 'width 2s linear' : 'none' 
            }}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
}
