import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ExerciseSelect from './ExerciseSelect';
import translations from './translations';
import EXERCISE_LIST from './exerciseList';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';
import { supabase, fetchUserSplits, assignTemplateToSplit } from './supabaseClient';
import appLogoTransparent from './assets/logonewtransparent.png';
import appLogoMetal from './assets/logometal.png';

const CreateWorkout = ({ addWorkout, language = 'en', editingTemplate = null, onEditComplete = null, userId = null, onRefreshTemplates = null }) => {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '', weight: '' }]);
  const [isEditing, setIsEditing] = useState(false);
  const [splits, setSplits] = useState([]);
  const [selectedSplitId, setSelectedSplitId] = useState('');
  const { success } = useToast();
  const { theme } = useTheme();
  const t = translations[language];
  
  // Select logo based on current theme
  const appLogo = theme === 'metal' ? appLogoMetal : appLogoTransparent;

  // Fetch splits
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      try {
        const splitsData = await fetchUserSplits(userId);
        setSplits(splitsData || []);
      } catch (error) {
        console.error('Error fetching splits:', error);
      }
    };
    
    fetchData();
  }, [userId]);

  // Pre-populate form when editing a template
  useEffect(() => {
    if (editingTemplate) {
      setIsEditing(true);
      setWorkoutName(editingTemplate.name);
      // Use empty string for null split_id, otherwise use the ID as string
      const newSplitId = editingTemplate.split_id ? String(editingTemplate.split_id) : '';
      setSelectedSplitId(newSplitId);
      console.log('🔍 Editing template:', {
        templateName: editingTemplate.name,
        templateSplitId: editingTemplate.split_id,
        setTo: newSplitId,
        availableSplits: splits,
        splitIdType: typeof newSplitId
      });
      if (editingTemplate.exercises && editingTemplate.exercises.length > 0) {
        setExercises(editingTemplate.exercises);
      } else {
        setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
      }
    } else {
      setIsEditing(false);
      setWorkoutName('');
      setSelectedSplitId('');
      console.log('🔍 Creating new template, reset form');
      setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
    }
  }, [editingTemplate]);

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '', weight: '' }]);
  };

  const removeExercise = (index) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const updateExercise = (index, field, value) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  const saveWorkout = async () => {
    if (workoutName && exercises.some(e => e.name)) {
      // split_id is UUID string in database, no conversion needed
      const splitIdForDB = selectedSplitId && selectedSplitId !== '' ? selectedSplitId : null;
      
      console.log('💾 Saving workout:', {
        workoutName,
        selectedSplitId,
        splitIdForDB,
        isEditing,
        templateId: editingTemplate?.id,
        splitIdType: typeof splitIdForDB
      });

      if (isEditing && editingTemplate) {
        // Update existing template
        try {
          const { error } = await supabase
            .from('workout_templates')
            .update({
              name: workoutName,
              exercises: exercises.filter(e => e.name),
              split_id: splitIdForDB
            })
            .eq('id', editingTemplate.id);

          if (error) throw error;

          success(language === 'pl' ? 'Plan zaktualizowany!' : 'Template updated!');
          
          // Reset form
          setWorkoutName('');
          setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
          setSelectedSplitId('');
          setIsEditing(false);
          
          // Refresh templates to reflect changes in Home screen
          if (onRefreshTemplates) {
            onRefreshTemplates();
          }
          
          // Call completion callback
          if (onEditComplete) {
            onEditComplete();
          }
        } catch (error) {
          console.error('Error updating template:', error);
          success(language === 'pl' ? 'Błąd przy aktualizacji planu' : 'Error updating template');
        }
      } else {
        // Create new template via supabase
        try {
          const { data, error } = await supabase
            .from('workout_templates')
            .insert({
              user_id: userId,
              name: workoutName,
              exercises: exercises.filter(e => e.name),
              split_id: splitIdForDB
            })
            .select()
            .single();

          if (error) throw error;

          success(t.workoutSaved);
          
          // Reset form
          setWorkoutName('');
          setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
          setSelectedSplitId('');
          
          // Refresh templates to reflect changes in Home screen
          if (onRefreshTemplates) {
            onRefreshTemplates();
          }
          
          // Call the addWorkout callback if provided
          if (addWorkout && data) {
            addWorkout(data);
          }
          
          // Call completion callback
          if (onEditComplete) {
            onEditComplete();
          }
        } catch (error) {
          console.error('Error creating template:', error);
          success(language === 'pl' ? 'Błąd przy tworzeniu planu' : 'Error creating template');
        }
      }
    }
  };

  return (
    <div className="ui-center">
      <div className="create-workout">
        <div className="flex justify-center mb-6">
          <img src={appLogo} alt="Trackd" className="h-10 w-auto object-contain" />
        </div>
        <input
          type="text"
          placeholder={t.workoutName}
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="workout-input"
        />
        
        {/* Split Assignment Dropdown */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            marginBottom: '0.5rem',
            color: 'var(--text-muted)'
          }}>
            {language === 'pl' ? 'Kategoria (opcjonalnie)' : 'Split (optional)'}
            {splits.length > 0 && <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', opacity: 0.6 }}>({splits.length})</span>}
          </label>
          <select
            value={selectedSplitId}
            onChange={(e) => {
              const newValue = e.target.value;
              setSelectedSplitId(newValue);
              console.log('🎯 Split selection changed:', {
                newValue,
                isString: typeof newValue === 'string',
                willSaveAs: newValue && newValue !== '' ? newValue : null,
                availableSplits: splits.length
              });
            }}
            className="workout-input"
            style={{
              padding: '0.625rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="">{language === 'pl' ? 'Brak - Ogólne' : 'None - General'}</option>
            {splits.map(split => (
              <option key={split.id} value={String(split.id)}>
                {split.name}
              </option>
            ))}
          </select>
        </div>

        <div className="exercises">
          {exercises.map((exercise, index) => (
            <div key={index} className="exercise-row">
              <div className="exercise-header">
                <span className="exercise-number">{t.selectExercise} {index + 1}</span>
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="remove-exercise-btn"
                  >
                    <X size={18} strokeWidth={2} />
                  </button>
                )}
              </div>
              <ExerciseSelect
                value={exercise.name}
                onChange={(value) => updateExercise(index, 'name', value)}
                options={EXERCISE_LIST}
                placeholder={t.selectExercise}
              />
              <input
                type="number"
                placeholder={t.sets}
                value={exercise.sets}
                onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                className="exercise-input small"
              />
              <input
                type="number"
                placeholder={t.reps}
                value={exercise.reps}
                onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                className="exercise-input small"
              />
              <input
                type="number"
                placeholder={t.weightLbs}
                value={exercise.weight}
                onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                className="exercise-input small"
              />
            </div>
          ))}
        </div>
        <button onClick={addExercise} className="btn">{t.addExercise}</button>
        <button onClick={saveWorkout} className="btn">
          {isEditing ? (language === 'pl' ? 'Aktualizuj Plan' : 'Update Template') : t.saveWorkout}
        </button>
      </div>
    </div>
  );
};

export default CreateWorkout;