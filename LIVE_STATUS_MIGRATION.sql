-- Live Status System Migration
-- Add live workout tracking to user_settings table

-- ============================================
-- ADD COLUMNS TO user_settings
-- ============================================

ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS active_workout_data jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT NULL;

-- ============================================
-- UPDATE RLS POLICIES ON user_settings
-- ============================================

-- Policy: Users can view own settings (already exists)
-- No changes needed to existing policy

-- NEW Policy: Friends can view friend's active_workout_data
CREATE POLICY "Friends can view active_workout_data" ON public.user_settings
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR is_friend(user_id)
  )
  WITH CHECK (true);

-- ============================================
-- CREATE INDEX FOR PERFORMANCE
-- ============================================

-- Index for querying active workouts
CREATE INDEX IF NOT EXISTS idx_user_settings_active_workout_data 
ON public.user_settings USING GIN (active_workout_data)
WHERE active_workout_data IS NOT NULL;

-- Index for checking last active timestamp
CREATE INDEX IF NOT EXISTS idx_user_settings_last_active_at 
ON public.user_settings(last_active_at DESC);

-- ============================================
-- SCHEMA: active_workout_data structure
-- ============================================
/*
  active_workout_data JSON schema:
  {
    "template_id": number,                    -- Workout template ID
    "workout_name": string,                   -- Name of workout
    "start_time": ISO 8601 timestamp,         -- When workout started
    "current_exercise_index": number,         -- Current exercise (0-based)
    "current_set_index": number,              -- Current set (0-based)
    "duration_seconds": number,               -- How long workout has been running
    "total_exercises": number,                -- Total exercises in workout
    "completed_exercises": number             -- How many exercises completed
  }

  Example:
  {
    "template_id": 123,
    "workout_name": "Leg Day",
    "start_time": "2026-01-09T14:30:00.000Z",
    "current_exercise_index": 2,
    "current_set_index": 1,
    "duration_seconds": 1200,
    "total_exercises": 4,
    "completed_exercises": 1
  }
*/

-- ============================================
-- FUNCTION: get_live_friends()
-- Returns friends who are currently in a workout
-- ============================================
CREATE OR REPLACE FUNCTION public.get_live_friends()
RETURNS TABLE(
  user_id uuid,
  username text,
  avatar_url text,
  active_workout_data jsonb,
  last_active_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.avatar_url,
    us.active_workout_data,
    us.last_active_at
  FROM public.user_settings us
  JOIN public.profiles p ON p.id = us.user_id
  WHERE us.active_workout_data IS NOT NULL
  AND is_friend(us.user_id)
  AND (us.last_active_at IS NULL OR us.last_active_at > NOW() - INTERVAL '30 minutes')
  ORDER BY us.last_active_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: clear_inactive_workouts()
-- Cleanup function to clear stale active workouts
-- Run via scheduled task or on app startup
-- ============================================
CREATE OR REPLACE FUNCTION public.clear_inactive_workouts()
RETURNS void AS $$
BEGIN
  UPDATE public.user_settings
  SET active_workout_data = NULL,
      last_active_at = NULL
  WHERE active_workout_data IS NOT NULL
  AND (last_active_at IS NULL OR last_active_at < NOW() - INTERVAL '30 minutes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_live_friends() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_inactive_workouts() TO authenticated;
