# Quick Verification Guide - RPC Table Response Fixes

## What Changed

Database functions now return **TABLES** instead of single objects. All code has been updated to handle this new format.

---

## 5-Minute Verification

### 1. Generate Invite Link
```
1. Open FriendsTab
2. Click "Create Link" section
3. Click "Generate Invite Link"
4. ✓ Link appears in list
5. ✓ Copy/Share buttons work
6. ✓ URL format: https://yourapp.com/join/{CODE}
```

### 2. Accept Invite Link
```
1. Share the link with another user (or test in new browser)
2. Open: https://yourapp.com/join/{CODE}
3. ✓ Shows invite details
4. ✓ Click "Accept"
5. ✓ Toast shows: "🎉 Workout Partner Added!"
6. ✓ Redirects to /dashboard after 2 seconds
```

### 3. View Friends List
```
1. Go to FriendsTab → "Friends" section
2. ✓ Shows list of friends
3. ✓ Friend display format: "Athlete A1B2" (for no username)
4. ✓ Or actual username if available
```

### 4. View Live Friends (Active Workouts)
```
1. Have User A start a workout (WorkoutPlayer)
2. User B opens app → sees ActiveFriendsBanner
3. ✓ Shows "User A - Leg Day • 2/4 exercises"
4. ✓ Progress bar shows exercise progress
5. Click "Join Workout" button
6. ✓ New cloned session created in localStorage
7. ✓ WorkoutPlayer initializes with User A's workout
```

---

## Key Fixes Applied

### 1. Invite Link Generation
```javascript
// Now correctly accesses:
data[0].code  // ✓ Not data[0].invite_code
```

### 2. Friend Display Names
```javascript
// Now shows:
"Athlete A1B2"  // ✓ Not "Training Partner A1B2"
```

### 3. Live Friends RPC Call
```javascript
// Now passes parameter:
supabase.rpc('get_live_friends', { p_user_id: user.id })
// ✓ Previously called with empty {}
```

### 4. Join Redirect
```javascript
// Now redirects to:
navigate('/dashboard')  // ✓ Not navigate('/')
// Toast: "🎉 Workout Partner Added!"
```

### 5. Join Workout Clone
```javascript
// Now extracts from:
friend.active_workout_data  // ✓ Full JSONB metadata
// Including: current_exercise_index, current_set_index, workout_name
```

---

## Error Handling

All RPC calls now:
- ✓ Validate array response: `if (!Array.isArray(data) || data.length === 0)`
- ✓ Access first row: `data[0]`
- ✓ Handle missing fields gracefully
- ✓ Log detailed error context

---

## Environment Variables Required

Verify these in your `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Files to Test

| File | Feature | Status |
|------|---------|--------|
| FriendsTab.jsx | Generate/copy/share invites | ✓ Ready |
| JoinInviteGroup.jsx | Accept invite & redirect | ✓ Ready |
| useSocial.js | Fetch live friends | ✓ Ready |
| ActiveFriendsBanner.jsx | Show & join active workouts | ✓ Ready |
| WorkoutPlayer.jsx | Initialize cloned session | ✓ Ready |

---

## Database Schema Reminder

**Invite Links Table Structure:**
```sql
id | code | created_by | expires_at | created_at | used
```

**User Settings JSONB:**
```json
{
  "active_workout_data": {
    "template_id": 123,
    "workout_name": "Leg Day",
    "current_exercise_index": 2,
    "current_set_index": 1,
    "start_time": "2026-01-09T14:30:00Z",
    "total_exercises": 4,
    "completed_exercises": 1
  }
}
```

---

## Support

If you encounter issues:

1. **Invite link not generating?**
   - Check browser console for RPC errors
   - Verify `create_invite_link` function exists in Supabase
   - Ensure RLS policies allow authenticated users to insert

2. **Can't accept invite?**
   - Check that user is authenticated
   - Verify invite code exists and not expired
   - Check `accept_invite_link` RPC exists

3. **Live friends not showing?**
   - Verify `get_live_friends` RPC exists with `p_user_id` parameter
   - Check that friend's `active_workout_data` is populated in DB
   - Monitor network tab for RPC call response

---

**All code compiled successfully** ✅ - Ready for testing!
