import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';

const getNow = () => Date.now();
const MotionDiv = motion.div;
const MotionCircle = motion.circle;

const RestTimerOverlay = ({ 
  timer, 
  isVisible, 
  onSkip, 
  nextExerciseName = '', 
  nextWeight = '', 
  nextReps = '' 
}) => {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const HOLD_DURATION = 800; // milliseconds

  const handleCirclePointerDown = (e) => {
    e.preventDefault();
    holdStartTimeRef.current = getNow();
    
    const updateHoldProgress = () => {
      if (holdStartTimeRef.current) {
        const elapsed = getNow() - holdStartTimeRef.current;
        const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
        setHoldProgress(progress);
        
        if (progress >= 100) {
          handleSkip();
        } else {
          animationFrameRef.current = requestAnimationFrame(updateHoldProgress);
        }
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(updateHoldProgress);
  };

  const handleCirclePointerUp = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    holdStartTimeRef.current = null;
    setHoldProgress(0);
  };

  const handleCircleClick = () => {
    // Toggle pause/resume on tap - only if not holding
    if (holdStartTimeRef.current === null) {
      if (timer.isPaused) {
        timer.resume();
      } else {
        timer.pause();
      }
    }
  };

  const handleSkip = () => {
    setHoldProgress(0);
    onSkip();
  };

  if (!isVisible || !timer.isActive) {
    return null;
  }

  // Calculate circle progress
  const circumference = 2 * Math.PI * 45; // 45 is the radius
  const progress = (timer.timeLeft / 90) * 100; // Assuming 90 seconds is full
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isLowTime = timer.timeLeft <= 10;

  return (
    <MotionDiv
      className="rest-timer-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Backdrop blur */}
      <div className="rest-timer-backdrop" />

      {/* Content container - perfect vertical layout: top, middle (centered), bottom */}
      <div className="rest-timer-content-container">
        
        {/* TOP SECTION: Next exercise info */}
        <MotionDiv 
          className="timer-section timer-section-top"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="next-exercise-info">
            <p className="next-exercise-label">Next Up</p>
            <h3 className="next-exercise-name">{nextExerciseName}</h3>
            <div className="next-exercise-specs">
              <span>{nextReps} reps</span>
              <span>•</span>
              <span>{nextWeight} kg</span>
            </div>
          </div>
        </MotionDiv>

        {/* MIDDLE SECTION: Timer circle - perfectly centered regardless of text changes */}
        <div className="timer-section timer-section-middle">
          <MotionDiv
            className={`timer-circle-wrapper ${timer.isPaused ? 'paused' : ''}`}
            animate={{
              scale: timer.isPaused ? 0.95 : 1,
              opacity: timer.isPaused ? 0.6 : 1,
            }}
            transition={{ duration: 0.3 }}
            onClick={handleCircleClick}
            onPointerDown={handleCirclePointerDown}
            onPointerUp={handleCirclePointerUp}
            onPointerLeave={handleCirclePointerUp}
          >
          {/* SVG Circular Progress */}
          <svg className="timer-circle-svg" viewBox="0 0 100 100" width="280" height="280">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--border)"
              strokeWidth="3"
              className={timer.isPaused ? 'dimmed' : ''}
            />
            {/* Progress circle */}
            <MotionCircle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={timer.isPaused ? 'var(--text-muted)' : (isLowTime ? 'var(--accent)' : 'var(--accent)')}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
              animate={{
                strokeDashoffset: strokeDashoffset,
                stroke: timer.isPaused ? 'var(--text-muted)' : (isLowTime ? 'var(--accent)' : 'var(--accent)'),
              }}
              transition={{ duration: 0.3 }}
            />
            {/* Hold progress circle (glow effect) */}
            {holdProgress > 0 && (
              <MotionCircle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                opacity={Math.max(0.2, holdProgress / 100)}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
              />
            )}
            </svg>

            {/* Paused indicator - only shown when paused */}
            {timer.isPaused && (
              <MotionDiv
                className="paused-label"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                Paused
              </MotionDiv>
            )}

            {/* Timer display in center */}
            <MotionDiv
              className={`timer-display-center ${isLowTime && !timer.isPaused ? 'low-time' : ''} ${timer.isPaused ? 'dimmed' : ''}`}
              animate={isLowTime && !timer.isPaused ? { scale: [1, 1.05, 1] } : {}}
              transition={isLowTime && !timer.isPaused ? { duration: 0.6, repeat: Infinity } : {}}
            >
              <div className="timer-number">{timer.formatTime(timer.timeLeft)}</div>
            </MotionDiv>

            {/* Hold fill indicator - shows as colored ring filling up */}
            {holdProgress > 0 && (
              <MotionDiv
                className="hold-fill"
                style={{
                  background: `conic-gradient(var(--accent) ${holdProgress * 3.6}deg, transparent ${holdProgress * 3.6}deg)`,
                }}
              />
            )}
          </MotionDiv>
        </div>

        {/* BOTTOM SECTION: Gesture hints */}
        <MotionDiv 
          className="timer-section timer-section-bottom"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="gesture-hints">
            <span className="hint-text">Tap to pause • Hold to skip</span>
          </div>
        </MotionDiv>
      </div>
    </MotionDiv>
  );
};

export default RestTimerOverlay;
