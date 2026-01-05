import React, { useState, useRef, useEffect } from 'react';

/**
 * HoldButton Component
 * Requires user to hold button for specified duration to trigger action
 * Shows visual progress while holding
 */
const HoldButton = ({ 
  onComplete, 
  duration = 1500, 
  children, 
  label,
  className = '',
  disabled = false 
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimeoutRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const handleMouseDown = () => {
    if (disabled) return;
    
    setIsHolding(true);
    startTimeRef.current = Date.now();
    setProgress(0);

    // Update progress bar
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);
    }, 16);

    // Trigger action when duration is met
    holdTimeoutRef.current = setTimeout(() => {
      setIsHolding(false);
      setProgress(0);
      onComplete();
    }, duration);
  };

  const handleMouseUp = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    setIsHolding(false);
    setProgress(0);
  };

  const handleTouchStart = handleMouseDown;
  const handleTouchEnd = handleMouseUp;

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`hold-button ${isHolding ? 'holding' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      disabled={disabled}
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Progress fill background */}
      <div
        className="hold-button-progress"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${progress}%`,
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
          transition: 'width 0.05s linear',
          zIndex: 1,
        }}
      />
      
      {/* Button content */}
      <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {label || children}
      </span>

      {/* Visual hint text while holding */}
      {isHolding && (
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.75rem',
            color: '#22c55e',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          Hold {Math.ceil(duration / 1000)}s
        </div>
      )}
    </button>
  );
};

// Add animation for the hint text
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }

    .hold-button {
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
    }

    .hold-button:active {
      transform: scale(0.98);
    }

    .hold-button.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}

export default HoldButton;
