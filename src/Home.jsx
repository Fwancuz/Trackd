import React, { useState } from 'react';
import WorkoutPlayer from './WorkoutPlayer';
import ConfirmModal from './ConfirmModal';
import translations from './translations';
import { useToast } from './ToastContext';

const Home = ({ savedWorkouts, completedSessions, onWorkoutComplete, language = 'en', onRemoveWorkout }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, workoutId: null, workoutName: '' });
  const { success } = useToast();
  const t = translations[language];

  if (activeWorkout) {
    return (
      <WorkoutPlayer
        workout={activeWorkout}
        onComplete={(exerciseData, duration) => {
          onWorkoutComplete(activeWorkout.id, exerciseData, duration);
          setActiveWorkout(null);
        }}
        onCancel={() => setActiveWorkout(null)}
        language={language}
      />
    );
  }

  // Calculate total completed workouts
  const totalCompletedWorkouts = completedSessions.length;

  return (
    <div className="ui-center">
      <div className="home-content">
        <h1 className="app-title">Trackd</h1>
        
        {totalCompletedWorkouts > 0 && (
          <div className="home-stats-banner">
            <div className="stat-item">
              <span className="stat-number">{totalCompletedWorkouts}</span>
              <span className="stat-label">{t.workoutsCompleted}</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{savedWorkouts.length}</span>
              <span className="stat-label">{t.workoutTemplates}</span>
            </div>
          </div>
        )}
        
        <div className="workout-selection">
          {savedWorkouts.length === 0 ? (
            <div className="empty-state">
              <h2 className="section-title">{t.noWorkouts}</h2>
              <p>{t.startMessage}</p>
            </div>
          ) : (
            <div>
              <h2 className="section-title">{t.yourWorkouts}</h2>
              <div className="saved-workouts">
                {savedWorkouts.map((workout) => {
                  // Count how many times this workout was completed
                  const completionCount = completedSessions.filter(s => s.workoutId === workout.id).length;
                  
                  return (
                    <div key={workout.id} className="workout-card">
                      <div className="workout-card-header">
                        <div className="workout-card-title">
                          <h3>{workout.name}</h3>
                          {completionCount > 0 && (
                            <span className="completion-badge">{completionCount} {language === 'pl' ? 'razy' : 'times'}</span>
                          )}
                        </div>
                        <div className="workout-card-actions">
                          <span className="exercise-count">{workout.exercises.length} {t.exercises}</span>
                          {onRemoveWorkout && (
                            <button
                              className="remove-workout-btn"
                              onClick={() => setDeleteModal({ 
                                isOpen: true, 
                                workoutId: workout.id, 
                                workoutName: workout.name 
                              })}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="workout-card-exercises">
                        {workout.exercises.map((ex, i) => (
                          <div key={i} className="exercise-brief">
                            <span className="exercise-name">{ex.name}</span>
                            <span className="exercise-specs">{ex.sets}x{ex.reps} @ {ex.weight}kg</span>
                          </div>
                        ))}
                      </div>
                      <button
                        className="btn primary full-width"
                        onClick={() => setActiveWorkout(workout)}
                      >
                        {t.startWorkout}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={t.deleteWorkout}
        message={`${t.areYouSure} "${deleteModal.workoutName}"? ${t.thisActionCannotBeUndone}`}
        onConfirm={() => {
          onRemoveWorkout(deleteModal.workoutId);
          setDeleteModal({ isOpen: false, workoutId: null, workoutName: '' });
          success(t.workoutDeleted);
        }}
        onCancel={() => setDeleteModal({ isOpen: false, workoutId: null, workoutName: '' })}
        confirmText={t.delete}
        cancelText={t.cancel}
        isDangerous={true}
      />
    </div>
  );
};

export default Home;