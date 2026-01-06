import React, { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import './index.css';

const RecentHistory = ({ completedSessions, onDeleteSession, language = 'en', onRefreshStats }) => {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, sessionId: null, sessionName: '' });
  const [touchStart, setTouchStart] = useState(null);
  const [activeSwipeId, setActiveSwipeId] = useState(null);
  const touchRef = useRef(null);

  /**
   * Calculate total volume from exercises JSON
   * Exercises now have structure: {name: '...', data: [{exercise: '...', sets: [...]}]}
   */
  const calculateVolumeFromExercises = (exercises) => {
    // Handle new structure where exercises = {name: '...', data: [...]}
    let exercisesData = exercises;
    if (exercises && exercises.data && Array.isArray(exercises.data)) {
      exercisesData = exercises.data;
    } else if (!Array.isArray(exercises)) {
      return 0;
    }
    
    let totalVolume = 0;
    exercisesData.forEach(exercise => {
      if (exercise.sets && Array.isArray(exercise.sets)) {
        exercise.sets.forEach(set => {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps) || 0;
          totalVolume += weight * reps;
        });
      }
    });
    return totalVolume;
  };

  /**
   * Get workout name from exercises JSON metadata
   */
  const getWorkoutNameFromExercises = (exercises) => {
    if (exercises && exercises.name) {
      return exercises.name;
    }
    return language === 'pl' ? 'Trening bez nazwy' : 'Unnamed Workout';
  };

  // Debug logging - temporary for troubleshooting
  useEffect(() => {
    if (completedSessions && completedSessions.length > 0) {
      console.log('History Data:', completedSessions);
      console.log('First session structure:', completedSessions[0]);
    }
  }, [completedSessions]);

  /**
   * Format date to readable format with robust parsing
   */
  const formatDate = (dateString) => {
    if (!dateString) {
      return language === 'pl' ? 'Brak daty' : 'No date';
    }
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return language === 'pl' ? 'Brak daty' : 'No date';
      }
      return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Date parsing error:', error);
      return language === 'pl' ? 'Brak daty' : 'No date';
    }
  };

  /**
   * Handle swipe start on touch devices
   */
  const handleTouchStart = (e, sessionId) => {
    setTouchStart(e.touches[0].clientX);
    setActiveSwipeId(sessionId);
  };

  /**
   * Handle swipe end on touch devices for delete functionality
   */
  const handleTouchEnd = (e, sessionId) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    // Swipe left to delete (diff > 50 means swiped left)
    if (diff > 50) {
      const session = completedSessions.find(s => s.id === sessionId);
      if (session) {
        setDeleteModal({
          isOpen: true,
          sessionId: sessionId,
          sessionName: session.templateName
        });
      }
    }
    
    setTouchStart(null);
    setActiveSwipeId(null);
  };

  /**
   * Handle delete button click
   */
  const handleDeleteClick = (sessionId, templateName) => {
    setDeleteModal({
      isOpen: true,
      sessionId: sessionId,
      sessionName: templateName
    });
  };

  /**
   * Confirm deletion
   */
  const handleConfirmDelete = async () => {
    const success = await onDeleteSession(deleteModal.sessionId);
    
    if (success) {
      setDeleteModal({ isOpen: false, sessionId: null, sessionName: '' });
      // Trigger stats refresh to animate countdown
      if (onRefreshStats) {
        onRefreshStats();
      }
    }
  };

  // Render empty state
  if (!completedSessions || completedSessions.length === 0) {
    return (
      <div className="recent-history">
        <h2 className="history-title">
          {language === 'pl' ? 'Ostatnie Sesje' : 'Recent Sessions'}
        </h2>
        <div className="history-empty-state">
          <p>
            {language === 'pl'
              ? 'Brak ukończonych sesji'
              : 'No completed sessions yet'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="recent-history">
        <h2 className="history-title">
          {language === 'pl' ? 'Ostatnie Sesje' : 'Recent Sessions'}
        </h2>
        
        <div className="history-list">
          {Array.isArray(completedSessions) && completedSessions.map((session) => {
            // Calculate volume from exercises JSON (new structure: {name: '...', data: [...]})
            const calculatedVolume = calculateVolumeFromExercises(session.exercises);
            const displayVolume = calculatedVolume > 0 ? calculatedVolume : 0;
            
            // Get the workout name from exercises JSON metadata
            const templateName = getWorkoutNameFromExercises(session.exercises);
            
            // Use completed_at for the date (correct timestamp)
            const dateField = session.completed_at;
            
            // Duration handling
            const duration = session.duration || 0;
            
            return (
              <div
                key={session.id}
                className={`history-item ${activeSwipeId === session.id ? 'swiping' : ''}`}
                onTouchStart={(e) => handleTouchStart(e, session.id)}
                onTouchEnd={(e) => handleTouchEnd(e, session.id)}
                ref={touchRef}
              >
                <div className="history-item-content">
                  <div className="history-item-header">
                    <h3 className="history-template-name">{templateName}</h3>
                    <button
                      className="history-delete-btn"
                      onClick={() => handleDeleteClick(session.id, templateName)}
                      aria-label={language === 'pl' ? 'Usuń trening' : 'Delete workout'}
                      title={language === 'pl' ? 'Usuń trening' : 'Delete workout'}
                    >
                      <Trash2 size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                  
                  <div className="history-item-details">
                    <span className="history-date">
                      {formatDate(dateField)}
                    </span>
                    <span className="history-volume">
                      {displayVolume.toLocaleString(language === 'pl' ? 'pl-PL' : 'en-US', {maximumFractionDigits: 0})} <span className="volume-unit">kg</span>
                    </span>
                  </div>

                  {duration > 0 && (
                    <div className="history-duration">
                      {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
                    </div>
                  )}
                </div>

                {/* Swipe hint on mobile */}
                <div className="history-swipe-hint">
                  {language === 'pl' ? 'Przesunąć w lewo aby usunąć' : 'Swipe left to delete'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="history-footer">
          <p className="history-help-text">
            {language === 'pl'
              ? 'Naciśnij ikonę kosza lub przesuń w lewo aby usunąć'
              : 'Tap trash icon or swipe left to delete'}
          </p>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={language === 'pl' ? 'Usuń trening?' : 'Delete Workout?'}
        message={language === 'pl'
          ? `${deleteModal.sessionName} - Usuń ten trening? Statystyki zostaną zaktualizowane.`
          : `${deleteModal.sessionName} - Delete this workout? Stats will be updated.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, sessionId: null, sessionName: '' })}
        confirmText={language === 'pl' ? 'Usuń' : 'Delete'}
        cancelText={language === 'pl' ? 'Anuluj' : 'Cancel'}
        isDangerous={true}
      />
    </>
  );
};

export default RecentHistory;
