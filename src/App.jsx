import React, { useState, useEffect } from 'react'
import Aurora from './Aurora';
import { VscHome, VscArchive, VscSettingsGear, VscSymbolMisc } from 'react-icons/vsc';
import Home from './Home';
import CreateWorkout from './CreateWorkout';
import AppSettings from './AppSettings';
import PR from './PR';
import { ToastProvider } from './ToastContext';
import { useAuth } from './AuthProvider';
import { supabase } from './supabaseClient';

const App = () => {
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [workouts, setWorkouts] = useState([]);
  const [savedWorkoutTemplates, setSavedWorkoutTemplates] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [language, setLanguage] = useState('en');
  const [settings, setSettings] = useState({ language: 'en' });
  const [loading, setLoading] = useState(true);

  // Load all user data from Supabase on mount
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

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
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('completed_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      
      if (sessionsError) throw sessionsError;
      setCompletedSessions(sessionsData || []);

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

  const completeWorkoutSession = async (workoutId, exerciseData, duration = 0) => {
    try {
      const sessionToSave = {
        user_id: user.id,
        workout_id: workoutId,
        exercises: exerciseData,
        duration: duration,
      };

      const { data, error } = await supabase
        .from('completed_sessions')
        .insert([sessionToSave])
        .select();

      if (error) throw error;
      setCompletedSessions([data[0], ...completedSessions]);
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

  const pages = {
    home: <Home savedWorkouts={savedWorkoutTemplates} completedSessions={completedSessions} onWorkoutComplete={completeWorkoutSession} language={language} onRemoveWorkout={removeWorkout} />,
    create: <CreateWorkout addWorkout={addWorkout} language={language} />,
    records: <PR personalRecords={personalRecords} onAddPR={addPersonalRecord} onDeletePR={deletePersonalRecord} language={language} />,
    settings: <AppSettings settings={settings} updateSettings={updateSettings} logout={logout} />,
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
