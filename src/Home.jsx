import React, { useState, useMemo } from 'react';
import WorkoutPlayer from './WorkoutPlayer';
import ConfirmModal from './ConfirmModal';
import translations from './translations';
import { useToast } from './ToastContext';

const Home = ({ savedWorkouts, completedSessions, onWorkoutComplete, language = 'en', onRemoveWorkout }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, workoutId: null, workoutName: '' });
  const [activeTab, setActiveTab] = useState('workouts'); // 'workouts', 'templates', 'total'
  const [lastCompletedVolume, setLastCompletedVolume] = useState(null);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const { success } = useToast();
  const t = translations[language];

  // Calculate total lifetime volume using useMemo
  const { totalLifetimeVolume, totalSessions } = useMemo(() => {
    let total = 0;
    completedSessions.forEach(session => {
      if (session.exercises && Array.isArray(session.exercises)) {
        session.exercises.forEach(exercise => {
          if (exercise.sets && Array.isArray(exercise.sets)) {
            exercise.sets.forEach(set => {
              const weight = parseFloat(set.weight) || 0;
              const reps = parseInt(set.reps) || 0;
              total += weight * reps;
            });
          }
        });
      }
    });
    return {
      totalLifetimeVolume: total,
      totalSessions: completedSessions.length
    };
  }, [completedSessions]);

  // Determine current rank
  const ranks = [
    { name: { en: 'Bronze', pl: 'Brąz' }, emoji: '🥉', min: 0, max: 1000 },
    { name: { en: 'Silver', pl: 'Srebro' }, emoji: '🥈', min: 1000, max: 6000 },
    { name: { en: 'Gold', pl: 'Złoto' }, emoji: '🥇', min: 6000, max: 41000 },
    { name: { en: 'Platinum', pl: 'Platyna' }, emoji: '🏆', min: 41000, max: 100000 },
    { name: { en: 'Diamond', pl: 'Diament' }, emoji: '💎', min: 100000, max: 204000 },
    { name: { en: 'Titan', pl: 'Tytan' }, emoji: '🌌', min: 204000, max: Infinity },
  ];

  const currentRank = useMemo(() => {
    return ranks.find(r => totalLifetimeVolume >= r.min && totalLifetimeVolume < r.max) || ranks[0];
  }, [totalLifetimeVolume]);

  const nextRank = useMemo(() => {
    const nextIdx = ranks.findIndex(r => r.min > totalLifetimeVolume);
    return nextIdx !== -1 ? ranks[nextIdx] : null;
  }, [totalLifetimeVolume]);

  const rankProgress = useMemo(() => {
    if (!nextRank) return 100;
    const current = totalLifetimeVolume - currentRank.min;
    const range = nextRank.min - currentRank.min;
    return Math.min(100, Math.max(0, (current / range) * 100));
  }, [totalLifetimeVolume, currentRank, nextRank]);



  if (activeWorkout) {
    return (
      <WorkoutPlayer
        workout={activeWorkout}
        onComplete={(exerciseData, duration) => {
          // Calculate volume from this session
          const sessionVolume = exerciseData.reduce((sum, exercise) => {
            if (exercise.sets && Array.isArray(exercise.sets)) {
              return sum + exercise.sets.reduce((exSum, set) => {
                return exSum + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0));
              }, 0);
            }
            return sum;
          }, 0);
          setLastCompletedVolume(sessionVolume);
          setShowCompletionMessage(true);
          setTimeout(() => setShowCompletionMessage(false), 4000);
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
        {/* Completion Message - Hidden (Ultra-minimalist) */}
        {/* Message is now displayed directly in Boss Bar instead of Toast */}

        {/* Boss Bar - Progress to Next Rank */}
        <div className="boss-bar-container">
          <div className="boss-bar-content">
            <div className="boss-bar-header">
              <div className="current-rank-display">
                <span className="rank-emoji">{currentRank.emoji}</span>
                <span className="rank-name">{currentRank.name[language]}</span>
              </div>
              {nextRank && (
                <div className={`next-rank-info ${showCompletionMessage ? 'show-success' : ''}`}>
                  {showCompletionMessage && lastCompletedVolume !== null ? (
                    <span className="success-message">
                      {language === 'pl'
                        ? `Brawo! Twoje ${lastCompletedVolume.toFixed(0)} kg zasiliło statystyki!`
                        : `Great job! Your ${lastCompletedVolume.toFixed(0)} kg boosted stats!`}
                    </span>
                  ) : (
                    <>
                      <span className="next-label">{language === 'pl' ? 'Następna Ranga' : 'Next Rank'}:</span>
                      <span className="next-rank-name">{nextRank.name[language]} ({rankProgress.toFixed(0)}%)</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="boss-bar-progress-container">
              <div
                className="boss-bar-progress"
                style={{
                  width: `${rankProgress}%`,
                  transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
            </div>
            <div className="boss-bar-stats">
              <span className="volume-display">
                {(totalLifetimeVolume / 1000).toFixed(1)} <span className="volume-unit">ton</span>
              </span>
            </div>
          </div>
        </div>

        <h1 className="app-title">Trackd</h1>
        
        {/* Tab Navigation */}
        <div className="stats-tabs">
          <button
            className={`tab-button ${activeTab === 'workouts' ? 'active' : ''}`}
            onClick={() => setActiveTab('workouts')}
          >
            <span className="tab-emoji">💪</span>
            <span className="tab-label">{t.yourWorkouts}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <span className="tab-emoji">📋</span>
            <span className="tab-label">{t.workoutTemplates}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'total' ? 'active' : ''}`}
            onClick={() => setActiveTab('total')}
          >
            <span className="tab-emoji">🏋️</span>
            <span className="tab-label">{language === 'pl' ? 'Razem Podniesione' : 'Total Lifted'}</span>
          </button>
        </div>

        {activeTab === 'total' && (
          <div className="total-lifted-section">
            <div className="total-lifted-card">
              <div className="total-lifted-value">
                {(totalLifetimeVolume / 1000).toFixed(2)}
              </div>
              <div className="total-lifted-unit">
                {language === 'pl' ? 'tony' : 'tons'}
              </div>
              <div className="total-lifted-subtitle">
                {totalLifetimeVolume.toFixed(0)} kg
              </div>
            </div>

            <div className="stats-summary">
              <div className="stat-box">
                <div className="stat-value">{totalSessions}</div>
                <div className="stat-label">
                  {language === 'pl' ? 'Sesji' : 'Sessions'}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-value">
                  {totalSessions > 0 ? (totalLifetimeVolume / totalSessions).toFixed(0) : 0}
                </div>
                <div className="stat-label">
                  {language === 'pl' ? 'Średnio kg' : 'Avg kg'}
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'workouts' || activeTab !== 'total') && (
          <div className="workout-selection">
            {savedWorkouts.length === 0 ? (
              <div className="empty-state">
                <h2 className="section-title">{t.noWorkouts}</h2>
                <p>{t.startMessage}</p>
              </div>
            ) : (
              <div>
                {activeTab === 'workouts' && (
                  <>
                    <h2 className="section-title">{t.yourWorkouts}</h2>
                    <div className="saved-workouts">
                      {savedWorkouts.map((workout) => {
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
                  </>
                )}

                {activeTab === 'templates' && (
                  <>
                    <h2 className="section-title">{t.workoutTemplates}</h2>
                    <div className="templates-section">
                      <div className="template-stats">
                        <div className="stat-item">
                          <span className="stat-number">{savedWorkouts.length}</span>
                          <span className="stat-label">{t.workoutTemplates}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-number">{totalCompletedWorkouts}</span>
                          <span className="stat-label">{t.workoutsCompleted}</span>
                        </div>
                      </div>
                      <div className="saved-workouts">
                        {savedWorkouts.map((workout) => {
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
                  </>
                )}
              </div>
            )}
          </div>
        )}
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