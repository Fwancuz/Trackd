import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Trash2, Clock, Dumbbell } from 'lucide-react';
import translations from './translations';
import ConfirmModal from './ConfirmModal';
import HoldButton from './HoldButton';
import MoreMenu from './MoreMenu';
import { useToast } from './ToastContext';
import { useRestTimer } from './useRestTimer';
import RestTimerOverlay from './RestTimerOverlay';

// Session Recovery Storage Key
const STORAGE_KEY = 'trackd_active_session';

const getNow = () => Date.now();

const WorkoutPlayer = ({ workout, onComplete, onCancel, language = 'en', recoveredSession = null }) => {
  const isValidSessionData = (data) => {
    const hasWorkoutName = typeof data?.workoutName === 'string' && data.workoutName.trim().length > 0;
    const hasExerciseSets = Array.isArray(data?.exerciseSets) && data.exerciseSets.length > 0;
    const hasSetsArrays = hasExerciseSets && data.exerciseSets.every((ex) => Array.isArray(ex?.sets));
    return hasWorkoutName && hasExerciseSets && hasSetsArrays;
  };

  // Initialize state with recovered session or new workout
  const initializeState = () => {
    if (recoveredSession) {
      // Deep clone the recovered session to prevent mutations of stored data
      return structuredClone(recoveredSession);
    }
    
    // Deep clone the workout exercises to prevent mutations of the template
    const deepClonedExercises = structuredClone(workout.exercises);
    
    return {
      exerciseSets: deepClonedExercises.map((ex) => ({
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
      })),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      workoutStartTime: getNow(),
      workoutName: workout.name,
    };
  };

  const [initialState] = useState(() => initializeState());
  
  const [exerciseSets, setExerciseSets] = useState(() => initialState.exerciseSets);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(() => initialState.currentExerciseIndex);
  const [currentSetIndex, setCurrentSetIndex] = useState(() => initialState.currentSetIndex);
  const [workoutStartTime] = useState(() => initialState.workoutStartTime);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [restTimerActive, setRestTimerActive] = useState(false);

  const timer = useRestTimer(90);
  const { success } = useToast();
  const t = translations[language];
  const stateInitializedRef = useRef(false);

  // Workout duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkoutDuration(Math.floor((Date.now() - workoutStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutStartTime]);

  // Persist workout state to localStorage whenever it changes
  useEffect(() => {
    if (!stateInitializedRef.current) return;

    // Don't persist if state is incomplete (prevents corrupting a valid saved session)
    const hasValidExerciseSets = Array.isArray(exerciseSets) && exerciseSets.length > 0;
    const hasSetsArrays = hasValidExerciseSets && exerciseSets.every((ex) => Array.isArray(ex?.sets));
    if (!hasValidExerciseSets || !hasSetsArrays) return;

    const sessionData = {
      workoutName: initialState.workoutName,
      exerciseSets,
      currentExerciseIndex,
      currentSetIndex,
      workoutStartTime,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving session to localStorage:', error);
    }
  }, [exerciseSets, currentExerciseIndex, currentSetIndex]);

  // Mark state as initialized on mount (to start persisting after first render)
  useEffect(() => {
    stateInitializedRef.current = true;

    // Lock device to portrait orientation
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('portrait').catch(err => {
        console.log('Orientation lock not available or denied:', err);
      });
    }

    // IMPORTANT: Never overwrite an existing session on mount.
    // On mobile wake-up, localStorage can be briefly unavailable; we must not "replace" a real session with an empty one.
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      if (existingRaw) {
        const existing = JSON.parse(existingRaw);
        if (isValidSessionData(existing)) return;
      }
    } catch {
      // ignore
    }

    const initialSessionData = {
      workoutName: initialState.workoutName,
      exerciseSets: initialState.exerciseSets,
      currentExerciseIndex: initialState.currentExerciseIndex,
      currentSetIndex: initialState.currentSetIndex,
      workoutStartTime,
    };

    // Only write if the initial state is valid (starting a brand new workout).
    if (!isValidSessionData(initialSessionData)) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSessionData));
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error saving trackd_active_session:', error);
    }
  }, []);

  // Close rest timer overlay when timer finishes
  useEffect(() => {
    if (restTimerActive && timer.timeLeft === 0) {
      const timeoutId = setTimeout(() => {
        setRestTimerActive(false);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [timer.timeLeft, restTimerActive]);

  const currentExercise = exerciseSets?.[currentExerciseIndex];

  const hasValidExerciseSets = Array.isArray(exerciseSets) && exerciseSets.length > 0;
  const hasValidCurrentExercise = !!currentExercise && Array.isArray(currentExercise.sets);
  const isInvalidState = !hasValidExerciseSets || !hasValidCurrentExercise;

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
    if (!currentExercise || !Array.isArray(currentExercise.sets)) {
      handleCancelWorkout();
      return;
    }
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
    
    // Calculate total volume (sum of weight * reps for all completed sets)
    const totalVolume = exerciseSets.reduce((sum, exercise) => {
      return sum + exercise.sets
        .filter((s) => s.completed)
        .reduce((exSum, set) => {
          const weight = parseFloat(set.weight) || parseFloat(exercise.targetWeight) || 0;
          const reps = parseInt(set.reps) || parseInt(exercise.targetReps) || 0;
          return exSum + (weight * reps);
        }, 0);
    }, 0);
    
    // Get workout name from initial state, default to 'Sesja treningowa' if not available
    const workoutName = initialState.workoutName || 'Sesja treningowa';
    
    // Wrap exercises data with metadata (name stored in JSON)
    const exercisesWithMetadata = {
      name: workoutName,
      data: formattedData
    };
    
    // Clear session from localStorage (hard clear first)
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error clearing session from localStorage:', error);
    }
    
    onComplete(exercisesWithMetadata, workoutDuration, workoutName, totalVolume);
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
    // Clear session from localStorage (hard clear first)
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error clearing session from localStorage:', error);
    }
    
    // Reset all local state to ensure clean state for next session
    const resetState = initializeState();
    setExerciseSets(resetState.exerciseSets);
    setCurrentExerciseIndex(resetState.currentExerciseIndex);
    setCurrentSetIndex(resetState.currentSetIndex);
    timer.reset(90); // Reset the rest timer
    setRestTimerActive(false);
    
    setShowCancelModal(false);
    onCancel();
  };

  const totalCompletedSets = (exerciseSets || []).reduce(
    (acc, ex) => acc + (ex?.sets || []).filter((s) => s?.completed).length,
    0
  );
  const totalSets = (exerciseSets || []).reduce((acc, ex) => acc + (ex?.sets || []).length, 0);

  // Prevent white-screen crash when session is incomplete.
  if (isInvalidState) return null;

  return (
    <>
      <div className="workout-player">
        {/* Workout Header */}
        <div className="workout-player-header">
          <div className="workout-info">
            <h1 className="app-title">{workout.name}</h1>
            <div className="workout-stats-row">
              <div className="stat-badge">
                <Clock size={16} className="stat-icon" />
                <span className="stat-value">{formatTime(workoutDuration)}</span>
              </div>
              <div className="stat-badge">
                <Dumbbell size={16} className="stat-icon" />
                <span className="stat-value">{totalCompletedSets}/{totalSets}</span>
              </div>
            </div>
          </div>
          <button className="cancel-btn" onClick={() => setShowCancelModal(true)}>
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Rest Timer Overlay */}
        <RestTimerOverlay
          timer={timer}
          isVisible={restTimerActive}
          onSkip={timer.skip}
          nextExerciseName={
            exerciseSets[currentExerciseIndex + 1]?.name ||
            (currentSetIndex + 1 < (currentExercise?.sets?.length || 0) ? currentExercise?.name : '')
          }
          nextWeight={exerciseSets[currentExerciseIndex + 1]?.targetWeight || currentExercise?.targetWeight}
          nextReps={exerciseSets[currentExerciseIndex + 1]?.targetReps || currentExercise?.targetReps}
        />

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
                    <div className="set-header-actions">
                      {set.completed && <Check size={18} strokeWidth={2} className="set-badge-success" />}
                      <MoreMenu 
                        items={[
                          {
                            label: t.deleteSet || 'Delete Set',
                            icon: Trash2,
                            variant: 'danger',
                            onClick: () => handleRemoveSet(idx)
                          }
                        ]}
                      />
                    </div>
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

            {/* Finish Button - at bottom of content */}
            {totalCompletedSets > 0 && (
              <div className="workout-finish-section">
                <HoldButton 
                  onComplete={finishWorkout}
                  label={t.finishWorkout || 'Finish Workout'}
                />
                <span className="finish-note">{totalCompletedSets} {t.setsCompleted || 'sets completed'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title={t.cancelWorkout || 'Cancel Workout'}
        message={t.cancelWorkoutMessage || 'Are you sure? This will delete all progress for this session.'}
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
