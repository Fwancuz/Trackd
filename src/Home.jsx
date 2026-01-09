import React, { useState, useMemo, useEffect, startTransition } from 'react';
import { Medal, Trophy, Zap, Target, History, Clock, Play, Pencil, MoreVertical, Edit2, Trash2, Plus, X as XIcon, Users } from 'lucide-react';
import WorkoutPlayer from './WorkoutPlayer';
import ConfirmModal from './ConfirmModal';
import RecentHistory from './RecentHistory';
import PRStatsWidget from './PRStatsWidget';
import ActivityHeatmap from './ActivityHeatmap';
import ActiveFriendsBanner from './ActiveFriendsBanner';
import FriendsTab from './FriendsTab';
import MoreMenu from './MoreMenu';
import translations from './translations';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';
import { useWorkoutHistory } from './useWorkoutHistory';
import { supabase, fetchUserSplits, createSplit, deleteSplit } from './supabaseClient';
import appLogoTransparent from './assets/logonewtransparent.png';
import appLogoMetal from './assets/logometal.png';

const ACTIVE_SESSION_KEY = 'trackd_active_session';

const Home = ({ completedSessions, personalRecords = [], onWorkoutComplete, language = 'en', recoveredSession = null, userId = null, onRefreshCompletedSessions = null, onEditTemplate = null, onNavigateToCreate = null, templatesRefreshKey = 0 }) => {
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
  const [activeTab, setActiveTab] = useState('plans'); // 'plans', 'history', 'total', 'friends'
  const [lastCompletedVolume, setLastCompletedVolume] = useState(null);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [heatmapRefreshKey, setHeatmapRefreshKey] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [splits, setSplits] = useState([]);
  const [_loadingTemplates, setLoadingTemplates] = useState(false);
  const [showAddSplit, setShowAddSplit] = useState(false);
  const [newSplitName, setNewSplitName] = useState('');
  const [deleteSplitModal, setDeleteSplitModal] = useState({ isOpen: false, splitId: null, splitName: '' });
  const [editSplitModal, setEditSplitModal] = useState({ isOpen: false, splitId: null, currentName: '', newName: '' });
  const { success } = useToast();
  const t = translations[language];
  
  // Initialize workout history hook
  const { deleteSession } = useWorkoutHistory(userId);

  /**
   * Refresh templates and splits from Supabase
   */
  const refreshTemplatesAndSplits = async () => {
    if (!userId) return;
    try {
      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
      } else {
        setTemplates(templatesData || []);
      }

      // Fetch splits
      const splitsData = await fetchUserSplits(userId);
      setSplits(splitsData || []);
    } catch (err) {
      console.error('Error refreshing templates and splits:', err);
    }
  };

  // Fetch templates and splits from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoadingTemplates(true);
      try {
        // Fetch templates
        const { data: templatesData, error: templatesError } = await supabase
          .from('workout_templates')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (templatesError) {
          console.error('Error fetching templates:', templatesError);
        } else {
          setTemplates(templatesData || []);
        }

        // Fetch splits
        const splitsData = await fetchUserSplits(userId);
        setSplits(splitsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchData();
  }, [userId, templatesRefreshKey]);

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
   * Handle joining a friend's workout session
   */
  const handleSessionJoined = (clonedSessionData) => {
    // The session is already stored in localStorage by ActiveFriendsBanner
    // Just update local state to trigger workout player
    setActiveWorkout({
      name: clonedSessionData.workoutName,
      exercises: [],
    });
    success(language === 'pl' ? 'Dołączono do treningu!' : 'Joined workout!');
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

  /**
   * Handle adding a new split
   */
  const handleAddSplit = async () => {
    if (!newSplitName.trim()) return;
    
    try {
      const newSplit = await createSplit(userId, newSplitName.trim());
      if (newSplit) {
        setSplits([...splits, newSplit]);
        setNewSplitName('');
        setShowAddSplit(false);
        success(language === 'pl' ? 'Kategoria utworzona!' : 'Split created!');
      }
    } catch (error) {
      console.error('Error creating split:', error);
      success(language === 'pl' ? 'Błąd przy tworzeniu kategorii' : 'Error creating split');
    }
  };

  /**
   * Handle editing split name
   */
  const handleEditSplit = (splitId, currentName) => {
    setEditSplitModal({
      isOpen: true,
      splitId: splitId,
      currentName: currentName,
      newName: currentName
    });
  };

  /**
   * Confirm update of split name
   */
  const handleConfirmUpdateSplit = async () => {
    const { splitId, newName } = editSplitModal;
    
    if (!newName.trim() || newName === editSplitModal.currentName) {
      setEditSplitModal({ isOpen: false, splitId: null, currentName: '', newName: '' });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('workout_splits')
        .update({ name: newName.trim() })
        .eq('id', splitId);
      
      if (error) throw error;
      
      // Update local state
      setSplits(prev => prev.map(s => 
        s.id === splitId ? { ...s, name: newName.trim() } : s
      ));
      
      success(language === 'pl' ? 'Kategoria zaktualizowana!' : 'Split updated!');
      setEditSplitModal({ isOpen: false, splitId: null, currentName: '', newName: '' });
    } catch (error) {
      console.error('Error updating split:', error);
      success(language === 'pl' ? 'Błąd przy aktualizacji kategorii' : 'Error updating split');
    }
  };

  /**
   * Handle deleting a split
   */
  const handleDeleteSplit = (splitId, splitName) => {
    setDeleteSplitModal({
      isOpen: true,
      splitId: splitId,
      splitName: splitName
    });
  };

  /**
   * Confirm deletion of split
   */
  const handleConfirmDeleteSplit = async () => {
    const splitIdToDelete = deleteSplitModal.splitId;
    
    try {
      // Remove from local state immediately
      setSplits(prev => prev.filter(s => s.id !== splitIdToDelete));
      setDeleteSplitModal({ isOpen: false, splitId: null, splitName: '' });
      
      // Delete from database (which sets template split_ids to NULL)
      const deletionSuccess = await deleteSplit(splitIdToDelete);
      
      if (deletionSuccess) {
        // Refresh templates to reflect the changes
        const { data: templatesData } = await supabase
          .from('workout_templates')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        setTemplates(templatesData || []);
        
        success(language === 'pl' ? 'Kategoria usunięta!' : 'Split deleted!');
      }
    } catch (error) {
      console.error('Error deleting split:', error);
      // Refetch splits if deletion failed
      const splitsData = await fetchUserSplits(userId);
      setSplits(splitsData || []);
    }
  };

  // Calculate total lifetime volume using useMemo
  // Also filters out duplicate sessions by ID to prevent double-counting volume
  const { totalLifetimeVolume, totalSessions } = useMemo(() => {
    let total = 0;
    
    // Remove duplicate sessions by ID (safety check for race conditions)
    const seen = new Set();
    const uniqueSessions = completedSessions.filter(session => {
      if (seen.has(session.id)) {
        console.warn(`Duplicate session ID detected: ${session.id}, filtering out`);
        return false;
      }
      seen.add(session.id);
      return true;
    });
    
    uniqueSessions.forEach(session => {
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
      totalSessions: uniqueSessions.length
    };
  }, [completedSessions]);

  // Rank system with Lucide icons
  const { theme } = useTheme();
  const themeInfo = useTheme()?.themeInfo || {};
  
  // Select logo based on current theme
  const appLogo = theme === 'metal' ? appLogoMetal : appLogoTransparent;

  const RankIcon = ({ tier }) => {
    const iconProps = { size: 20, strokeWidth: 1.5 };
    switch(tier) {
      case 'novice': return <Medal color={themeInfo.novice || '#8b7355'} {...iconProps} />;
      case 'beginner': return <Medal color={themeInfo.beginner || '#cd7f32'} {...iconProps} />;
      case 'amateur': return <Medal color={themeInfo.amateur || '#c0c0c0'} {...iconProps} />;
      case 'intermediate': return <Medal color={themeInfo.intermediate || '#ffd700'} {...iconProps} />;
      case 'skilled': return <Trophy color={themeInfo.skilled || '#e5e7eb'} {...iconProps} />;
      case 'advanced': return <Zap color={themeInfo.advanced || '#7dd3fc'} {...iconProps} />;
      case 'expert': return <Zap color={themeInfo.expert || '#a78bfa'} {...iconProps} />;
      case 'elite': return <Zap color={themeInfo.elite || '#ff1493'} {...iconProps} />;
      case 'master': return <Zap color={themeInfo.master || '#ffd700'} {...iconProps} />;
      case 'yeah_buddy': return <Zap color={themeInfo.yeah_buddy || '#ff0000'} {...iconProps} />;
      default: return null;
    }
  };

  // Determine current rank - Updated rank system based on Total Volume
  const ranks = [
    { name: { en: 'Novice', pl: 'Nowicjusz' }, tier: 'novice', min: 0, max: 1000 },
    { name: { en: 'Beginner', pl: 'Początkujący' }, tier: 'beginner', min: 1000, max: 5000 },
    { name: { en: 'Amateur', pl: 'Amator' }, tier: 'amateur', min: 5000, max: 15000 },
    { name: { en: 'Intermediate', pl: 'Średniozaawansowany' }, tier: 'intermediate', min: 15000, max: 40000 },
    { name: { en: 'Skilled', pl: 'Zaawansowany' }, tier: 'skilled', min: 40000, max: 80000 },
    { name: { en: 'Advanced', pl: 'Zaawansowany+' }, tier: 'advanced', min: 80000, max: 150000 },
    { name: { en: 'Expert', pl: 'Ekspert' }, tier: 'expert', min: 150000, max: 300000 },
    { name: { en: 'Elite', pl: 'Elita' }, tier: 'elite', min: 300000, max: 600000 },
    { name: { en: 'Master', pl: 'Mistrz' }, tier: 'master', min: 600000, max: 1000000 },
    { name: { en: 'YEAH BUDDY!', pl: 'YEAH BUDDY!' }, tier: 'yeah_buddy', min: 1000000, max: Infinity },
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

  /**
   * Group templates by split and organize data
   * Also filters out duplicate templates by ID to prevent UI duplication
   */
  const groupedTemplates = useMemo(() => {
    const groups = {};
    
    // Initialize groups for all splits
    splits.forEach(split => {
      groups[split.id] = {
        split: split,
        templates: []
      };
    });
    
    // Add "Uncategorized" group
    groups['uncategorized'] = {
      split: null,
      templates: []
    };
    
    // Remove duplicate templates by ID (safety check for race conditions)
    const seen = new Set();
    const uniqueTemplates = templates.filter(template => {
      if (seen.has(template.id)) {
        console.warn(`Duplicate template ID detected: ${template.id}, filtering out`);
        return false;
      }
      seen.add(template.id);
      return true;
    });
    
    // Group templates
    uniqueTemplates.forEach(template => {
      if (template.split_id && groups[template.split_id]) {
        groups[template.split_id].templates.push(template);
      } else {
        groups['uncategorized'].templates.push(template);
      }
    });
    
    return groups;
  }, [templates, splits]);



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
          userId={userId}
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
                <span className={`rank-name ${currentRank.tier === 'yeah_buddy' ? 'yeah-buddy-glow' : ''}`}>{currentRank.name[language]}</span>
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
                      <span className={`next-rank-name ${nextRank.tier === 'yeah_buddy' ? 'yeah-buddy-glow' : ''}`}>{nextRank.name[language]} ({rankProgress.toFixed(0)}%)</span>
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
          <button
            className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => {
              // Feature-gate: Show toast instead of navigating
              showToast?.error?.('Social features coming soon!');
            }}
            disabled
            style={{
              opacity: 0.5,
              cursor: 'not-allowed',
              pointerEvents: 'none',
              position: 'relative'
            }}
          >
            <Users size={20} strokeWidth={1.5} />
            <span className="tab-label">{language === 'pl' ? 'Znajomi' : 'Friends'}</span>
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: 'var(--accent)',
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}>
              Soon
            </span>
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
                <div className="flex justify-between items-center mb-6">
                  <h2 className="section-title">{t.yourPlans}</h2>
                  {!showAddSplit && (
                    <button
                      className="btn btn-sm"
                      onClick={() => setShowAddSplit(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Plus size={16} />
                      <span>{language === 'pl' ? 'Kategoria' : 'Split'}</span>
                    </button>
                  )}
                </div>

                {/* Active Friends Banner */}
                <ActiveFriendsBanner
                  onSessionJoined={handleSessionJoined}
                  language={language}
                  userId={userId}
                />

                {/* Add Split Input */}
                {showAddSplit && (
                  <div style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    gap: '0.75rem'
                  }}>
                    <input
                      type="text"
                      placeholder={language === 'pl' ? 'Nazwa kategorii...' : 'Split name...'}
                      value={newSplitName}
                      onChange={(e) => setNewSplitName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSplit()}
                      autoFocus
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        color: 'var(--text)',
                        fontSize: '0.875rem'
                      }}
                    />
                    <button
                      className="btn"
                      onClick={handleAddSplit}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {language === 'pl' ? 'Dodaj' : 'Add'}
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        setShowAddSplit(false);
                        setNewSplitName('');
                      }}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {templates.length === 0 && splits.length === 0 ? (
                  <div className="empty-templates-state">
                    <div className="empty-templates-content">
                      <p className="empty-templates-message">{t.startByCreatingTemplate}</p>
                      <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', marginTop: '1.5rem' }}>
                        <button 
                          className="btn primary create-template-btn"
                          onClick={handleCreateTemplate}
                        >
                          + {t.createNewTemplate}
                        </button>
                        <button
                          className="btn"
                          onClick={() => setShowAddSplit(true)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                          <Plus size={16} />
                          <span>{language === 'pl' ? 'Utwórz Pierwszą Kategorię' : 'Create Your First Split'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <section className="templates-grid-container">
                    {/* Render each split group */}
                    {Object.entries(groupedTemplates).map(([key, group]) => {
                      // Skip empty groups except uncategorized
                      if (group.templates.length === 0 && key !== 'uncategorized') return null;

                      const isUncategorized = key === 'uncategorized';
                      const splitName = isUncategorized 
                        ? (language === 'pl' ? 'Ogólne' : 'General')
                        : group.split?.name;

                      return (
                        <div key={key}>
                          {/* Split Section Header */}
                          <div style={{
                            backgroundColor: 'var(--card)',
                            borderLeft: '4px solid var(--accent)',
                            padding: '1rem',
                            marginBottom: '1rem',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem'
                            }}>
                              <h3 style={{
                                color: 'var(--text)',
                                fontSize: '1rem',
                                fontWeight: '600',
                                margin: 0
                              }}>
                                {splitName}
                              </h3>
                              {!isUncategorized && group.split && (
                                <button
                                  onClick={() => handleEditSplit(group.split.id, group.split.name)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    padding: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    opacity: 0.6,
                                    transition: 'opacity 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                                  onMouseLeave={(e) => e.target.style.opacity = '0.6'}
                                  title={language === 'pl' ? 'Edytuj nazwę' : 'Edit name'}
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                            </div>
                            {!isUncategorized && group.split && (
                              <button
                                onClick={() => handleDeleteSplit(group.split.id, group.split.name)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--text-muted)',
                                  padding: '0.25rem',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                title={language === 'pl' ? 'Usuń kategorię' : 'Delete split'}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>

                          {/* Templates Grid for this split */}
                          {group.templates.length === 0 ? (
                            <div style={{
                              padding: '2rem 1rem',
                              textAlign: 'center',
                              color: 'var(--text-muted)',
                              fontSize: '0.875rem',
                              marginBottom: '2rem'
                            }}>
                              {isUncategorized 
                                ? (language === 'pl' ? 'Brak treningów w tej kategorii' : 'No workouts in this split')
                                : (language === 'pl' ? 'Brak treningów w tym splicie' : 'No workouts in this split yet')
                              }
                            </div>
                          ) : (
                            <div className="templates-grid" style={{ marginBottom: '2rem' }}>
                              {group.templates.map((template) => {
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
                        </div>
                      );
                    })}

                    {/* Create Template Button at the bottom */}
                    {templates.length > 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <button 
                          className="btn primary create-template-btn"
                          onClick={handleCreateTemplate}
                        >
                          + {t.createNewTemplate}
                        </button>
                      </div>
                    )}
                  </section>
                )}
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

            {activeTab === 'friends' && (
              <FriendsTab
                userId={userId}
                language={language}
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
      <ConfirmModal
        isOpen={deleteSplitModal.isOpen}
        title={language === 'pl' ? 'Usuń Kategorię' : 'Delete Split'}
        message={`${language === 'pl' ? 'Czy na pewno chcesz usunąć kategorię' : 'Are you sure you want to delete the split'} "${deleteSplitModal.splitName}"? ${language === 'pl' ? 'Treningi w tej kategorii zostaną przeniesione do sekcji "Ogólne".' : 'Workouts in this split will be moved to "General" section.'}`}
        onConfirm={handleConfirmDeleteSplit}
        onCancel={() => setDeleteSplitModal({ isOpen: false, splitId: null, splitName: '' })}
        confirmText={t.delete}
        cancelText={t.cancel}
        isDangerous={true}
      />

      {/* Edit Split Name Modal */}
      {editSplitModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2 style={{
              color: 'var(--text)',
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              margin: 0,
              marginBottom: '1.5rem'
            }}>
              {language === 'pl' ? 'Edytuj Nazwę Kategorii' : 'Edit Split Name'}
            </h2>
            
            <input
              type="text"
              value={editSplitModal.newName}
              onChange={(e) => setEditSplitModal({
                ...editSplitModal,
                newName: e.target.value
              })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmUpdateSplit();
                }
              }}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--text)',
                fontSize: '1rem',
                marginBottom: '1.5rem',
                boxSizing: 'border-box'
              }}
              placeholder={language === 'pl' ? 'Nazwa kategorii' : 'Split name'}
            />

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setEditSplitModal({ isOpen: false, splitId: null, currentName: '', newName: '' })}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: 'var(--border)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmUpdateSplit}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {language === 'pl' ? 'Aktualizuj' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;