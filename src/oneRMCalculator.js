/**
 * 1RM (One Rep Max) Calculator using Epley Formula
 * 
 * This module provides consistent 1RM calculations across the entire application.
 * Formula: 1RM = weight * (1 + reps / 30)
 * 
 * Reference: Epley (1985) - Most accurate for moderate to heavy loads
 * Valid range: 1-10 reps (most accurate), can estimate up to 15 reps
 */

/**
 * Calculate estimated 1RM using Epley formula
 * @param {number} weight - Weight lifted (kg or lbs)
 * @param {number} reps - Number of repetitions
 * @returns {number} Estimated 1RM value
 */
export const calculateEpley1RM = (weight, reps) => {
  const w = parseFloat(weight) || 0;
  const r = parseInt(reps) || 0;
  
  // For single rep, return the weight itself
  if (r === 1) return w;
  
  // Epley formula: 1RM = weight * (1 + reps / 30)
  const oneRM = w * (1 + r / 30);
  
  return Math.round(oneRM * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate 1RM for multiple sets and return the highest
 * @param {Array} sets - Array of {weight, reps} objects
 * @returns {number} Highest estimated 1RM across all sets
 */
export const calculateMax1RM = (sets) => {
  if (!Array.isArray(sets) || sets.length === 0) return 0;
  
  const oneRMs = sets.map(set => {
    const weight = parseFloat(set.weight) || 0;
    const reps = parseInt(set.reps) || 0;
    return calculateEpley1RM(weight, reps);
  });
  
  return Math.max(...oneRMs);
};

/**
 * Compare current 1RM with previous record
 * @param {number} currentWeight - Current weight lifted
 * @param {number} currentReps - Current reps performed
 * @param {number} previousWeight - Previous record weight
 * @param {number} previousReps - Previous record reps
 * @returns {object} { isNewRecord: boolean, current1RM: number, previous1RM: number, improvement: number }
 */
export const compareRecords = (currentWeight, currentReps, previousWeight = 0, previousReps = 1) => {
  const current1RM = calculateEpley1RM(currentWeight, currentReps);
  const previous1RM = calculateEpley1RM(previousWeight, previousReps);
  const improvement = current1RM - previous1RM;
  
  return {
    isNewRecord: current1RM > previous1RM,
    current1RM: Math.round(current1RM * 100) / 100,
    previous1RM: Math.round(previous1RM * 100) / 100,
    improvement: Math.round(improvement * 100) / 100,
    percentImprovement: previousWeight > 0 ? Math.round((improvement / previous1RM) * 100 * 10) / 10 : 0
  };
};

/**
 * Get 1RM progression from completed sessions
 * @param {Array} completedSessions - Array of completed workout sessions
 * @param {string} exerciseName - Name of the exercise to track
 * @returns {Array} Array of {date, weight, reps, oneRM} objects
 */
export const get1RMProgression = (completedSessions, exerciseName) => {
  const progression = [];
  
  completedSessions.forEach(session => {
    if (!session.exercises || !session.completed_at) return;
    
    let exercisesData = session.exercises;
    if (session.exercises.data && Array.isArray(session.exercises.data)) {
      exercisesData = session.exercises.data;
    } else if (!Array.isArray(session.exercises)) {
      return;
    }
    
    if (!Array.isArray(exercisesData)) return;
    
    exercisesData.forEach(exercise => {
      if (exercise.name === exerciseName && exercise.sets && Array.isArray(exercise.sets)) {
        // Get the highest weight from all sets
        let maxWeight = 0;
        let repsForMax = 1;
        
        exercise.sets.forEach(set => {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps) || 1;
          if (weight > maxWeight) {
            maxWeight = weight;
            repsForMax = reps;
          }
        });
        
        if (maxWeight > 0) {
          const oneRM = calculateEpley1RM(maxWeight, repsForMax);
          progression.push({
            date: session.completed_at,
            weight: maxWeight,
            reps: repsForMax,
            oneRM: Math.round(oneRM * 100) / 100
          });
        }
      }
    });
  });
  
  // Sort by date
  return progression.sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Format 1RM value with appropriate decimal places
 * @param {number} value - 1RM value to format
 * @returns {string} Formatted string with up to 2 decimal places
 */
export const format1RM = (value) => {
  const num = parseFloat(value) || 0;
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
};

export default {
  calculateEpley1RM,
  calculateMax1RM,
  compareRecords,
  get1RMProgression,
  format1RM
};
