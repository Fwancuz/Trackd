import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

    // Sort each exercise's records by date
    Object.keys(grouped).forEach(exercise => {
      grouped[exercise].sort((a, b) => new Date(b.date) - new Date(a.date));
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
            <h1 className="app-title">{t.personalRecords}</h1>
            <p>{t.noPRsYet || 'No personal records yet.'}</p>
            <button 
              className="metric-btn large"
              onClick={() => setView('add')}
              style={{ marginTop: '2rem' }}
            >
              {t.addNewPR || 'Add Personal Record'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="ui-center">
        <div className="progress-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 className="app-title">{t.personalRecords}</h1>
            <button 
              className="metric-btn"
              onClick={() => setView('add')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              + {t.addNewPR || 'Add'}
            </button>
          </div>
          
          <div className="exercise-selector">
            {exercisesWithPRs.map((exercise) => {
              const latestPR = prsByExercise[exercise][0];
              return (
                <button
                  key={exercise}
                  className="exercise-select-btn completed"
                  onClick={() => {
                    setSelectedExercise(exercise);
                    setView('detail');
                  }}
                  style={{ textAlign: 'left', position: 'relative' }}
                >
                  <div style={{ flex: 1 }}>
                    <div>{exercise}</div>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                      {latestPR.weight > 0 ? `${latestPR.weight} lbs` : ''} 
                      {latestPR.weight > 0 && latestPR.reps > 0 ? ' • ' : ''}
                      {latestPR.reps > 0 ? `${latestPR.reps} reps` : ''}
                    </div>
                  </div>
                </button>
              );
            })}
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
          <button className="back-btn" onClick={() => setView('list')}>← Back</button>
          <h1 className="app-title">{t.addNewPR || 'Add Personal Record'}</h1>
          
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
                <label style={{ color: '#aaa', fontSize: '0.9rem' }}>{t.weightLbs}</label>
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
              style={{ marginTop: '1rem' }}
            >
              {t.savePR || 'Save Record'}
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
            <button className="back-btn" onClick={() => setView('list')}>← Back</button>
            <h1 className="app-title">{t.noRecordsFound || 'No records found'}</h1>
            <p style={{ marginTop: '1rem', color: '#888' }}>
              {t.noRecordsYet || 'No personal records yet.'}
            </p>
            <button 
              className="metric-btn large"
              onClick={() => setView('add')}
              style={{ marginTop: '2rem' }}
            >
              {t.addNewPR || 'Add Personal Record'}
            </button>
          </div>
        </div>
      );
    }
    
    // Create data for graph - sorted by date
    const graphData = [...records].reverse();
    
    const maxWeight = Math.max(...records?.map(r => r?.weight), 0);
    const maxReps = Math.max(...records?.map(r => r?.reps), 0);

    return (
      <>
        <div className="ui-center">
          <div className="progress-content">
            <div className="graph-header">
            <button className="back-btn" onClick={() => setView('list')}>← Back</button>
            <h1 className="app-title">{selectedExercise}</h1>
          </div>

          <div className="exercise-graph-card full-width">
            <div className="pr-stats-header">
              <div className="pr-stat">
                <span className="stat-label">{t.maxWeight || 'Max Weight'}</span>
                <span className="pr-value">{maxWeight}</span>
                <span className="stat-sublabel">lbs</span>
              </div>
              <div className="pr-stat">
                <span className="stat-label">{t.maxReps || 'Max Reps'}</span>
                <span className="pr-value">{maxReps}</span>
                <span className="stat-sublabel">{t.reps || 'reps'}</span>
              </div>
            </div>

            {records?.length > 1 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#888' }}>{t.weightHistory || 'Weight History'}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={graphData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
                      stroke="#888"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#888"
                      domain={['dataMin - 1', 'dataMax + 1']}
                      tick={{ fontSize: 10 }}
                      label={{ value: 'lbs', angle: -90, position: 'insideLeft', offset: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #666', borderRadius: '4px' }}
                      labelStyle={{ color: '#fff' }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      formatter={(value) => [value, 'Weight (lbs)']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#3b82f6"
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Weight (lbs)"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {records?.length > 1 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#888' }}>{t.repsHistory || 'Reps History'}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={graphData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
                      stroke="#888"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#888"
                      domain={['dataMin - 1', 'dataMax + 1']}
                      tick={{ fontSize: 10 }}
                      label={{ value: t.reps || 'Reps', angle: -90, position: 'insideLeft', offset: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #666', borderRadius: '4px' }}
                      labelStyle={{ color: '#fff' }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      formatter={(value) => [value, 'Reps']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="reps"
                      stroke="#10b981"
                      dot={{ fill: '#10b981', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Reps"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#888' }}>{t.allRecords || 'All Records'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {records?.map((pr) => (
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
                        {pr?.weight > 0 ? `${pr?.weight} lbs` : ''} 
                        {pr?.weight > 0 && pr?.reps > 0 ? ' • ' : ''}
                        {pr?.reps > 0 ? `${pr?.reps} reps` : ''}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>
                        {new Date(pr?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
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
                ))}
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
