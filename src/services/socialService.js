import { supabase } from '../supabaseClient';

/**
 * Get live friends (those with active workouts)
 * Calls supabase.rpc('get_live_friends') with NO arguments
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getLiveFriends = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Call RPC with NO arguments - the RPC function handles filtering by current user
    const { data, error: rpcError } = await supabase
      .rpc('get_live_friends');

    if (rpcError) {
      console.error('RPC error fetching live friends:', {
        message: rpcError.message,
        code: rpcError.code,
        details: rpcError.details
      });
      
      // Graceful degradation
      if (rpcError.code === 'PGRST116') {
        return { success: true, data: [] };
      }
      throw rpcError;
    }

    if (!Array.isArray(data)) {
      console.warn('Unexpected response format from get_live_friends');
      return { success: true, data: [] };
    }

    // Format response - ensure active_workout_data is included
    const formattedFriends = data.map(friend => ({
      user_id: friend.user_id,
      username: friend.username,
      avatar_url: friend.avatar_url,
      active_workout_data: friend.active_workout_data,
      last_active_at: friend.last_active_at
    }));

    return { success: true, data: formattedFriends };
  } catch (error) {
    console.error('Error fetching live friends:', error);
    return { 
      success: false, 
      error: error.message || 'Social service temporarily unavailable' 
    };
  }
};

/**
 * Send a friend request to another user
 * @param {string} receiverId - UUID of the user to send request to
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const sendFriendRequest = async (receiverId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: user.id,
        receiver_id: receiverId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Accept a pending friend request
 * @param {number} friendshipId - ID of the friendship request
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const acceptFriendRequest = async (friendshipId) => {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reject a pending friend request
 * @param {number} friendshipId - ID of the friendship request
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const rejectFriendRequest = async (friendshipId) => {
  try {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove a friend (unfriend)
 * @param {string} friendUserId - UUID of the friend to remove
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeFriend = async (friendUserId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${friendUserId}),and(requester_id.eq.${friendUserId},receiver_id.eq.${user.id})`
      );

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get list of accepted friends for the current user
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getFriendsList = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all accepted friendships where user is requester
    const { data: asRequester, error: error1 } = await supabase
      .from('friendships')
      .select('receiver_id, status, created_at')
      .eq('requester_id', user.id)
      .eq('status', 'accepted');

    if (error1) throw error1;

    // Get all accepted friendships where user is receiver
    const { data: asReceiver, error: error2 } = await supabase
      .from('friendships')
      .select('requester_id, status, created_at')
      .eq('receiver_id', user.id)
      .eq('status', 'accepted');

    if (error2) throw error2;

    // Combine friend IDs
    const friendIds = [
      ...(asRequester || []).map(f => f.receiver_id),
      ...(asReceiver || []).map(f => f.requester_id)
    ];

    if (friendIds.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch friend profiles with user details
    const { data: friendProfiles, error: error3 } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', friendIds);

    if (error3) throw error3;

    return { success: true, data: friendProfiles || [] };
  } catch (error) {
    console.error('Error fetching friends list:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get pending friend requests for the current user
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getPendingFriendRequests = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get pending requests where user is receiver
    const { data, error } = await supabase
      .from('friendships')
      .select('id, requester_id, receiver_id, status, created_at')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch requester profiles
    const requesterIds = (data || []).map(f => f.requester_id);
    if (requesterIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data: requesterProfiles, error: error2 } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', requesterIds);

    if (error2) throw error2;

    // Combine friendship data with profiles
    const enrichedRequests = data.map(request => {
      const profile = requesterProfiles?.find(p => p.id === request.requester_id);
      return { ...request, requester: profile };
    });

    return { success: true, data: enrichedRequests };
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get active friend sessions (workouts in progress)
 * A session is considered "active" if it was recently updated
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getActiveFriendSessions = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all accepted friends
    const { success, data: friends, error } = await getFriendsList();
    if (!success) throw new Error(error);

    const friendIds = friends.map(f => f.id);
    if (friendIds.length === 0) {
      return { success: true, data: [] };
    }

    // Get recent completed_sessions from friends
    // We consider sessions "active" if they were created/updated in the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: sessions, error: sessionsError } = await supabase
      .from('completed_sessions')
      .select('id, user_id, workout_id, exercises, duration, completed_at, created_at')
      .in('user_id', friendIds)
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false });

    if (sessionsError) throw sessionsError;

    // Fetch friend profiles for context
    const { data: friendProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', friendIds);

    if (profilesError) throw profilesError;

    // Enrich sessions with friend info
    const enrichedSessions = (sessions || []).map(session => {
      const friendProfile = friendProfiles?.find(p => p.id === session.user_id);
      return {
        ...session,
        friend: friendProfile,
        isActive: true // Mark as active if within 2-hour window
      };
    });

    return { success: true, data: enrichedSessions };
  } catch (error) {
    console.error('Error fetching active friend sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get activity of a specific friend (recent sessions)
 * @param {string} friendUserId - UUID of the friend
 * @param {number} limit - Number of sessions to fetch (default: 10)
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getFriendActivity = async (friendUserId, limit = 10) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify friendship exists
    const { data: friendship, error: friendError } = await supabase
      .from('friendships')
      .select('status')
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${friendUserId}),and(requester_id.eq.${friendUserId},receiver_id.eq.${user.id})`
      )
      .eq('status', 'accepted')
      .single();

    if (friendError || !friendship) {
      throw new Error('Not friends with this user');
    }

    // Get friend's recent sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('completed_sessions')
      .select('id, workout_id, exercises, duration, completed_at, created_at')
      .eq('user_id', friendUserId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (sessionsError) throw sessionsError;

    return { success: true, data: sessions || [] };
  } catch (error) {
    console.error('Error fetching friend activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate a new friend code for the current user (6-digit code)
 * Calls supabase.rpc('create_friend_code')
 * @returns {Promise<{success: boolean, code?: string, error?: string}>}
 */
