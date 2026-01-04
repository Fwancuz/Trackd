import React, { useState } from 'react';
import ExerciseSelect from './ExerciseSelect';
import translations from './translations';
import EXERCISE_LIST from './exerciseList';
import { useToast } from './ToastContext';

const CreateWorkout = ({ addWorkout, language = 'en' }) => {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '', weight: '' }]);
  const { success } = useToast();
  const t = translations[language];

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

  const saveWorkout = () => {
    if (workoutName && exercises.some(e => e.name)) {
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
  };

  return (
    <div className="ui-center">
      <div className="create-workout">
        <h1 className="app-title">{t.createWorkout}</h1>
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
                <span className="exercise-number">Exercise {index + 1}</span>
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="remove-exercise-btn"
                  >
                    ✕
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
        <button onClick={saveWorkout} className="btn">{t.saveWorkout}</button>
      </div>
    </div>
  );
};

export default CreateWorkout;