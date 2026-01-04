import { useState, useEffect, useCallback } from 'react';

export const useRestTimer = (initialSeconds = 90) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setIsRunning(true);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsRunning(false);
    } else {
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const start = useCallback(() => {
    setIsActive(true);
  }, []);

  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  const skip = useCallback(() => {
    setTimeLeft(0);
    setIsActive(false);
  }, []);

  const addTime = useCallback((seconds) => {
    setTimeLeft(prev => prev + seconds);
  }, []);

  const reset = useCallback((seconds) => {
    setTimeLeft(seconds);
    setIsActive(false);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft,
    isActive,
    isRunning,
    start,
    pause,
    skip,
    addTime,
    reset,
    formatTime,
  };
};
