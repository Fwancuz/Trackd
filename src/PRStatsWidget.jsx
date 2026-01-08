import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ExerciseSelect from './ExerciseSelect';
import translations from './translations';
import EXERCISE_LIST from './exerciseList';

const PRStatsWidget = ({ personalRecords, language = 'en' }) => {
  const t = translations[language];
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Group PRs by exercise
  const prsByExercise = useMemo(() => {
    const grouped = {};
    
    personalRecords.forEach((pr) => {
      if (!grouped[pr.exercise]) {
        grouped[pr.exercise] = [];
      }
      grouped[pr.exercise].push(pr);
    });

    // Sort each exercise's records by date
    Object.keys(grouped).forEach(exercise => {
      grouped[exercise].sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || 0).getTime();
        const dateB = new Date(b.created_at || b.date || 0).getTime();
        return dateB - dateA;
      });
    });

    return grouped;
  }, [personalRecords]);

  const exercisesWithPRs = Object.keys(prsByExercise);

  // Calculate 1RM using Brzycki formula
  const calculateEstimated1RM = (weight, reps) => {
    if (weight === 0) return 0;
    return weight * (1 + reps / 30);
  };

  // Get PR data for selected exercise
  let selectedPRData = null;
  let chartData = [];

  if (selectedExercise && prsByExercise[selectedExercise]) {
    const records = prsByExercise[selectedExercise];
    
    // Get the latest record (top of array since sorted descending)
    const latestRecord = records[0];
    const estimated1RM = calculateEstimated1RM(
      Number(latestRecord.weight) || 0,
      Number(latestRecord.reps) || 0
    );

    selectedPRData = {
      exercise: selectedExercise,
      weight: Number(latestRecord.weight) || 0,
      reps: Number(latestRecord.reps) || 0,
      estimated1RM: estimated1RM,
      date: latestRecord.created_at || latestRecord.date || new Date().toISOString()
    };

    // Prepare chart data (last 5 records)
    chartData = records
      .slice(0, 5)
      .reverse()
      .map(r => ({
        date: new Date(r.created_at || r.date || '').toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        estimated1RM: calculateEstimated1RM(Number(r.weight) || 0, Number(r.reps) || 0)
      }));
  }

  return (
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
        marginBottom: '1rem',
        fontSize: '1rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Personal Records
      </h3>

      {exercisesWithPRs.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem 0',
          color: 'var(--text-muted)'
        }}>
          <p>{t.noPRsYet || 'No personal records yet'}</p>
        </div>
      ) : (
        <>
          {/* Exercise Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              color: 'var(--text-muted)', 
              fontSize: '0.85rem',
              marginBottom: '0.5rem',
              display: 'block'
            }}>
              {t.selectExercise || 'Select Exercise'}
            </label>
            <ExerciseSelect
              value={selectedExercise || ''}
              onChange={setSelectedExercise}
              options={exercisesWithPRs}
              placeholder={t.selectExercise || 'Choose an exercise...'}
            />
          </div>

          {/* PR Stats Display */}
          {selectedPRData && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  backgroundColor: 'rgba(var(--accent), 0.05)',
                  borderColor: 'var(--accent)',
                  border: '1px solid',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.75rem',
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Weight
                  </div>
                  <div style={{ 
                    color: 'var(--accent)', 
                    fontSize: '1.5rem',
                    fontWeight: '700'
                  }}>
                    {selectedPRData.weight}
                  </div>
                  <div style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.75rem'
                  }}>
                    kg
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(var(--accent), 0.05)',
                  borderColor: 'var(--accent)',
                  border: '1px solid',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.75rem',
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Reps
                  </div>
                  <div style={{ 
                    color: 'var(--accent)', 
                    fontSize: '1.5rem',
                    fontWeight: '700'
                  }}>
                    {selectedPRData.reps}
                  </div>
                  <div style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.75rem'
                  }}>
                    reps
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(var(--accent), 0.05)',
                  borderColor: 'var(--accent)',
                  border: '1px solid',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.75rem',
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Est. 1RM
                  </div>
                  <div style={{ 
                    color: 'var(--accent)', 
                    fontSize: '1.5rem',
                    fontWeight: '700'
                  }}>
                    {selectedPRData.estimated1RM.toFixed(1)}
                  </div>
                  <div style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.75rem'
                  }}>
                    kg
                  </div>
                </div>
              </div>

              {/* PR Trend Chart */}
              {chartData.length > 1 && (
                <div style={{
                  backgroundColor: 'rgba(var(--accent), 0.02)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ 
                    color: 'var(--text)', 
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                  }}>
                    Est. 1RM Trend
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis 
                        dataKey="date"
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      />
                      <YAxis 
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--card)', 
                          border: '1px solid var(--border)',
                          borderRadius: '4px'
                        }}
                        labelStyle={{ color: 'var(--text)' }}
                        formatter={(value) => [value.toFixed(1) + ' kg', 'Est. 1RM']}
                      />
                      <Bar 
                        dataKey="estimated1RM" 
                        fill="var(--accent)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                padding: '0.75rem',
                backgroundColor: 'rgba(var(--accent), 0.02)',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                {prsByExercise[selectedExercise]?.length || 0} records for {selectedExercise}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PRStatsWidget;
