import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ExerciseSelect from './ExerciseSelect';
import translations from './translations';
import EXERCISE_LIST from './exerciseList';
import { useToast } from './ToastContext';
import { supabase } from './supabaseClient';
import appLogo from './assets/logonewtransparent.png';

const CreateWorkout = ({ addWorkout, language = 'en', editingTemplate = null, onEditComplete = null }) => {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '', weight: '' }]);
  const [isEditing, setIsEditing] = useState(false);
  const { success } = useToast();
  const t = translations[language];

  // Pre-populate form when editing a template
  useEffect(() => {
    if (editingTemplate) {
      setIsEditing(true);
      setWorkoutName(editingTemplate.name);
      if (editingTemplate.exercises && editingTemplate.exercises.length > 0) {
        setExercises(editingTemplate.exercises);
      } else {
        setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
      }
    } else {
      setIsEditing(false);
      setWorkoutName('');
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
      if (isEditing && editingTemplate) {
        // Update existing template
        try {
          const { error } = await supabase
            .from('workout_templates')
            .update({
              name: workoutName,
              exercises: exercises.filter(e => e.name)
            })
            .eq('id', editingTemplate.id);

          if (error) throw error;

          success(language === 'pl' ? 'Plan zaktualizowany!' : 'Template updated!');
          
          // Reset form
          setWorkoutName('');
          setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
          setIsEditing(false);
          
          // Call completion callback
          if (onEditComplete) {
            onEditComplete();
          }
        } catch (error) {
          console.error('Error updating template:', error);
        }
      } else {
        // Create new template
        const workout = {
          id: Date.now(),
          name: workoutName,
          date: new Date().toISOString(),
          exercises: exercises.filter(e => e.name)
        };
        addWorkout(workout);
        setWorkoutName('');
        setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
        
        // Show toast notification
        success(t.workoutSaved);
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