# Database Functions Reset & RPC Updates

**Date:** January 9, 2026

## Overview

Database functions have been reset and updated to return **TABLES** instead of single objects. This document outlines all fixes applied to handle the new table-based RPC return values.

---

## Changes Summary

### 1. ✅ Fix `socialService.js` Data Extraction

#### `generateInviteLink()` - Line 427
**Issue:** Function tried to access `data[0].invite_code` but RPC now returns `code`

**Fix:**
```javascript
// OLD: const inviteUrl = `${window.location.origin}/join/${data[0].invite_code}`;
// NEW:
const inviteUrl = `${window.location.origin}/join/${data[0].code}`;
```

**Impact:** Invite links now generate correct URLs from table response

---

#### `getFriendDisplayName()` - Line 605
**Issue:** Display name showed "Training Partner [ID]" which was confusing

**Fix:**
```javascript
// OLD: return `Training Partner ${last4}`;
// NEW:
return `Athlete ${last4}`;
```

**Impact:** Friends list now shows "Athlete A1B2" format for privacy

---

### 2. ✅ Fix `useSocial.js` RPC Parameters

#### `fetchLiveFriends()` - Line 18-32
**Issue:** `get_live_friends` RPC requires `p_user_id` parameter but was called with empty params

**Fix:**
```javascript
// OLD: const { data, error: rpcError } = await supabase.rpc('get_live_friends', {});
// NEW:
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  console.warn('User not authenticated');
  setLoading(false);
  return;
}

const { data, error: rpcError } = await supabase
  .rpc('get_live_friends', { p_user_id: user.id });
```

**Impact:** 
- RPC now receives proper user ID parameter
- Correctly filters live friends for authenticated user
- Better error handling for unauthenticated state

---

### 3. ✅ Finalize Friends Tab

#### `FriendsTab.jsx` - No changes needed
- Auto-clipboard copy already implemented ✅
- Web Share API integration in place ✅
- Display names now use `getFriendDisplayName()` which returns "Athlete [ID]" ✅

---

### 4. ✅ Join Link Logic

#### `JoinInviteGroup.jsx` - Line 54-63
**Issue:** Redirected to "/" instead of Dashboard and showed generic toast

**Fix:**
```javascript
// OLD:
// showSuccess('You are now friends! Welcome to the group! 🎉');
// navigate('/');

// NEW:
showSuccess('🎉 Workout Partner Added!');
navigate('/dashboard');
```

**Impact:**
- Users now redirected to Dashboard (more relevant destination)
- Toast message matches feature name ("Workout Partner Added!")
- 2-second delay preserved for UX feedback

---

### 5. ✅ Join Workout (The Clone)

#### `createClonedSessionData()` - Line 305
**Issue:** Function only handled legacy exercises format, not new `active_workout_data` JSON

**Fix:**
```javascript
// NEW: Handle active_workout_data from live friends
if (friendSession.active_workout_data) {
  const workoutData = friendSession.active_workout_data;
  
  const clonedSession = {
    exerciseSets: [],
    currentExerciseIndex: workoutData.current_exercise_index || 0,
    currentSetIndex: workoutData.current_set_index || 0,
    workoutStartTime: workoutData.start_time ? new Date(workoutData.start_time).getTime() : Date.now(),
    workoutName: workoutName || workoutData.workout_name || ...,
    clonedFromFriendId: friendSession.user_id,
    clonedFromSessionId: workoutData.template_id || 0,
    liveWorkoutData: workoutData, // Preserve original
  };
  return clonedSession;
}

// FALLBACK: Legacy format (for backward compatibility)
```

**Impact:**
- Now properly extracts workout metadata from live `active_workout_data`
- Preserves exercise progress (current_exercise_index, current_set_index)
- Maintains backward compatibility with old session format
- Stores live workout data for reference

---

#### `ActiveFriendsBanner.jsx` - Line 182-200
**Issue:** JOIN button passed only workout name, not the full `active_workout_data`

**Fix:**
```javascript
// OLD:
const sessionData = createClonedSessionData(
  {
    user_id: friend.user_id,
    id: 0,
    exercises: workout.name,  // ❌ Only string!
    friend: { username: friend.username, avatar_url: friend.avatar_url },
  },
  ...
);

// NEW:
const sessionData = createClonedSessionData(
  {
    user_id: friend.user_id,
    username: friend.username,
    avatar_url: friend.avatar_url,
    active_workout_data: friend.active_workout_data,  // ✅ Full JSON data!
  },
  ...
);
```

**Impact:**
- JOIN button now passes complete workout metadata
- `createClonedSessionData` can properly initialize session state
- Exercise progress and timing information preserved

---

## RPC Function Compatibility

All functions now assume table/array responses from RPC functions:

| Function | Parameter | Response Type |
|----------|-----------|---------------|
| `create_invite_link` | `expires_in_hours` | **TABLE** with `.code` field |
| `accept_invite_link` | `invite_code_param` | **TABLE** with `.success`, `.message` fields |
| `get_invite_details` | `invite_code_param` | **TABLE** with `.valid`, `.message` fields |
| `get_my_invite_links` | (no params) | **TABLE** with `.invite_code` field |
| `get_live_friends` | `p_user_id` | **TABLE** with friend data + `active_workout_data` JSONB |

---

## Testing Checklist

- [ ] Generate invite link → verify `data[0].code` is accessed
- [ ] Share link via clipboard → URL correct with `/join/{code}`
- [ ] Accept invite (click `/join/{code}`) → redirects to `/dashboard` with "🎉 Workout Partner Added!" toast
- [ ] View friends list → shows "Athlete [ID]" for users without username
- [ ] View active friends → live friends display with progress bars
- [ ] Click JOIN button → cloned session created with correct `active_workout_data`
- [ ] Verify WorkoutPlayer initializes with proper exercise state

---

## Files Modified

1. **src/services/socialService.js**
   - `generateInviteLink()` - Access code via `.code`
   - `getFriendDisplayName()` - Return "Athlete [ID]"
   - `createClonedSessionData()` - Handle `active_workout_data` JSON

2. **src/useSocial.js**
   - `fetchLiveFriends()` - Pass `p_user_id` parameter to RPC

3. **src/JoinInviteGroup.jsx**
   - `handleAcceptInvite()` - Redirect to `/dashboard` with updated toast

4. **src/ActiveFriendsBanner.jsx**
   - JOIN button click handler - Pass full `active_workout_data` to `createClonedSessionData`

---

## Compilation Status

✅ **All files compile successfully with zero errors**

```
✓ src/services/socialService.js - No errors
✓ src/useSocial.js - No errors
✓ src/JoinInviteGroup.jsx - No errors
✓ src/ActiveFriendsBanner.jsx - No errors
✓ src/FriendsTab.jsx - No errors
```