export const generateFriendCode = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Call the RPC function to create friend code
    // RPC returns a string directly
    const { data, error } = await supabase
      .rpc('create_friend_code');

    if (error) {
      console.error('RPC error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '404' || error.message?.includes('not found')) {
        throw new Error('Friend code service not available');
      }
      throw error;
    }

    // RPC returns a string directly (e.g., 'ABC123')
    if (!data || typeof data !== 'string') {
      throw new Error('Invalid response from server');
    }

    return { success: true, code: data };
  } catch (error) {
    console.error('Error generating friend code:', error);
    return { success: false, error: error.message || 'Failed to generate friend code' };
  }
};

/**
 * Redeem a friend code and establish friendship
 * @param {string} code - The 6-digit friend code
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const redeemFriendCode = async (code) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Clean and validate code format (6 digits)
    const cleanCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(cleanCode)) {
      throw new Error('Friend code must be 6 characters (letters and numbers)');
    }

    // Query friend_invites table for the code
    const { data: inviteData, error: queryError } = await supabase
      .from('friend_invites')
      .select('*')
      .eq('code', cleanCode.toUpperCase())
      .maybeSingle();

    if (queryError) {
      console.error('Error querying friend code:', queryError);
      throw new Error('Friend code not found or invalid');
    }

    if (!inviteData) {
      throw new Error('Friend code not found');
    }

    // Check if user is trying to redeem their own code
    if (inviteData.inviter_id === user.id) {
      throw new Error('Cannot redeem your own friend code');
    }

    // Insert into friendships table to establish connection
    const { data: friendship, error: insertError } = await supabase
      .from('friendships')
      .insert({
        requester_id: inviteData.inviter_id,
        receiver_id: user.id,
        status: 'accepted'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating friendship:', insertError);
      
      // Check if friendship already exists
      if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
        throw new Error('Already friends with this user');
      }
      throw insertError;
    }

    return { 
      success: true, 
      message: 'Friend added successfully!',
      friendshipId: friendship?.id
    };
  } catch (error) {
    console.error('Error redeeming friend code:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to redeem friend code' 
    };
  }
};

/**
 * Get current user's friend code (or generate if doesn't exist)
 * @returns {Promise<{success: boolean, code?: string, error?: string}>}
 */
