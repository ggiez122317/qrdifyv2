'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';

export function IosToast() {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setMounted(true);

    const triggerNotification = (msg: string) => {
      setMessage(msg);
      setIsVisible(true);
      setProgress(100);

      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Qridify", { body: msg, icon: "/logo.png" });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              new Notification("Qridify", { body: msg, icon: "/logo.png" });
            }
          });
        }
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShow(true);
          setProgress(0);
        });
      });

      setTimeout(() => {
        setShow(false);
        setTimeout(() => setIsVisible(false), 500);
      }, 3500);
    };

    const checkToast = () => {
      const storedMessage = localStorage.getItem('toast_message');
      if (storedMessage) {
        localStorage.removeItem('toast_message');
        triggerNotification(storedMessage);
      }
    };

    checkToast();
    const intervalId = setInterval(checkToast, 500);

    return () => clearInterval(intervalId);
  }, []);

  if (!mounted || !isVisible) return null;

  const toastContent = (
    <div
      className={`fixed top-6 left-1/2 z-[9999] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] pointer-events-none ${
        show
          ? 'opacity-100 translate-y-0 -translate-x-1/2'
          : 'opacity-0 -translate-y-6 -translate-x-1/2'
      }`}
    >
      <div className="relative flex items-center gap-3.5 px-5 py-3.5 w-[360px] bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12),0_2px_6px_-1px_rgba(0,0,0,0.06)] rounded-[22px]">
        {/* Glow ring behind icon */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md animate-pulse" />
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_2px_8px_rgba(16,185,129,0.35)]">
            <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-slate-400 tracking-wide uppercase leading-none mb-1">
            Notification
          </p>
          <p className="text-[15px] font-semibold text-slate-800 leading-tight truncate">
            {message}
          </p>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-5 right-5 h-[3px] rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
            style={{
              width: show ? '0%' : '100%',
              transition: show ? 'width 3s linear' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
}