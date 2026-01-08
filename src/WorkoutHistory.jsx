import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import translations from './translations';

const WorkoutHistory = ({ completedSessions, language = 'en' }) => {
  const t = translations[language];
  const [view, setView] = useState('sessions'); // 'sessions' or 'progress'
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Build exercise progress data
  const { exercises, progressData } = useMemo(() => {
    const exData = {};
    const exSet = new Set();

    completedSessions.forEach(session => {
      if (session.exercises && Array.isArray(session.exercises)) {
        session.exercises.forEach(ex => {
          const name = ex.exercise || ex.name;
          if (name && typeof name === 'string' && name.trim()) {
            exSet.add(name);
            
            if (!exData[name]) {
              exData[name] = [];
            }
            
            exData[name].push({
              date: new Date(session.completedAt).toLocaleDateString(),
              weight: parseFloat(ex.weight) || 0,
              reps: parseInt(ex.reps) || 0,
              set: ex.set || 1
            });
          }
        });
      }
    });

    return {
      exercises: Array.from(exSet).sort(),
      progressData: exData
    };
  }, [completedSessions]);

  const chartData = selectedExercise ? progressData[selectedExercise] : [];

  const renderSessions = () => (
    <div className="history-sessions">
      <h2>{t.recentSessions}</h2>
      {completedSessions.length === 0 ? (
        <p className="empty-state">{t.noCompleted}</p>
      ) : (
        <div className="sessions-grid">
          {completedSessions.map(session => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <span className="session-date">
                  {new Date(session.completedAt).toLocaleDateString()}
                </span>
                <span className="exercise-count">
                  {session.exercises?.length || 0} {t.exercises || 'exercises'}
                </span>
              </div>
              <ul className="session-exercises">
                {session.exercises?.map((ex, idx) => (
                  <li key={idx} className="exercise-line">
                    <span className="ex-name">{ex.exercise || ex.name}</span>
                    <span className="ex-stats">
                      {ex.reps} reps @ {ex.weight} kg
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProgress = () => (
    <div className="history-progress">
      <h2>{t.progressGraphs}</h2>
      
      {exercises.length === 0 ? (
        <p className="empty-state">{t.noCompleted}</p>
      ) : (
        <>
          <div className="exercise-picker">
            <p className="picker-label">Select Exercise</p>
            <div className="picker-buttons">
              {exercises.map(ex => (
                <button
                  key={ex}
                  onClick={() => setSelectedExercise(selectedExercise === ex ? null : ex)}
                  className={`picker-btn ${selectedExercise === ex ? 'active' : ''}`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {selectedExercise && chartData.length > 0 && (
            <div className="charts-container">
              <h3 className="chart-title">{selectedExercise}</h3>
              
              <div className="chart-wrapper">
                <div className="chart-item">
                  <h4>{t.weightProgress}</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 5, right: 15, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      />
                      <YAxis 
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                        width={30}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--card)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: 'var(--text)' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="var(--accent)"
                        strokeWidth={3}
                        dot={{ fill: 'var(--accent)', r: 5 }}
                        activeDot={{ r: 7 }}
                        name="Weight (kg)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-item">
                  <h4>{t.repsProgress}</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 5, right: 15, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      />
                      <YAxis 
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                        width={30}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--card)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: 'var(--text)' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="reps" 
                        stroke="var(--accent)"
                        strokeWidth={3}
                        dot={{ fill: 'var(--accent)', r: 5 }}
                        activeDot={{ r: 7 }}
                        name="Reps"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="ui-center">
      <div className="history-page">
        <div className="history-header">
          <h1 className="app-title">{t.workoutHistory}</h1>
          <div className="view-tabs">
            <button
              className={`tab-btn ${view === 'sessions' ? 'active' : ''}`}
              onClick={() => setView('sessions')}
            >
              Sessions
            </button>
            <button
              className={`tab-btn ${view === 'progress' ? 'active' : ''}`}
              onClick={() => setView('progress')}
            >
              Progress
            </button>
          </div>
        </div>

        <div className="history-body">
          {view === 'sessions' ? renderSessions() : renderProgress()}
        </div>
      </div>
    </div>
  );
};

export default WorkoutHistory;