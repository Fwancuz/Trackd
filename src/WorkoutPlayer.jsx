import React, { useState, useEffect } from 'react';
import translations from './translations';
import ConfirmModal from './ConfirmModal';
import { useToast } from './ToastContext';
import { useRestTimer } from './useRestTimer';

const WorkoutPlayer = ({ workout, onComplete, onCancel, language = 'en' }) => {
  const [exerciseSets, setExerciseSets] = useState(
    workout.exercises.map((ex) => ({
      name: ex.name,
      targetSets: parseInt(ex.sets) || 1,
      targetReps: ex.reps,
      targetWeight: ex.weight,
      sets: Array.from({ length: parseInt(ex.sets) || 1 }, (_, i) => ({
        id: i,
        completed: false,
        reps: '',
        weight: '',
      })),
    }))
  );

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [workoutStartTime] = useState(Date.now());
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [restTimerActive, setRestTimerActive] = useState(false);

  const timer = useRestTimer(90);
  const { success } = useToast();
  const t = translations[language];

  // Workout duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkoutDuration(Math.floor((Date.now() - workoutStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutStartTime]);

  const currentExercise = exerciseSets[currentExerciseIndex];
  const currentSet = currentExercise?.sets[currentSetIndex];

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetComplete = () => {
    const updatedExercises = [...exerciseSets];
    updatedExercises[currentExerciseIndex].sets[currentSetIndex].completed = true;

    if (currentSetIndex < currentExercise.sets.length - 1) {
      // More sets in this exercise
      setExerciseSets(updatedExercises);
      setCurrentSetIndex(currentSetIndex + 1);
      timer.reset(90);
      setRestTimerActive(true);
      timer.start();
    } else if (currentExerciseIndex < exerciseSets.length - 1) {
      // More exercises
      setExerciseSets(updatedExercises);
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      timer.reset(90);
      setRestTimerActive(true);
      timer.start();
    } else {
      // Workout complete
      setExerciseSets(updatedExercises);
      finishWorkout();
    }
  };

  const finishWorkout = () => {
    const formattedData = exerciseSets.map((ex) => ({
      exercise: ex.name,
      sets: ex.sets
        .filter((s) => s.completed)
        .map((s) => ({
          reps: s.reps || ex.targetReps,
          weight: s.weight || ex.targetWeight,
        })),
    }));
    onComplete(formattedData, workoutDuration);
    success(t.workoutCompleted || 'Workout completed!');
  };

  const handleAddSet = () => {
    const updatedExercises = [...exerciseSets];
    const newSetId = Math.max(...currentExercise.sets.map((s) => s.id), -1) + 1;
    updatedExercises[currentExerciseIndex].sets.push({
      id: newSetId,
      completed: false,
      reps: '',
      weight: '',
    });
    updatedExercises[currentExerciseIndex].targetSets += 1;
    setExerciseSets(updatedExercises);
  };

  const handleRemoveSet = (setIndex) => {
    if (currentExercise.sets.length > 1) {
      const updatedExercises = [...exerciseSets];
      updatedExercises[currentExerciseIndex].sets.splice(setIndex, 1);
      updatedExercises[currentExerciseIndex].targetSets -= 1;
      setExerciseSets(updatedExercises);
    }
  };

  const updateSet = (setIndex, field, value) => {
    const updatedExercises = [...exerciseSets];
    updatedExercises[currentExerciseIndex].sets[setIndex][field] = value;
    setExerciseSets(updatedExercises);
  };

  const handleCancelWorkout = () => {
    onCancel();
    setShowCancelModal(false);
  };

  const completedSetsCount = currentExercise?.sets.filter((s) => s.completed).length || 0;
  const totalCompletedSets = exerciseSets.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0);
  const totalSets = exerciseSets.reduce((acc, ex) => acc + ex.sets.length, 0);

  return (
    <>
      <div className="workout-player">
        {/* Workout Header */}
        <div className="workout-player-header">
          <div className="workout-info">
            <h1 className="app-title">{workout.name}</h1>
            <div className="workout-stats-row">
              <div className="stat-badge">
                <span className="stat-label">{t.duration || 'Duration'}</span>
                <span className="stat-value">{formatTime(workoutDuration)}</span>
              </div>
              <div className="stat-badge">
                <span className="stat-label">{t.sets || 'Sets'}</span>
                <span className="stat-value">{totalCompletedSets}/{totalSets}</span>
              </div>
            </div>
          </div>
          <button className="cancel-btn" onClick={() => setShowCancelModal(true)}>✕</button>
        </div>

        {/* Rest Timer Banner */}
        {restTimerActive && timer.timeLeft > 0 && (
          <div className="rest-timer-banner">
            <div className="timer-content">
              <span className="timer-label">{t.restTime || 'Rest Time'}</span>
              <span className={`timer-display ${timer.timeLeft <= 15 ? 'warning' : ''}`}>
                {timer.formatTime(timer.timeLeft)}
              </span>
            </div>
            <div className="timer-controls-banner">
              <button
                className="timer-btn-small"
                onClick={() => timer.pause()}
                title={t.pause}
              >
                ⏸
              </button>
              <button
                className="timer-btn-small"
                onClick={() => timer.addTime(30)}
                title={t.addTime}
              >
                +30s
              </button>
              <button
                className="timer-btn-small"
                onClick={() => timer.skip()}
                title={t.skip}
              >
                ✓
              </button>
            </div>
          </div>
        )}

        {/* Exercise Content */}
        <div className="workout-player-content">
          <div className="exercise-section">
            <div className="exercise-header">
              <div className="exercise-title-block">
                <h2>{currentExercise?.name}</h2>
                <span className="exercise-progress-small">
                  {currentExerciseIndex + 1} / {exerciseSets.length}
                </span>
              </div>
              <div className="target-specs">
                <div className="spec-chip">
                  <span>{currentExercise?.targetReps}</span>
                  <small>{t.reps}</small>
                </div>
                <div className="spec-chip">
                  <span>{currentExercise?.targetWeight}</span>
                  <small>kg</small>
                </div>
              </div>
            </div>

            {/* Sets Display */}
            <div className="sets-container">
              {currentExercise?.sets.map((set, idx) => (
                <div
                  key={set.id}
                  className={`set-card ${set.completed ? 'completed' : ''} ${
                    idx === currentSetIndex && !set.completed ? 'current' : ''
                  }`}
                >
                  <div className="set-header">
                    <span className="set-number">{t.set} {idx + 1}</span>
                    {set.completed && <span className="set-badge-success">✓</span>}
                  </div>

                  <div className="set-inputs">
                    <div className="set-input-group">
                      <label>{t.reps}</label>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(idx, 'reps', e.target.value)}
                        placeholder={currentExercise?.targetReps}
                        className="set-input"
                        disabled={set.completed}
                      />
                    </div>
                    <div className="set-input-group">
                      <label>{t.weight}</label>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(idx, 'weight', e.target.value)}
                        placeholder={currentExercise?.targetWeight}
                        className="set-input"
                        disabled={set.completed}
                      />
                    </div>
                  </div>

                  {!set.completed && idx === currentSetIndex && (
                    <div className="set-actions">
                      <button
                        className="btn-set-complete"
                        onClick={handleSetComplete}
                      >
                        {t.markComplete || 'Mark Complete'}
                      </button>
                      {currentExercise?.sets.length > 1 && (
                        <button
                          className="btn-set-remove"
                          onClick={() => handleRemoveSet(idx)}
                        >
                          {t.removeSet || 'Remove'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Set Button */}
            <button className="btn-add-set" onClick={handleAddSet}>
              + {t.addSet || 'Add Set'}
            </button>
          </div>
        </div>

        {/* Finish Button */}
        {totalCompletedSets > 0 && (
          <div className="workout-finish-bar">
            <button className="btn-finish-workout" onClick={finishWorkout}>
              {t.finishWorkout || 'Finish Workout'}
            </button>
            <span className="finish-note">{totalCompletedSets} {t.setsCompleted || 'sets completed'}</span>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title={t.cancelWorkout || 'Cancel Workout'}
        message={t.cancelWorkoutMessage || 'Are you sure you want to cancel this workout? Your progress will not be saved.'}
        onConfirm={handleCancelWorkout}
        onCancel={() => setShowCancelModal(false)}
        confirmText={t.yes || 'Yes'}
        cancelText={t.no || 'No'}
        isDangerous={true}
      />
    </>
  );
};

export default WorkoutPlayer;
