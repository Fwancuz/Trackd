import { useState, useEffect, useRef } from 'react';

/**
 * Hook for animating a number from a start value to an end value
 * Supports both counting up and counting down animations
 * @param {number} endValue - The target value to animate to
 * @param {number} duration - Duration of animation in milliseconds (default: 800ms)
 * @param {boolean} shouldAnimate - Whether animation should play (default: true)
 * @returns {number} The current animated value
 */
export const useCountUpAnimation = (endValue, duration = 800, shouldAnimate = true) => {
  const [displayValue, setDisplayValue] = useState(endValue);
  const previousValueRef = useRef(endValue);
  const animationTimeoutRef = useRef(null);
  const animationIntervalRef = useRef(null);

  useEffect(() => {
    // If values are the same, no animation needed
    if (previousValueRef.current === endValue || !shouldAnimate) {
      setDisplayValue(endValue);
      previousValueRef.current = endValue;
      return;
    }

    const startValue = previousValueRef.current;
    const difference = endValue - startValue;
    const startTime = Date.now();

    // Clear any existing animations
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);

    // Animate the value
    animationIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation (easeOut cubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + difference * easeProgress;
      setDisplayValue(Math.round(currentValue));

      if (progress === 1) {
        clearInterval(animationIntervalRef.current);
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
      }
    }, 16); // ~60fps

    return () => {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, [endValue, duration, shouldAnimate]);

  return displayValue;
};
