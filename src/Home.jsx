import React, { useState, useMemo, useEffect } from 'react';
import { Medal, Trophy, Zap, Target, History, Clock, Play, Pencil, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import WorkoutPlayer from './WorkoutPlayer';
import ConfirmModal from './ConfirmModal';
import RecentHistory from './RecentHistory';
import MoreMenu from './MoreMenu';
import translations from './translations';
import { useToast } from './ToastContext';
import { useWorkoutHistory } from './useWorkoutHistory';
import { supabase } from './supabaseClient';
import appLogo from './assets/logonewtransparent.png';

const Home = ({ savedWorkouts, completedSessions, onWorkoutComplete, language = 'en', onRemoveWorkout, recoveredSession = null, userId = null, onRefreshCompletedSessions = null, onEditTemplate = null, onNavigateToCreate = null }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, workoutId: null, workoutName: '' });
  const [activeTab, setActiveTab] = useState('plans'); // 'plans', 'history', 'total'
  const [lastCompletedVolume, setLastCompletedVolume] = useState(null);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const { success } = useToast();
  const t = translations[language];
  
  // Initialize workout history hook
  const { deleteSession } = useWorkoutHistory(userId);

  // Fetch templates from Supabase
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!userId) return;
      setLoadingTemplates(true);
      try {
        const { data, error } = await supabase
          .from('workout_templates')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching templates:', error);
        } else {
          setTemplates(data || []);
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [userId]);

  // Initialize with recovered session if it exists
  useEffect(() => {
    if (recoveredSession) {
      // Set a dummy workout object for recovered session
      setActiveWorkout({
        name: recoveredSession.workoutName,
        exercises: [], // Exercises are already in recovered state
      });
    }
  }, [recoveredSession]);

  // Sync with localStorage when app comes back to focus (handles phone wake-up)
  useEffect(() => {
    const STORAGE_KEY = 'trackd_active_session';
    
    const handleFocusOrVisibility = () => {
      try {
        const savedSession = localStorage.getItem(STORAGE_KEY);
        
        if (savedSession) {
          // Active session exists in localStorage - restore it
          const sessionData = JSON.parse(savedSession);
          setActiveWorkout({
            name: sessionData.workoutName,
            exercises: [], // Exercises are already in recovered state
          });
          console.log('Synced active workout from localStorage on focus');
        } else {
          // No active session - ensure activeWorkout is null
          // This prevents "ghost" workouts from persisting
          if (activeWorkout) {
            setActiveWorkout(null);
            console.log('Cleared ghost workout - no session in localStorage');
          }
        }
      } catch (error) {
        console.error('Error syncing workout from localStorage:', error);
        // If parsing fails, clear the corrupted data
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (removeError) {
          console.error('Error removing corrupted session:', removeError);
        }
      }
    };

    // Listen for visibility changes (primary event for mobile wake-up)
    document.addEventListener('visibilitychange', handleFocusOrVisibility);
    // Listen for focus event as fallback for desktop browsers
    window.addEventListener('focus', handleFocusOrVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
      window.removeEventListener('focus', handleFocusOrVisibility);
    };
  }, [activeWorkout]);

  /**
   * Handle create new template - navigate to create view
   */
  const handleCreateTemplate = () => {
    if (onEditTemplate) {
      onEditTemplate(null); // Pass null to indicate new template
    }
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
  };

  /**
   * Handle edit template - set editing state and navigate to create view
   */
  const handleEditTemplate = (template) => {
    if (onEditTemplate) {
      onEditTemplate(template);
    }
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
  };

  /**
   * Handle delete template - show confirmation modal
   */
  const handleDeleteTemplate = (templateId, templateName) => {
    setDeleteModal({
      isOpen: true,
      workoutId: templateId,
      workoutName: templateName
    });
  };

  /**
   * Confirm deletion of template from database
   */
  const handleConfirmDeleteTemplate = async () => {
    const templateIdToDelete = deleteModal.workoutId;
    
    try {
      // Remove from local state IMMEDIATELY for instant UI feedback
      setTemplates(prev => prev.filter(t => t.id !== templateIdToDelete));
      setDeleteModal({ isOpen: false, workoutId: null, workoutName: '' });
      
      // Then delete from database
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', templateIdToDelete)
        .eq('user_id', userId);

      if (error) throw error;
      
      // Show success message
      success(language === 'pl' ? 'Plan usunięty!' : 'Template deleted!');
    } catch (error) {
      console.error('Error deleting template:', error);
      // Restore template to state if deletion failed
      success(language === 'pl' ? 'Błąd przy usuwaniu planu' : 'Error deleting template');
    }
  };

  /**
   * Get menu items for template card
   */
  const getTemplateMenuItems = (template) => [
    {
      label: language === 'pl' ? 'Edytuj' : 'Edit',
      icon: Edit2,
      variant: 'default',
      onClick: () => handleEditTemplate(template)
    },
    {
      label: language === 'pl' ? 'Usuń' : 'Delete',
      icon: Trash2,
      variant: 'danger',
      onClick: () => handleDeleteTemplate(template.id, template.name)
    }
  ];

  // Calculate total lifetime volume using useMemo
  const { totalLifetimeVolume, totalSessions } = useMemo(() => {
    let total = 0;
    completedSessions.forEach(session => {
      if (session.exercises) {
        // Handle new structure where exercises = {name: '...', data: [...]}
        let exercisesData = session.exercises;
        if (session.exercises.data && Array.isArray(session.exercises.data)) {
          exercisesData = session.exercises.data;
        } else if (!Array.isArray(session.exercises)) {
          return; // Skip if exercises is not in expected format
        }
        
        // If it's an array, process it directly
        if (Array.isArray(exercisesData)) {
          exercisesData.forEach(exercise => {
            if (exercise.sets && Array.isArray(exercise.sets)) {
              exercise.sets.forEach(set => {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseInt(set.reps) || 0;
                total += weight * reps;
              });
            }
          });
        }
      }
    });
    return {
      totalLifetimeVolume: total,
      totalSessions: completedSessions.length
    };
  }, [completedSessions]);

  // Calculate chart data from completed sessions for progress visualization
  const chartData = useMemo(() => {
    // For now, chart data is not used - keeping calculation for future
    return [];
  }, [completedSessions]);

  // Rank system with Lucide icons
  const RankIcon = ({ tier }) => {
    const iconProps = { size: 20, strokeWidth: 1.5 };
    switch(tier) {
      case 'bronze': return <Medal color="#cd7f32" {...iconProps} />;
      case 'silver': return <Medal color="#c0c0c0" {...iconProps} />;
      case 'gold': return <Medal color="#ffd700" {...iconProps} />;
      case 'platinum': return <Trophy color="#e5e7eb" {...iconProps} />;
      case 'diamond': return <Zap color="#7dd3fc" {...iconProps} />;
      case 'titan': return <Zap color="#a78bfa" {...iconProps} />;
      default: return null;
    }
  };

  // Determine current rank
  const ranks = [
    { name: { en: 'Bronze', pl: 'Brąz' }, tier: 'bronze', min: 0, max: 1000 },
    { name: { en: 'Silver', pl: 'Srebro' }, tier: 'silver', min: 1000, max: 6000 },
    { name: { en: 'Gold', pl: 'Złoto' }, tier: 'gold', min: 6000, max: 41000 },
    { name: { en: 'Platinum', pl: 'Platyna' }, tier: 'platinum', min: 41000, max: 100000 },
    { name: { en: 'Diamond', pl: 'Diament' }, tier: 'diamond', min: 100000, max: 204000 },
    { name: { en: 'Titan', pl: 'Tytan' }, tier: 'titan', min: 204000, max: Infinity },
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
        onComplete={(exerciseData, duration, workoutName, totalVolume) => {
          // Use the passed volume instead of calculating it
          const sessionVolume = totalVolume || 0;
          setLastCompletedVolume(sessionVolume);
          setShowCompletionMessage(true);
          setTimeout(() => setShowCompletionMessage(false), 4000);
          onWorkoutComplete(activeWorkout.id, exerciseData, duration, workoutName, totalVolume);
          setActiveWorkout(null);
          // Refresh plans section after completing workout
          if (onRefreshCompletedSessions) {
            onRefreshCompletedSessions();
          }
        }}
        onCancel={() => {
          setActiveWorkout(null);
          // Ensure localStorage is cleared and refresh stats when canceling
          try {
            localStorage.removeItem('trackd_active_session');
          } catch (error) {
            console.error('Error clearing localStorage:', error);
          }
          if (onRefreshCompletedSessions) {
            onRefreshCompletedSessions();
          }
        }}
        language={language}
        recoveredSession={recoveredSession}
      />
    );
  }

  // Calculate total completed workouts
  const totalCompletedWorkouts = completedSessions.length;

  return (
    <div className="ui-center">
      <div className="home-content">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={appLogo} alt="Trackd" className="h-8 w-auto object-contain" />
        </div>

        {/* Completion Message - Hidden (Ultra-minimalist) */}
        {/* Message is now displayed directly in Boss Bar instead of Toast */}

        {/* Boss Bar - Progress to Next Rank */}
        <div className="boss-bar-container">
          <div className="boss-bar-content">
            <div className="boss-bar-header">
              <div className="current-rank-display">
                <RankIcon tier={currentRank.tier} />
                <span className="rank-name">{currentRank.name[language]}</span>
              </div>
              {nextRank && (
                <div className={`next-rank-info ${showCompletionMessage ? 'show-success' : ''}`}>
                  {showCompletionMessage && lastCompletedVolume !== null ? (
                    <div className="success-message-container">
                      <span className="success-message">
                        {language === 'pl'
                          ? `Brawo! Twoje ${lastCompletedVolume.toFixed(0)} kg właśnie zasiliło statystyki!`
                          : `Great job! Your ${lastCompletedVolume.toFixed(0)} kg boosted stats!`}
                      </span>
                    </div>
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
        
        {/* Tab Navigation */}
        <div className="stats-tabs">
          <button
            className={`tab-button ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            <Target size={20} strokeWidth={1.5} />
            <span className="tab-label">{t.yourPlans}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={20} strokeWidth={1.5} />
            <span className="tab-label">{language === 'pl' ? 'Historia' : 'History'}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'total' ? 'active' : ''}`}
            onClick={() => setActiveTab('total')}
          >
            <Zap size={20} strokeWidth={1.5} />
            <span className="tab-label">{language === 'pl' ? 'Razem Podniesione' : 'Total Lifted'}</span>
          </button>
        </div>

        {activeTab === 'total' && (
          <div className="total-lifted-section">
            <div className="total-lifted-card" key={statsRefreshKey}>
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

        {(activeTab === 'plans' || activeTab !== 'total') && (
          <div className="workout-selection">
            {activeTab === 'plans' && (
              <div className="plans-content">
                <h2 className="section-title">{t.yourPlans}</h2>
                <section className="templates-grid-container">
                  {templates.length === 0 ? (
                    <div className="empty-templates-state">
                      <div className="empty-templates-content">
                        <p className="empty-templates-message">{t.startByCreatingTemplate}</p>
                        <button 
                          className="btn primary create-template-btn"
                          onClick={handleCreateTemplate}
                        >
                          + {t.createNewTemplate}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="templates-grid">
                      {templates.map((template) => {
                        const exerciseCount = template.exercises ? template.exercises.length : 0;
                        return (
                          <div key={`template-${template.id}`} className="template-card">
                            <div className="template-card-header">
                              <h3 className="template-name">{template.name}</h3>
                              <div className="template-menu" onClick={(e) => e.stopPropagation()}>
                                <MoreMenu items={getTemplateMenuItems(template)} />
                              </div>
                            </div>
                            <div className="template-exercises-count">
                              <span className="exercises-count-badge">
                                {exerciseCount} {language === 'pl' ? 'ćwiczenia' : 'exercises'}
                              </span>
                            </div>
                            <div className="template-actions">
                              <button 
                                className="btn template-start-btn"
                                onClick={() => setActiveWorkout({
                                  id: template.id,
                                  name: template.name,
                                  exercises: template.exercises || []
                                })}
                              >
                                <Play size={14} strokeWidth={2} />
                                <span>{language === 'pl' ? 'Start' : 'Start'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'history' && (
              <RecentHistory
                completedSessions={completedSessions}
                onDeleteSession={deleteSession}
                language={language}
                onRefreshStats={() => {
                  setStatsRefreshKey(prev => prev + 1);
                  if (onRefreshCompletedSessions) {
                    onRefreshCompletedSessions();
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={t.deleteWorkout}
        message={`${t.areYouSure} "${deleteModal.workoutName}"? ${t.thisActionCannotBeUndone}`}
        onConfirm={handleConfirmDeleteTemplate}
        onCancel={() => setDeleteModal({ isOpen: false, workoutId: null, workoutName: '' })}
        confirmText={t.delete}
        cancelText={t.cancel}
        isDangerous={true}
      />
    </div>
  );
};

export default Home;