export const getMyFriendCode = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Query for existing friend code - use limit(1).maybeSingle() to handle 0 or 1 rows
    const { data: existingCode, error: queryError } = await supabase
      .from('friend_invites')
      .select('code')
      .eq('inviter_id', user.id)
      .limit(1)
      .maybeSingle();

    if (queryError) {
      console.error('Error fetching friend code:', queryError);
      // Continue to generate instead of throwing
    }

    if (existingCode?.code) {
      return { success: true, code: existingCode.code };
    }

    // No code exists, generate one
    return await generateFriendCode();
  } catch (error) {
    console.error('Error getting friend code:', error);
    return { success: false, error: error.message || 'Failed to get friend code' };
  }
};

/**
 * Clone a friend's session for the current user
 * This creates a new local session in localStorage using friend's exercises as template
 * @param {object} friendSession - Friend's session object
 * @param {string} workoutName - Name for the cloned workout
 * @returns {object} - Cloned session data ready for localStorage
 */
export const createClonedSessionData = (friendSession, workoutName = null) => {
  try {
    // Handle active_workout_data from live friends (JSONB format)
    if (friendSession.active_workout_data) {
      const workoutData = friendSession.active_workout_data;
      
      // For live friends, we create a basic session based on the active_workout_data
      const clonedSession = {
        exerciseSets: [], // Will be populated when user loads the actual workout template
        currentExerciseIndex: workoutData.current_exercise_index || 0,
        currentSetIndex: workoutData.current_set_index || 0,
        workoutStartTime: workoutData.start_time ? new Date(workoutData.start_time).getTime() : Date.now(),
        workoutName: workoutName || workoutData.workout_name || `${friendSession.username || 'Friend'}'s Workout`,
        clonedFromFriendId: friendSession.user_id,
        clonedFromSessionId: workoutData.template_id || 0,
        liveWorkoutData: workoutData, // Preserve original live data
      };
      
      return clonedSession;
    }

    // Fallback: Parse friend's exercises if they're JSON strings (legacy format)
    let exercises = [];
    if (friendSession.exercises) {
      if (typeof friendSession.exercises === 'string') {
        exercises = JSON.parse(friendSession.exercises);
      } else {
        exercises = friendSession.exercises;
      }
    }

    // Create exercise sets from friend's template
    const exerciseSets = (exercises || []).map((ex) => ({
      name: ex.name || 'Exercise',
      targetSets: parseInt(ex.sets) || parseInt(ex.targetSets) || 1,
      targetReps: ex.reps || ex.targetReps || '',
      targetWeight: ex.weight || ex.targetWeight || '',
      sets: Array.from(
        { length: parseInt(ex.sets) || parseInt(ex.targetSets) || 1 },
        (_, i) => ({
          id: i,
          completed: false,
          reps: '',
          weight: '',
        })
      ),
    }));

    // Create session object for localStorage
    const clonedSession = {
      exerciseSets,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      workoutStartTime: Date.now(),
      workoutName: workoutName || `${friendSession.friend?.username || 'Friend'}'s Workout`,
      clonedFromFriendId: friendSession.user_id,
      clonedFromSessionId: friendSession.id,
    };

    return clonedSession;
  } catch (error) {
    console.error('Error creating cloned session:', error);
    return null;
  }
};

/**
 * Check if users are friends
 * @param {string} otherUserId - UUID of the other user
 * @returns {Promise<{success: boolean, isFriend: boolean, error?: string}>}
 */
export const checkFriendship = async (otherUserId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .select('status')
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    const isFriend = data?.status === 'accepted';
    return { success: true, isFriend };
  } catch (error) {
    console.error('Error checking friendship:', error);
    return { success: false, isFriend: false, error: error.message };
  }
};

