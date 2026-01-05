import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ExerciseSelect from './ExerciseSelect';
import translations from './translations';
import EXERCISE_LIST from './exerciseList';
import ConfirmModal from './ConfirmModal';
import { useToast } from './ToastContext';

const PR = ({ personalRecords, onAddPR, onDeletePR, language = 'en' }) => {
  const t = translations[language];
  const [view, setView] = useState('list'); // 'list', 'add', or 'detail'
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [formData, setFormData] = useState({ exercise: '', weight: '', reps: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, prId: null });
  const { success } = useToast();

  // Group PRs by exercise and sort by date
  const prsByExercise = useMemo(() => {
    const grouped = {};
    
    personalRecords.forEach((pr) => {
      if (!grouped[pr.exercise]) {
        grouped[pr.exercise] = [];
      }
      grouped[pr.exercise].push(pr);
    });

    // Sort each exercise's records by date (using created_at as primary field)
    Object.keys(grouped).forEach(exercise => {
      grouped[exercise].sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || 0).getTime();
        const dateB = new Date(b.created_at || b.date || 0).getTime();
        return dateB - dateA;
      });
    });

    return grouped;
  }, [personalRecords]);

  const handleAddPR = (e) => {
    e.preventDefault();
    if (formData.exercise && (formData.weight || formData.reps)) {
      onAddPR(formData.exercise, formData.weight, formData.reps);
      setFormData({ exercise: '', weight: '', reps: '' });
      setView('list');
    }
  };

  const handleDeletePR = (prId) => {
    onDeletePR(prId);
  };

  // If we're in detail view and the selected exercise has no records left, go back to list
  useEffect(() => {
    if (view === 'detail' && selectedExercise) {
      const records = prsByExercise[selectedExercise];
      if (!records || records.length === 0) {
        setView('list');
        setSelectedExercise(null);
      }
    }
  }, [prsByExercise, view, selectedExercise]);

  // List view - show all exercises with PRs
  if (view === 'list') {
    const exercisesWithPRs = Object.keys(prsByExercise);

    if (exercisesWithPRs.length === 0) {
      return (
        <div className="ui-center">
          <div className="progress-content">
            <h1 className="app-title">Trackd</h1>
            <p>{t.noPRsYet}</p>
            <button 
              className="metric-btn large"
              onClick={() => setView('add')}
              style={{
                marginTop: '2rem',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                maxWidth: '90%',
                margin: '2rem auto 0'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              {t.addNewPR}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="ui-center">
        <div className="progress-content" style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <h1 className="app-title">Trackd</h1>
            <div style={{ width: '100%', maxWidth: '300px' }}>
              <ExerciseSelect
                value={selectedExercise || ''}
                onChange={(exercise) => {
                  setSelectedExercise(exercise);
                  setView('detail');
                }}
                options={exercisesWithPRs}
                placeholder={t.selectExercise}
              />
            </div>
          </div>
          
          <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto', marginBottom: '24px' }}>
            <button 
              className="metric-btn"
              onClick={() => setView('add')}
              style={{
                width: '100%',
                padding: '10px 20px',
                fontSize: '0.9rem',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              + {t.addNewPR}
            </button>
          </div>

          <div style={{ marginTop: '24px', color: '#888', textAlign: 'center', fontSize: '0.9rem' }}>
            {exercisesWithPRs.length} {exercisesWithPRs.length === 1 ? t.exercise || 'exercise' : t.exercises || 'exercises'} tracked
          </div>
        </div>
      </div>
    );
  }

  // Add view - form to add new PR
  if (view === 'add') {
    return (
      <div className="ui-center">
        <div className="progress-content">
          <button className="back-btn" onClick={() => setView('list')}>← {t.back}</button>
          <h1 className="app-title">Trackd</h1>
          
          <form onSubmit={handleAddPR} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: '#aaa', fontSize: '0.9rem' }}>{t.selectExercise}</label>
              <select
                value={formData.exercise}
                onChange={(e) => setFormData({ ...formData, exercise: e.target.value })}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  fontSize: '1rem'
                }}
                required
              >
                <option value="">{t.selectExercise}</option>
                {EXERCISE_LIST.map((exercise) => (
                  <option key={exercise} value={exercise}>{exercise}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: '#aaa', fontSize: '0.9rem' }}>{t.weight} (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="Weight"
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #444',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: '#aaa', fontSize: '0.9rem' }}>{t.reps}</label>
                <input
                  type="number"
                  value={formData.reps}
                  onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                  placeholder="Reps"
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #444',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <button 
              type="submit"
              className="metric-btn large"
              style={{
                marginTop: '1rem',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                width: '100%'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              {t.savePR}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Detail view - show all records for an exercise with graph
  if (view === 'detail' && selectedExercise) {
    const records = prsByExercise[selectedExercise];
    
    // Check if records exist and have data
    if (!records?.length) {
      return (
        <div className="ui-center">
          <div className="progress-content">
            <button className="back-btn" onClick={() => setView('list')}>← {t.back}</button>
            <h1 className="app-title">Trackd</h1>
            <p style={{ marginTop: '1rem', color: '#888' }}>
              {t.noPRsYet}
            </p>
            <button 
              className="metric-btn large"
              onClick={() => setView('add')}
              style={{ marginTop: '2rem' }}
            >
              {t.addNewPR}
            </button>
          </div>
        </div>
      );
    }
    
    // Brzycki formula for 1RM estimation: 1RM = weight × (1 + reps / 30)
    const calculateEstimated1RM = (weight, reps) => {
      if (weight === 0) return 0;
      return weight * (1 + reps / 30);
    };

    // Prepare and format data for graph - convert types, sort chronologically
    const graphData = [...records]
      .map(r => {
        const weight = Number(r.weight) || 0;
        const reps = Number(r.reps) || 0;
        const estimated1RM = calculateEstimated1RM(weight, reps);
        return {
          ...r,
          weight,
          reps,
          estimated1RM,
          date: r.created_at || r.date || new Date().toISOString(),
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const maxWeight = Math.max(...graphData.map(r => r.weight), 0);
    const maxReps = Math.max(...graphData.map(r => r.reps), 0);
    const max1RM = Math.max(...graphData.map(r => r.estimated1RM), 0);
    const min1RM = Math.min(...graphData.map(r => r.estimated1RM > 0 ? r.estimated1RM : Infinity), max1RM);
    
    // Find Personal Best - record with highest estimated 1RM
    const personalBest = graphData.reduce((best, current) => {
      return current.estimated1RM > (best?.estimated1RM || 0) ? current : best;
    }, null);
    
    // Helper function for safe date formatting
    const formatDate = (dateStr) => {
      try {
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) : '';
      } catch {
        return '';
      }
    };
    
    const formatFullDate = (dateStr) => {
      try {
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '';
      } catch {
        return '';
      }
    };

    return (
      <>
        <div className="ui-center">
          <div className="progress-content" style={{ padding: '0 16px' }}>
            <div className="graph-header">
            <button className="back-btn" onClick={() => setView('list')}>← {t.back}</button>
            <h1 className="app-title">Trackd</h1>
          </div>

          <div className="exercise-graph-card full-width">
            <div className="pr-stats-header">
              <div className="pr-stat">
                <span className="stat-label">{t.maxWeight || 'Max Weight'}</span>
                <span className="pr-value">{maxWeight}</span>
                <span className="stat-sublabel">kg</span>
              </div>
              <div className="pr-stat">
                <span className="stat-label">{t.maxReps || 'Max Reps'}</span>
                <span className="pr-value">{maxReps}</span>
                <span className="stat-sublabel">{t.reps || 'reps'}</span>
              </div>
            </div>

            {personalBest && (
              <div style={{
                marginTop: '2rem',
                padding: '2rem',
                border: '3px solid #d4af37',
                borderRadius: '0.75rem',
                backgroundColor: 'rgba(212, 175, 55, 0.08)',
                textAlign: 'center',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#d4af37', fontWeight: '600', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                  PERSONAL BEST
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
                  {personalBest.weight} kg × {personalBest.reps}
                </div>
                <div style={{ fontSize: '0.95rem', color: '#aaa', marginBottom: '1rem' }}>
                  Est. 1RM: {personalBest.estimated1RM.toFixed(1)} kg
                </div>
                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                  {formatFullDate(personalBest.date)}
                </div>
              </div>
            )}

            {records?.length > 1 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#888' }}>Strength Progress (Estimated 1RM)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={graphData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke="#888"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#888"
                      domain={[Math.floor(min1RM * 0.9), Math.ceil(max1RM * 1.05)]}
                      tick={{ fontSize: 10 }}
                      label={{ value: 'kg', angle: -90, position: 'insideLeft', offset: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #666', borderRadius: '4px' }}
                      labelStyle={{ color: '#fff' }}
                      labelFormatter={(label) => formatFullDate(label)}
                      formatter={(value, name, props) => {
                        const estimated1RM = props.payload.estimated1RM;
                        const weight = props.payload.weight;
                        const reps = props.payload.reps;
                        return [
                          <div key="tooltip" style={{ color: '#fff' }}>
                            <div>Estimated 1RM: {estimated1RM.toFixed(1)} kg</div>
                            <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.25rem' }}>
                              Based on: {weight} kg x {reps} reps
                            </div>
                          </div>,
                          ''
                        ];
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="estimated1RM"
                      stroke="#3A29FF"
                      strokeWidth={3}
                      dot={{ fill: '#3A29FF', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Estimated 1RM (kg)"
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {records?.length === 1 && (
              <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: '#222', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ color: '#888' }}>
                  {t.addNewPR || 'Add another record to see progress'}
                </p>
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#888' }}>{t.allRecords || 'All Records'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {records?.map((pr) => {
                  const safeWeight = Number(pr?.weight) || 0;
                  const safeReps = Number(pr?.reps) || 0;
                  const dateStr = pr?.created_at || pr?.date || new Date().toISOString();
                  const formattedDate = formatFullDate(dateStr);
                  
                  return (
                    <div
                      key={pr?.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        backgroundColor: '#222',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem'
                      }}
                    >
                      <div>
                        <div>
                          {safeWeight > 0 ? `${safeWeight} kg` : ''} 
                          {safeWeight > 0 && safeReps > 0 ? ' • ' : ''}
                          {safeReps > 0 ? `${safeReps} ${language === 'pl' ? 'pow.' : 'reps'}` : ''}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                          {formattedDate}
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, prId: pr?.id })}
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#d32f2f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '0.35rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        {t.delete || 'Delete'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title={t.deleteRecord || 'Delete Record'}
          message={t.areYouSureDeleteRecord || 'Are you sure you want to delete this personal record? This action cannot be undone.'}
          onConfirm={() => {
            onDeletePR(deleteModal.prId);
            setDeleteModal({ isOpen: false, prId: null });
            success(t.recordDeleted || 'Record deleted successfully');
          }}
          onCancel={() => setDeleteModal({ isOpen: false, prId: null })}
          confirmText={t.delete || 'Delete'}
          cancelText={t.cancel || 'Cancel'}
          isDangerous={true}
        />
      </>
    );
  }

  return null;
};

export default PR;
