import React, { useState, useMemo, useEffect, startTransition } from 'react';
import { Medal, Trophy, Zap, Target, History, Clock, Play, Pencil, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import WorkoutPlayer from './WorkoutPlayer';
import ConfirmModal from './ConfirmModal';
import RecentHistory from './RecentHistory';
import PRStatsWidget from './PRStatsWidget';
import ActivityHeatmap from './ActivityHeatmap';
import MoreMenu from './MoreMenu';
import translations from './translations';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';
import { useWorkoutHistory } from './useWorkoutHistory';
import { supabase } from './supabaseClient';
import appLogo from './assets/logonewtransparent.png';

const ACTIVE_SESSION_KEY = 'trackd_active_session';

const Home = ({ completedSessions, personalRecords = [], onWorkoutComplete, language = 'en', recoveredSession = null, userId = null, onRefreshCompletedSessions = null, onEditTemplate = null, onNavigateToCreate = null }) => {
  const [activeWorkout, setActiveWorkout] = useState(() => {
    try {
      const savedSession = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        if (!sessionData || !sessionData.workoutName) return null;
        return {
          name: sessionData.workoutName,
          exercises: [],
        };
      }
    } catch {
      // Don't delete user's session on transient/local parse issues.
    }
    return null;
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, workoutId: null, workoutName: '' });
  const [activeTab, setActiveTab] = useState('plans'); // 'plans', 'history', 'total'
  const [lastCompletedVolume, setLastCompletedVolume] = useState(null);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [heatmapRefreshKey, setHeatmapRefreshKey] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [_loadingTemplates, setLoadingTemplates] = useState(false);
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

  // Sync with localStorage on wake-up / bfcache restore (mobile-friendly)
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const savedSession = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          if (sessionData && sessionData.workoutName) {
            startTransition(() => {
              setActiveWorkout({ name: sessionData.workoutName, exercises: [] });
            });
          } else {
            startTransition(() => setActiveWorkout(null));
          }
          return;
        }

        startTransition(() => setActiveWorkout(null));
      } catch (error) {
        console.error('Error syncing workout from localStorage:', error);
        // Don't delete user's session on transient/local parse issues.
        startTransition(() => setActiveWorkout(null));
      }
    };

    const scheduleSync = () => {
      // Mobile wake-up/bfcache: give the browser a moment before reading storage
      setTimeout(syncFromStorage, 50);
    };

    const handlePageShow = () => scheduleSync();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleSync();
      }
    };

    const handleStorage = () => syncFromStorage();

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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

  // Rank system with Lucide icons
  const themeInfo = useTheme()?.themeInfo || {};

  const RankIcon = ({ tier }) => {
    const iconProps = { size: 20, strokeWidth: 1.5 };
    switch(tier) {
      case 'bronze': return <Medal color={themeInfo.bronze || '#cd7f32'} {...iconProps} />;
      case 'silver': return <Medal color={themeInfo.silver || '#c0c0c0'} {...iconProps} />;
      case 'gold': return <Medal color={themeInfo.gold || '#ffd700'} {...iconProps} />;
      case 'platinum': return <Trophy color={themeInfo.platinum || '#e5e7eb'} {...iconProps} />;
      case 'diamond': return <Zap color={themeInfo.diamond || '#7dd3fc'} {...iconProps} />;
      case 'titan': return <Zap color={themeInfo.titan || '#a78bfa'} {...iconProps} />;
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
      <div key="player">
        <WorkoutPlayer
          workout={activeWorkout}
          onComplete={(exerciseData, duration, workoutName, totalVolume) => {
            const workoutId = activeWorkout?.id;
            // Use the passed volume instead of calculating it
            const sessionVolume = totalVolume || 0;
            setLastCompletedVolume(sessionVolume);
            setShowCompletionMessage(true);
            setTimeout(() => setShowCompletionMessage(false), 4000);
            // Hard clear first (prevents "ghost" workout on refresh)
            try {
              localStorage.removeItem(ACTIVE_SESSION_KEY);
              window.dispatchEvent(new Event('storage'));
            } catch (error) {
              console.error('Error clearing localStorage:', error);
            }

            setActiveWorkout(null);

            if (typeof onWorkoutComplete === 'function') {
              onWorkoutComplete(workoutId, exerciseData, duration, workoutName, totalVolume);
            }
            // Refresh plans section after completing workout
            if (onRefreshCompletedSessions) {
              onRefreshCompletedSessions();
            }
          }}
          onCancel={() => {
            // Hard clear first (prevents "ghost" workout on refresh)
            try {
              localStorage.removeItem(ACTIVE_SESSION_KEY);
              window.dispatchEvent(new Event('storage'));
            } catch (error) {
              console.error('Error clearing localStorage:', error);
            }
            setActiveWorkout(null);
            if (onRefreshCompletedSessions) {
              onRefreshCompletedSessions();
            }
          }}
          language={language}
          recoveredSession={recoveredSession}
        />
      </div>
    );
  }

  return (
    <div key="list" className="ui-center">
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
            <span className="tab-label">{language === 'pl' ? 'Statystyki' : 'Stats'}</span>
          </button>
        </div>

        {activeTab === 'total' && (
          <div className="total-lifted-section" style={{ paddingBottom: '2rem' }}>
            {/* Monthly Activity Heatmap */}
            <ActivityHeatmap 
              userId={userId} 
              language={language}
              refreshTrigger={heatmapRefreshKey}
            />

            {/* PR Selector Widget */}
            <PRStatsWidget personalRecords={personalRecords} language={language} />

            {/* Volume Statistics */}
            <div style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
              border: '1px solid',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ 
                color: 'var(--text)', 
                marginBottom: '1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Volume Statistics
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                {/* Widget 1: Total Volume (Large Card) */}
                <div style={{
                  gridColumn: 'span 2',
                  backgroundColor: 'rgba(var(--accent), 0.05)',
                  borderColor: 'var(--accent)',
                  border: '1px solid',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {language === 'pl' ? 'Całkowita Objętość' : 'Total Volume'}
                  </div>
                  <div style={{ 
                    color: 'var(--accent)', 
                    fontSize: '2.5rem', 
                    fontWeight: '800',
                    marginBottom: '0.25rem'
                  }}>
                    {(totalLifetimeVolume / 1000).toFixed(2)}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {language === 'pl' ? 'tony' : 'tons'} ({totalLifetimeVolume.toFixed(0)} kg)
                  </div>
                </div>

                {/* Widget 2: Sessions Count */}
                <div style={{
                  backgroundColor: 'rgba(var(--accent), 0.05)',
                  borderColor: 'var(--accent)',
                  border: '1px solid',
                  borderRadius: '0.5rem',
                  padding: '1.25rem',
                  textAlign: 'center'
                }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {language === 'pl' ? 'Sesji' : 'Sessions'}
                  </div>
                  <div style={{ 
                    color: 'var(--accent)', 
                    fontSize: '2rem', 
                    fontWeight: '800'
                  }}>
                    {totalSessions}
                  </div>
                </div>

                {/* Widget 3: Average per Session */}
                <div style={{
                  backgroundColor: 'rgba(var(--accent), 0.05)',
                  borderColor: 'var(--accent)',
                  border: '1px solid',
                  borderRadius: '0.5rem',
                  padding: '1.25rem',
                  textAlign: 'center'
                }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {language === 'pl' ? 'Średnia' : 'Avg/Session'}
                  </div>
                  <div style={{ 
                    color: 'var(--accent)', 
                    fontSize: '2rem', 
                    fontWeight: '800'
                  }}>
                    {totalSessions > 0 ? (totalLifetimeVolume / totalSessions).toFixed(0) : 0}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem' }}>kg</div>
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
                                onClick={() => {
                                  const workoutToStart = {
                                    id: template.id,
                                    name: template.name,
                                    exercises: template.exercises || [],
                                  };
                                  try {
                                    const exerciseSets = (workoutToStart.exercises || []).map((ex) => {
                                      const targetSets = parseInt(ex.sets) || 1;
                                      return {
                                        name: ex.name,
                                        targetSets,
                                        targetReps: ex.reps,
                                        targetWeight: ex.weight,
                                        sets: Array.from({ length: targetSets }, (_, i) => ({
                                          id: i,
                                          completed: false,
                                          reps: '',
                                          weight: '',
                                        })),
                                      };
                                    });

                                    localStorage.setItem(
                                      ACTIVE_SESSION_KEY,
                                      JSON.stringify({
                                        workoutName: workoutToStart.name,
                                        exerciseSets,
                                        currentExerciseIndex: 0,
                                        currentSetIndex: 0,
                                        workoutStartTime: Date.now(),
                                      })
                                    );
                                  } catch (error) {
                                    console.error('Error saving trackd_active_session:', error);
                                  }
                                  setActiveWorkout(workoutToStart);
                                }}
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
                  setHeatmapRefreshKey(prev => prev + 1);
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