/**
 * Generate a new invite link for sharing with friends
 * @param {number} expiresInHours - How long the link is valid (default: 24)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const generateInviteLink = async (expiresInHours = 24) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Call the RPC function to generate invite link
    const { data, error } = await supabase
      .rpc('create_invite_link', { expires_in_hours: expiresInHours });

    // Enhanced error handling for RPC failures
    if (error) {
      console.error('RPC error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Provide user-friendly error messages
      if (error.code === '404' || error.message?.includes('not found')) {
        throw new Error('Database schema not initialized. Please run the migration SQL in Supabase.');
      }
      throw error;
    }

    // Validate response structure
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response from server. Expected invite link data.');
    }

    // Construct the full share URL (access via .code)
    const inviteUrl = `${window.location.origin}/join/${data[0].code}`;

    return { 
      success: true, 
      data: {
        ...data[0],
        fullUrl: inviteUrl
      }
    };
  } catch (error) {
    console.error('Error generating invite link:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to generate invite link. Please try again.' 
    };
  }
};

/**
 * Accept an invite link and become friends with the inviter
 * @param {string} inviteCode - The invite code from the URL
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const acceptInvite = async (inviteCode) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Call the RPC function to accept invite
    const { data, error } = await supabase
      .rpc('accept_invite_link', { invite_code_param: inviteCode });

    // Enhanced error handling for RPC failures
    if (error) {
      console.error('RPC error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '404' || error.message?.includes('not found')) {
        throw new Error('Database schema not initialized. Please run the migration SQL in Supabase.');
      }
      throw error;
    }

    // Validate response structure
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response from server. Please try again.');
    }

    const result = data[0];
    if (!result.success) {
      return { success: false, error: result.message };
    }
    return { 
      success: true, 
      message: result.message,
      friendshipId: result.friendship_id
    };
  } catch (error) {
    console.error('Error accepting invite:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to accept invite. Please try again.' 
    };
  }
};

/**
 * Get details about an invite link before accepting
 * @param {string} inviteCode - The invite code from the URL
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getInviteDetails = async (inviteCode) => {
  try {
    // Call the RPC function to get invite details
    const { data, error } = await supabase
      .rpc('get_invite_details', { invite_code_param: inviteCode });

    // Enhanced error handling for RPC failures
    if (error) {
      console.error('RPC error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '404' || error.message?.includes('not found')) {
        throw new Error('Database schema not initialized. Please run the migration SQL in Supabase.');
      }
      throw error;
    }

    // Validate response structure
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response from server.');
    }

    const result = data[0];
    return {
      success: result.valid,
      data: result,
      error: result.valid ? null : result.message
    };
  } catch (error) {
    console.error('Error getting invite details:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to verify invite link. Please try again.' 
    };
  }
};

/**
 * Get all active invite links created by current user
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getMyInviteLinks = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Call the RPC function to get user's invite links
    const { data, error } = await supabase
      .rpc('get_my_invite_links');

    // Enhanced error handling for RPC failures
    if (error) {
      console.error('RPC error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '404' || error.message?.includes('not found')) {
        console.warn('Database schema not fully initialized. Returning empty list.');
        return { success: true, data: [] };
      }
      throw error;
    }

    // Validate response is array (may be empty)
    if (!Array.isArray(data)) {
      console.warn('Unexpected response format from get_my_invite_links');
      return { success: true, data: [] };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching invite links:', error);
    // Return empty list instead of failing completely
    return { 
      success: true, 
      data: [],
      error: error.message 
    };
  }
};

/**
 * Revoke an invite link so it can no longer be used
 * @param {number} inviteLinkId - ID of the invite link to revoke
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const revokeInviteLink = async (inviteLinkId) => {
  try {
    const { error } = await supabase
      .from('invite_links')
      .update({ used: true })
      .eq('id', inviteLinkId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error revoking invite link:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get friend's display name (email or masked ID)
 * @param {string} userId - UUID of the friend
 * @returns {Promise<string>} - Display name for the friend
 */
export const getFriendDisplayName = async (userId) => {
  try {
    // Try to get username from profiles (for backward compatibility)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    if (!profileError && profile?.username) {
      return profile.username;
    }

    // Fallback to Athlete display: "Athlete [Last 4 ID]"
    const last4 = userId.slice(-4).toUpperCase();
    return `Athlete ${last4}`;
  } catch (error) {
    console.error('Error getting friend display name:', error);
    // Return Athlete fallback
    const last4 = userId.slice(-4).toUpperCase();
    return `Athlete ${last4}`;
  }
};
