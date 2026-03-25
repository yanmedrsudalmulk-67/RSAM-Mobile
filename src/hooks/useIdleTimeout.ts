import { useState, useEffect, useCallback } from 'react';

export function useIdleTimeout(onTimeout: () => void, timeoutMinutes = 30) {
  const [isIdle, setIsIdle] = useState(false);

  const handleTimeout = useCallback(() => {
    setIsIdle(true);
    onTimeout();
  }, [onTimeout]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (isIdle) setIsIdle(false);
      timeoutId = setTimeout(handleTimeout, timeoutMinutes * 60 * 1000);
    };

    const events = [
      'load',
      'mousemove',
      'mousedown',
      'click',
      'scroll',
      'keypress'
    ];

    resetTimeout();

    events.forEach(event => {
      window.addEventListener(event, resetTimeout);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [handleTimeout, timeoutMinutes, isIdle]);

  return isIdle;
}
