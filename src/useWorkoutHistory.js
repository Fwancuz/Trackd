import { useState, useCallback } from 'react';
import { supabase } from './supabaseClient';

/**
 * Custom hook for managing workout history
 * Handles fetching, deleting, and calculating workout statistics
 */
export const useWorkoutHistory = (userId) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch completed sessions for the user
   */
  const fetchHistory = useCallback(async () => {
    if (!userId) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('completed_sessions')
        .select(`
          id,
          user_id,
          workout_id,
          completed_at,
          exercises,
          duration,
          created_at
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      
      if (sessionsError) throw sessionsError;
      
      // Transform data to extract name from exercises JSON and calculate volume
      const transformedData = (sessionsData || []).map(session => {
        // Extract name from exercises.name or fallback to 'Unknown Workout'
        let templateName = 'Unknown Workout';
        if (session.exercises && session.exercises.name) {
          templateName = session.exercises.name;
        }
        
        // Calculate total volume from exercises data
        let totalVolume = 0;
        let exercisesData = session.exercises;
        
        // Handle new structure where exercises = {name: '...', data: [...]}
        if (session.exercises && session.exercises.data && Array.isArray(session.exercises.data)) {
          exercisesData = session.exercises.data;
        }
        
        if (Array.isArray(exercisesData)) {
          exercisesData.forEach(exercise => {
            if (exercise.sets && Array.isArray(exercise.sets)) {
              exercise.sets.forEach(set => {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseInt(set.reps) || 0;
                totalVolume += weight * reps;
              });
            }
          });
        }
        
        return {
          id: session.id,
          sessionId: session.id,
          templateName,
          workoutId: session.workout_id,
          completedAt: session.completed_at,
          exercises: session.exercises,
          duration: session.duration,
          totalVolume,
          createdAt: session.created_at
        };
      });
      
      setHistory(transformedData);
      return transformedData;
    } catch (err) {
      console.error('Error fetching workout history:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Delete a completed session by ID
   */
  const deleteSession = useCallback(async (sessionId) => {
    if (!userId) {
      setError('User ID is required');
      return false;
    }
    
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('completed_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;
      
      // Update local state
      setHistory(prevHistory => prevHistory.filter(item => item.id !== sessionId));
      return true;
    } catch (err) {
      console.error('Error deleting workout session:', err);
      setError(err.message);
      return false;
    }
  }, [userId]);

  /**
   * Calculate total lifetime volume from history
   */
  const calculateTotalVolume = useCallback(() => {
    return history.reduce((total, session) => total + session.totalVolume, 0);
  }, [history]);

  return {
    history,
    loading,
    error,
    fetchHistory,
    deleteSession,
    calculateTotalVolume,
    setHistory
  };
};
