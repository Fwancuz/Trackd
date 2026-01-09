import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { getLiveFriends } from './services/socialService';

/**
 * Custom hook for managing social features and live friend activity
 * Features:
 * - Get list of friends currently in workouts (live)
 * - Subscribe to real-time updates via Supabase Realtime
 * - Auto-cleanup of stale workouts
 */
export const useSocial = (userId, language = 'en') => {
  const [liveFriends, setLiveFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscribed, setSubscribed] = useState(false);

  /**
   * Fetch live friends using socialService RPC
   */
  const fetchLiveFriends = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Use the updated getLiveFriends from socialService
      // It calls supabase.rpc('get_live_friends') with NO arguments
      const result = await getLiveFriends();

      if (result.success) {
        setLiveFriends(result.data || []);
      } else {
        console.warn('Failed to fetch live friends:', result.error);
        setError(result.error);
        setLiveFriends([]); // Clear list on error
      }
    } catch (err) {
      console.error('Error fetching live friends:', err);
      setError(err.message);
      setLiveFriends([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Fallback: Direct query if RPC function not available
   */
  const fetchLiveFriendsDirectly = useCallback(async () => {
    if (!userId) return;

    try {
      // Get user's friend IDs
      const { data: friendships, error: friendshipError } = await supabase
        .from('friendships')
        .select('requester_id, receiver_id')
        .eq('status', 'accepted')
        .or(
          `requester_id.eq.${userId},receiver_id.eq.${userId}`
        );

      if (friendshipError) throw friendshipError;

      const friendIds = new Set();
      friendships?.forEach(f => {
        if (f.requester_id === userId) {
          friendIds.add(f.receiver_id);
        } else {
          friendIds.add(f.requester_id);
        }
      });

      if (friendIds.size === 0) {
        setLiveFriends([]);
        return;
      }

      // Get live friends' data
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select(`
          user_id,
          active_workout_data,
          last_active_at,
          profiles(id, username, avatar_url)
        `)
        .in('user_id', Array.from(friendIds))
        .not('active_workout_data', 'is', null);

      if (settingsError) throw settingsError;

      const formatted = (settings || []).map(s => ({
        user_id: s.user_id,
        username: s.profiles?.username,
        avatar_url: s.profiles?.avatar_url,
        active_workout_data: s.active_workout_data,
        last_active_at: s.last_active_at,
      }));

      setLiveFriends(formatted);
    } catch (err) {
      console.error('Error in direct query:', err);
      setError(err.message);
      setLiveFriends([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Subscribe to real-time updates on user_settings and friendships tables
   * Triggers whenever:
   * 1. A friend's active_workout_data changes (user_settings)
   * 2. A new friendship is added or removed (friendships)
   */
  useEffect(() => {
    if (!userId) {
      setSubscribed(false);
      return;
    }

    // Initial fetch
    fetchLiveFriends();

    // Subscribe to changes on user_settings
    const userSettingsChannel = supabase
      .channel('live-workouts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=neq.${userId}`, // Don't listen to own changes
        },
        (payload) => {
          // Refetch when any friend's settings change
          console.log('Live status update received:', payload);
          fetchLiveFriends();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSubscribed(true);
          console.log('Subscribed to live workouts');
        } else if (status === 'CLOSED') {
          setSubscribed(false);
          console.log('Unsubscribed from live workouts');
        }
      });

    // Subscribe to changes on friendships table to detect new friendships immediately
    const friendshipsChannel = supabase
      .channel('friendships-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
        },
        (payload) => {
          // Refetch live friends when a new friendship is added
          const newFriendship = payload.new;
          // Trigger refetch if current user is involved in the new friendship
          if (newFriendship.requester_id === userId || newFriendship.receiver_id === userId) {
            console.log('New friendship detected:', payload);
            fetchLiveFriends();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'friendships',
        },
        (payload) => {
          // Refetch live friends when a friendship is removed
          const deletedFriendship = payload.old;
          // Trigger refetch if current user is involved in the deleted friendship
          if (deletedFriendship.requester_id === userId || deletedFriendship.receiver_id === userId) {
            console.log('Friendship removed:', payload);
            fetchLiveFriends();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to friendships changes');
        }
      });

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(userSettingsChannel);
      supabase.removeChannel(friendshipsChannel);
    };
  }, [userId, fetchLiveFriends]);

  /**
   * Manual refresh - useful for pull-to-refresh or explicit updates
   */
  const refreshLiveFriends = useCallback(() => {
    setLoading(true);
    fetchLiveFriends();
  }, [fetchLiveFriends]);

  /**
   * Clear stale workouts (older than 30 minutes)
   * Call on app startup or periodically
   */
  const clearStaleWorkouts = useCallback(async () => {
    try {
      // This calls the cleanup function we created in the migration
      const { error } = await supabase
        .rpc('clear_inactive_workouts', {});

      if (error) {
        console.warn('Could not clear stale workouts:', error);
      } else {
        console.log('Stale workouts cleared');
      }
    } catch (err) {
      console.error('Error clearing stale workouts:', err);
    }
  }, []);

  /**
   * Check if a specific friend is currently working out
   */
  const isFriendActive = useCallback((friendUserId) => {
    return liveFriends.some(f => f.user_id === friendUserId);
  }, [liveFriends]);

  /**
   * Get active workout data for a specific friend
   */
  const getFriendActiveWorkout = useCallback((friendUserId) => {
    const friend = liveFriends.find(f => f.user_id === friendUserId);
    return friend?.active_workout_data || null;
  }, [liveFriends]);

  /**
   * Format workout progress for display
   */
  const formatWorkoutProgress = useCallback((workoutData) => {
    if (!workoutData) return null;

    const {
      workout_name,
      current_exercise_index,
      total_exercises,
      completed_exercises,
      duration_seconds,
    } = workoutData;

    const minutes = Math.floor(duration_seconds / 60);
    const seconds = duration_seconds % 60;
    const timeStr = `${minutes}m ${seconds}s`;

    return {
      name: workout_name,
      exerciseProgress: `${current_exercise_index + 1}/${total_exercises}`,
      completedExercises,
      totalExercises: total_exercises,
      duration: timeStr,
      durationSeconds: duration_seconds,
    };
  }, []);

  return {
    liveFriends,
    loading,
    error,
    subscribed,
    refreshLiveFriends,
    clearStaleWorkouts,
    isFriendActive,
    getFriendActiveWorkout,
    formatWorkoutProgress,
  };
};

export default useSocial;
