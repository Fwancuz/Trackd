import React, { useState, useEffect } from 'react'
import Aurora from './Aurora';
import { VscHome, VscArchive, VscSettingsGear, VscSymbolMisc } from 'react-icons/vsc';
import Home from './Home';
import CreateWorkout from './CreateWorkout';
import AppSettings from './AppSettings';
import PR from './PR';
import Verified from './Verified';
import ResetPassword from './ResetPassword';
import { ToastProvider, useToast } from './ToastContext';
import { useAuth } from './AuthProvider';
import { supabase } from './supabaseClient';

// Session Recovery Storage Key
const STORAGE_KEY = 'trackd_active_session';

const App = () => {
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [isVerified, setIsVerified] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [savedWorkoutTemplates, setSavedWorkoutTemplates] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [language, setLanguage] = useState('en');
  const [settings, setSettings] = useState({ language: 'en' });
  const [loading, setLoading] = useState(true);
  const [recoveredSession, setRecoveredSession] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Check for verified parameter and reset-password route in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    
    if (params.get('verified') === 'true') {
      setIsVerified(true);
    }
    
    if (pathname === '/reset-password') {
      setIsResetPassword(true);
    }
  }, []);

  // Check for recovered session in localStorage on mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEY);
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        setRecoveredSession(sessionData);
        // Auto-navigate to home where WorkoutPlayer will be rendered with recovered data
        setCurrentPage('home');
      }
    } catch (error) {
      console.error('Error recovering session from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Load all user data from Supabase on mount
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // If no user, stop loading immediately and clear all state
      // (important for reset password flow where user is not authenticated)
      setLoading(false);
      // Clear sensitive user data from memory to prevent data leakage between users
      setCompletedSessions([]);
      setPersonalRecords([]);
      setSavedWorkoutTemplates([]);
      setSettings({ language: 'en' });
      setLanguage('en');
    }
  }, [user]);

  // Calculate total volume from sessions data
  // Volume = sum of (weight * reps) across all exercises and sets in all sessions
  const calculateVolume = (sessions) => {
    if (!sessions || sessions.length === 0) return 0;
    
    return sessions.reduce((total, session) => {
      if (!session.exercises || !Array.isArray(session.exercises)) return total;
      
      const sessionVolume = session.exercises.reduce((sessionTotal, exercise) => {
        if (!exercise.sets || !Array.isArray(exercise.sets)) return sessionTotal;
        
        const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
          const weight = parseFloat(set.weight) || parseFloat(set.actualWeight) || 0;
          const reps = parseInt(set.reps) || parseInt(set.actualReps) || 0;
          return setTotal + (weight * reps);
        }, 0);
        
        return sessionTotal + exerciseVolume;
      }, 0);
      
      return total + sessionVolume;
    }, 0);
  };

  // Separate function to fetch sessions (reusable for Stats component)
  const fetchCompletedSessions = async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('completed_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      
      if (sessionsError) throw sessionsError;
      setCompletedSessions(sessionsData || []);
      return sessionsData || [];
    } catch (error) {
      console.error('Error fetching completed sessions:', error);
      return [];
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load saved workout templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('user_id', user.id);
      
      if (templatesError) throw templatesError;
      setSavedWorkoutTemplates(templatesData || []);

      // Load completed sessions
      await fetchCompletedSessions();

      // Load personal records
      const { data: prsData, error: prsError } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (prsError) throw prsError;
      setPersonalRecords(prsData || []);

      // Load user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
      
      if (settingsData) {
        setSettings(settingsData.settings || { language: 'en' });
        setLanguage(settingsData.settings?.language || 'en');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const addWorkout = async (workout) => {
    try {
      const workoutToSave = {
        user_id: user.id,
        name: workout.name,
        exercises: workout.exercises,
      };

      const { data, error } = await supabase
        .from('workout_templates')
        .insert([workoutToSave])
        .select();

      if (error) throw error;
      setSavedWorkoutTemplates(prev => [...prev, data[0]]);
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const completeWorkoutSession = async (workoutId, exerciseData, duration = 0, workoutName = null, totalVolume = 0) => {
    try {
      // Only save columns that exist in the database
      const sessionToSave = {
        user_id: user.id,
        workout_id: workoutId,
        exercises: exerciseData, // Contains {name: '...', data: [...]}
        duration: duration,
        completed_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('completed_sessions')
        .insert([sessionToSave])
        .select();

      if (error) throw error;
      
      // Update local state for immediate UI feedback
      setCompletedSessions([data[0], ...completedSessions]);
      
      // Fetch latest sessions to sync UI
      await fetchCompletedSessions();
      
    } catch (error) {
      console.error('Error saving workout session:', error);
    }
  };

  const removeWorkout = async (workoutId) => {
    try {
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', user.id);

      if (error) throw error;
      setSavedWorkoutTemplates(savedWorkoutTemplates.filter(w => w.id !== workoutId));
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      setSettings(newSettings);
      if (newSettings.language) {
        setLanguage(newSettings.language);
      }

      // Save settings to Supabase
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: newSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const addPersonalRecord = async (exercise, weight, reps) => {
    try {
      const prToSave = {
        user_id: user.id,
        exercise: exercise,
        weight: parseFloat(weight) || 0,
        reps: parseInt(reps) || 0,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('personal_records')
        .insert([prToSave])
        .select();

      if (error) throw error;
      setPersonalRecords([data[0], ...personalRecords]);
    } catch (error) {
      console.error('Error saving personal record:', error);
    }
  };

  const deletePersonalRecord = async (prId) => {
    try {
      const { error } = await supabase
        .from('personal_records')
        .delete()
        .eq('id', prId)
        .eq('user_id', user.id);

      if (error) throw error;
      setPersonalRecords(personalRecords.filter(pr => pr.id !== prId));
    } catch (error) {
      console.error('Error deleting personal record:', error);
    }
  };

  const handleResetStats = async () => {
    try {
      // Delete completed sessions
      const { error: sessionsError } = await supabase
        .from('completed_sessions')
        .delete()
        .eq('user_id', user.id);

      if (sessionsError) throw sessionsError;

      // Delete personal records
      const { error: prsError } = await supabase
        .from('personal_records')
        .delete()
        .eq('user_id', user.id);

      if (prsError) throw prsError;

      // Update local state
      setCompletedSessions([]);
      setPersonalRecords([]);

      // Show success message
      // Note: useToast is only available inside ToastProvider context
      // The toast will be shown by the component that calls this function
    } catch (error) {
      console.error('Error resetting statistics:', error);
      throw error;
    }
  };

  // Force refresh Stats data when entering the Stats tab (Silent Refresh - no loaders shown)
  useEffect(() => {
    if (currentPage === 'stats' && user) {
      // Trigger a silent fetch when user navigates to Stats tab
      // Old data remains visible while new data loads in the background
      fetchCompletedSessions().catch(error => {
        console.error('Error refreshing stats data on tab change:', error);
      });
    }
  }, [currentPage, user]);

  // Note: fetchCompletedSessions is intentionally not included in dependency array
  // to avoid infinite loops. It's a stable function defined in component scope.

  const pages = {
    home: <Home savedWorkouts={savedWorkoutTemplates} completedSessions={completedSessions} onWorkoutComplete={completeWorkoutSession} language={language} onRemoveWorkout={removeWorkout} recoveredSession={recoveredSession} userId={user?.id} onRefreshCompletedSessions={fetchCompletedSessions} onEditTemplate={setEditingTemplate} onNavigateToCreate={() => setCurrentPage('create')} />,
    create: <CreateWorkout addWorkout={addWorkout} language={language} editingTemplate={editingTemplate} onEditComplete={() => setEditingTemplate(null)} />,
    records: <PR personalRecords={personalRecords} onAddPR={addPersonalRecord} onDeletePR={deletePersonalRecord} language={language} />,
    settings: <AppSettings settings={settings} updateSettings={updateSettings} logout={logout} onResetStats={handleResetStats} onFetchSessions={fetchCompletedSessions} language={language} />,
  };

  if (loading) {
    return (
      <div className="app-main flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin mb-4">⚙️</div>
          <p>Loading your workouts...</p>
        </div>
      </div>
    );
  }

  // Show reset password page if on /reset-password route (before checking user)
  if (isResetPassword) {
    return <ResetPassword />;
  }

  // Show verified page if verified parameter is present
  if (isVerified) {
    return <Verified />;
  }

  return (
    <ToastProvider>
      <div className="app-main">
        {isMobile && (
          <div className="aurora-bg">
            <Aurora
              colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
              blend={0.5}
              amplitude={1.0}
              speed={0.5}
            />
          </div>
        )}
        {pages[currentPage]}
        <nav className="bottom-nav">
          <div className="nav-item" onClick={() => setCurrentPage('home')}>
            <span className="nav-icon"><VscHome size={18} /></span>
            <span className="nav-label">Home</span>
          </div>
          <div className="nav-item" onClick={() => setCurrentPage('create')}>
            <span className="nav-icon"><VscArchive size={18} /></span>
            <span className="nav-label">Create</span>
          </div>
          <div className="nav-item" onClick={() => setCurrentPage('records')}>
            <span className="nav-icon"><VscSymbolMisc size={18} /></span>
            <span className="nav-label">Records</span>
          </div>
          <div className="nav-item" onClick={() => setCurrentPage('settings')}>
            <span className="nav-icon"><VscSettingsGear size={18} /></span>
            <span className="nav-label">Settings</span>
          </div>
        </nav>
      </div>
    </ToastProvider>
  )
}

export default App
