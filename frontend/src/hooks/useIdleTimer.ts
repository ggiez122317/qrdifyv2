import { useEffect, useRef, useCallback } from 'react';

export function useIdleTimer(timeoutMs = 900000, onIdle: () => void) {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(() => {
      onIdle();
    }, timeoutMs);
  }, [timeoutMs, onIdle]);

  useEffect(() => {
    // Set initial timer
    resetTimer();

    const handleUserActivity = () => {
      resetTimer();
    };

    // Events that signify user activity
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keypress', handleUserActivity);
    window.addEventListener('DOMMouseScroll', handleUserActivity);
    window.addEventListener('mousewheel', handleUserActivity);
    window.addEventListener('touchmove', handleUserActivity);
    window.addEventListener('MSPointerMove', handleUserActivity);

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keypress', handleUserActivity);
      window.removeEventListener('DOMMouseScroll', handleUserActivity);
      window.removeEventListener('mousewheel', handleUserActivity);
      window.removeEventListener('touchmove', handleUserActivity);
      window.removeEventListener('MSPointerMove', handleUserActivity);
    };
  }, [resetTimer]);
}
