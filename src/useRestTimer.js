import { useState, useEffect, useCallback } from 'react';

export const useRestTimer = (initialSeconds = 90) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isRunning = isActive && !isPaused && timeLeft > 0;

  useEffect(() => {
    let interval = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeLeft]);

  const start = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const skip = useCallback(() => {
    setTimeLeft(0);
    setIsActive(false);
    setIsPaused(false);
  }, []);

  const addTime = useCallback((seconds) => {
    setTimeLeft(prev => prev + seconds);
  }, []);

  const reset = useCallback((seconds) => {
    setTimeLeft(seconds);
    setIsActive(false);
    setIsPaused(false);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft,
    isActive,
    isPaused,
    isRunning,
    start,
    pause,
    resume,
    skip,
    addTime,
    reset,
    formatTime,
  };
};
