import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import translations from './translations';
import EXERCISE_LIST from './exerciseList';
import appLogo from './assets/logonewtransparent.png';

const Progress = ({ completedSessions, language = 'en' }) => {
  const t = translations[language];
  const [selectedMetric, setSelectedMetric] = useState(null); // null, 'weight', or 'reps'
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Aggregate exercise data from completed sessions
  const exerciseData = useMemo(() => {
    const exerciseMap = {};

    completedSessions.forEach((session, sessionIndex) => {
      session.exercises.forEach((ex) => {
        if (!exerciseMap[ex.exercise]) {
          exerciseMap[ex.exercise] = [];
        }
        
        exerciseMap[ex.exercise].push({
          sessionIndex: sessionIndex,
          date: new Date(session.completedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
          fullDate: session.completedAt,
          weight: parseFloat(ex.weight) || 0,
          reps: parseFloat(ex.reps) || 0,
        });
      });
    });

    // Sort by date for each exercise
    Object.keys(exerciseMap).forEach(exercise => {
      exerciseMap[exercise].sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    });

    return exerciseMap;
  }, [completedSessions]);

  if (completedSessions.length === 0) {
    return (
      <div className="ui-center">
        <div className="progress-content">
          <div className="flex justify-center mb-6">
            <img src={appLogo} alt="Trackd" className="h-8 w-auto object-contain" />
          </div>
          <p>{t.noCompleted}</p>
        </div>
      </div>
    );
  }

  // Step 1: Show metric selector
  if (selectedMetric === null) {
    return (
      <div className="ui-center">
        <div className="progress-content">
          <div className="flex justify-center mb-6">
            <img src={appLogo} alt="Trackd" className="h-8 w-auto object-contain" />
          </div>
          <p className="progress-subtitle">{t.selectMetric || 'Choose what to track'}</p>
          
          <div className="metric-selector" style={{ marginTop: '3rem' }}>
            <button
              className="metric-btn large"
              onClick={() => setSelectedMetric('weight')}
            >
              {t.weightProgress}
            </button>
            <button
              className="metric-btn large"
              onClick={() => setSelectedMetric('reps')}
            >
              {t.repsProgress}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Show exercise selector with all available exercises
  if (selectedExercise === null) {
    return (
      <div className="ui-center">
        <div className="progress-content">
          <button className="back-btn" onClick={() => setSelectedMetric(null)}>← Back</button>
          <div className="flex justify-center mb-6">
            <img src={appLogo} alt="Trackd" className="h-8 w-auto object-contain" />
          </div>
          <p className="progress-subtitle">{t.selectExercise || 'Choose an exercise'}</p>
          
          <div className="exercise-selector">
            {EXERCISE_LIST.map((exercise) => {
              const exerciseName = typeof exercise === 'string' ? exercise : exercise.name;
              const exerciseId = typeof exercise === 'string' ? exercise : exercise.id;
              return (
                <button
                  key={exerciseId}
                  className={`exercise-select-btn ${exerciseData[exerciseName] ? 'completed' : 'not-completed'}`}
                  onClick={() => setSelectedExercise(exerciseName)}
                >
                  {exerciseName}
                  {exerciseData[exerciseName] && (
                    <span className="exercise-count-badge">{exerciseData[exerciseName].length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Show graph for selected exercise
  const data = exerciseData[selectedExercise];

  if (!data || data.length === 0) {
    return (
      <div className="ui-center">
        <div className="progress-content">
          <div className="graph-header">
            <button className="back-btn" onClick={() => setSelectedExercise(null)}>← Back</button>
            <h1 className="app-title">{selectedExercise}</h1>
          </div>

          <div className="exercise-graph-card full-width no-data">
            <p>{t.neverDone || 'You have never completed this exercise.'}</p>
            <button className="back-btn" onClick={() => setSelectedExercise(null)}>← Choose Another Exercise</button>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => selectedMetric === 'weight' ? d.weight : d.reps));
  const minValue = Math.min(...data.map(d => selectedMetric === 'weight' ? d.weight : d.reps));
  const avgValue = (data.reduce((sum, d) => sum + (selectedMetric === 'weight' ? d.weight : d.reps), 0) / data.length).toFixed(1);

  return (
    <div className="ui-center">
      <div className="progress-content">
        <div className="graph-header">
          <button className="back-btn" onClick={() => setSelectedExercise(null)}>← Back</button>
          <div className="flex justify-center mb-6">
            <img src={appLogo} alt="Trackd" className="h-8 w-auto object-contain" />
          </div>
        </div>

        <div className="exercise-graph-card full-width">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--text-muted)"
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              />
              <YAxis 
                stroke="var(--text-muted)"
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                label={{ value: selectedMetric === 'weight' ? 'kg' : 'Reps', angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--text-muted)' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', border: `1px solid var(--border)`, borderRadius: '4px' }}
                labelStyle={{ color: 'var(--text)' }}
                formatter={(value) => [value, selectedMetric === 'weight' ? 'Weight (kg)' : 'Reps']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke="var(--accent)"
                dot={{ fill: 'var(--accent)', r: 5 }}
                activeDot={{ r: 7 }}
                name={selectedMetric === 'weight' ? 'Weight (kg)' : 'Reps'}
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="exercise-stats">
            <div className="stat">
              <span className="stat-label">Current:</span>
              <span className="stat-value">{data[data.length - 1][selectedMetric]}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Max:</span>
              <span className="stat-value">{maxValue}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Min:</span>
              <span className="stat-value">{minValue}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Avg:</span>
              <span className="stat-value">{avgValue}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Sessions:</span>
              <span className="stat-value">{data.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
