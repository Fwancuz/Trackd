import React, { useState, useEffect } from 'react'
import Aurora from './Aurora';
import { VscHome, VscArchive, VscSettingsGear, VscSymbolMisc } from 'react-icons/vsc';
import Home from './Home';
import CreateWorkout from './CreateWorkout';
import AppSettings from './AppSettings';
import PR from './PR';
import { ToastProvider } from './ToastContext';

const App = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [workouts, setWorkouts] = useState([]);
  const [savedWorkoutTemplates, setSavedWorkoutTemplates] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [language, setLanguage] = useState('en');
  const [settings, setSettings] = useState({ language: 'en' });

  // Load completed sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('completedSessions');
    if (savedSessions) {
      try {
        setCompletedSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error('Failed to load completed sessions:', e);
      }
    }
  }, []);

  // Load personal records from localStorage on mount
  useEffect(() => {
    const savedPRs = localStorage.getItem('personalRecords');
    if (savedPRs) {
      try {
        setPersonalRecords(JSON.parse(savedPRs));
      } catch (e) {
        console.error('Failed to load personal records:', e);
      }
    }
  }, []);

  // Save completed sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('completedSessions', JSON.stringify(completedSessions));
  }, [completedSessions]);

  // Save personal records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('personalRecords', JSON.stringify(personalRecords));
  }, [personalRecords]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const addWorkout = (workout) => {
    setSavedWorkoutTemplates([...savedWorkoutTemplates, workout]);
  };

  const completeWorkoutSession = (workoutId, exerciseData, duration = 0) => {
    const session = {
      id: Date.now(),
      workoutId: workoutId,
      completedAt: new Date().toISOString(),
      exercises: exerciseData,
      duration: duration
    };
    setCompletedSessions([...completedSessions, session]);
  };

  const removeWorkout = (workoutId) => {
    setSavedWorkoutTemplates(savedWorkoutTemplates.filter(w => w.id !== workoutId));
  };

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    if (newSettings.language) {
      setLanguage(newSettings.language);
    }
  };

  const addPersonalRecord = (exercise, weight, reps) => {
    const pr = {
      id: Date.now(),
      exercise: exercise,
      weight: parseFloat(weight) || 0,
      reps: parseFloat(reps) || 0,
      date: new Date().toISOString()
    };
    setPersonalRecords([...personalRecords, pr]);
  };

  const deletePersonalRecord = (prId) => {
    setPersonalRecords(personalRecords.filter(pr => pr.id !== prId));
  };

  const pages = {
    home: <Home savedWorkouts={savedWorkoutTemplates} completedSessions={completedSessions} onWorkoutComplete={completeWorkoutSession} language={language} onRemoveWorkout={removeWorkout} />,
    create: <CreateWorkout addWorkout={addWorkout} language={language} />,
    records: <PR personalRecords={personalRecords} onAddPR={addPersonalRecord} onDeletePR={deletePersonalRecord} language={language} />,
    settings: <AppSettings settings={settings} updateSettings={updateSettings} />,
  };

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
