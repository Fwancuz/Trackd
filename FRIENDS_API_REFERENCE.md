# Friends System - API Reference

## Social Service API (`src/services/socialService.js`)

### Friend Management APIs

---

## `sendFriendRequest(receiverId)`

Send a friend request to another user.

**Parameters:**
- `receiverId` (string, UUID) - Target user's UUID

**Returns:**
```javascript
Promise<{
  success: boolean,
  data?: {
    id: number,
    requester_id: string (UUID),
    receiver_id: string (UUID),
    status: 'pending',
    created_at: timestamp,
    updated_at: timestamp
  },
  error?: string
}>
```

**Example:**
```javascript
const result = await sendFriendRequest('550e8400-e29b-41d4-a716-446655440000');
if (result.success) {
  console.log('Request sent!', result.data.id);
} else {
  console.error('Error:', result.error);
}
```

**Errors:**
- `Not authenticated` - User not logged in
- `Unique constraint violation` - Request already sent
- `Cannot friend yourself` - receiverId == current user

---

## `acceptFriendRequest(friendshipId)`

Accept a pending friend request.

**Parameters:**
- `friendshipId` (number) - ID of friendship record

**Returns:**
```javascript
Promise<{
  success: boolean,
  data?: {
    id: number,
    requester_id: string (UUID),
    receiver_id: string (UUID),
    status: 'accepted',
    created_at: timestamp,
    updated_at: timestamp
  },
  error?: string
}>
```

**Example:**
```javascript
const result = await acceptFriendRequest(42);
if (result.success) {
  console.log('Friendship accepted!');
}
```

**Errors:**
- `Not authenticated` - User not logged in
- `No rows returned` - Friendship doesn't exist
- `Permission denied` - User is not receiver

---

## `rejectFriendRequest(friendshipId)`

Reject/delete a pending friend request.

**Parameters:**
- `friendshipId` (number) - ID of friendship record

**Returns:**
```javascript
Promise<{
  success: boolean,
  error?: string
}>
```

**Example:**
```javascript
const result = await rejectFriendRequest(42);
if (result.success) {
  console.log('Request rejected');
}
```

---

## `removeFriend(friendUserId)`

Remove a friend (unfriend).

**Parameters:**
- `friendUserId` (string, UUID) - Friend's UUID

**Returns:**
```javascript
Promise<{
  success: boolean,
  error?: string
}>
```

**Example:**
```javascript
const result = await removeFriend('550e8400-e29b-41d4-a716-446655440000');
if (result.success) {
  console.log('Friend removed');
}
```

---

## `checkFriendship(otherUserId)`

Check if users are friends.

**Parameters:**
- `otherUserId` (string, UUID) - Other user's UUID

**Returns:**
```javascript
Promise<{
  success: boolean,
  isFriend: boolean,
  error?: string
}>
```

**Example:**
```javascript
const result = await checkFriendship('550e8400-e29b-41d4-a716-446655440000');
if (result.success && result.isFriend) {
  console.log('You are friends!');
}
```

---

## Friend Lists APIs

---

## `getFriendsList()`

Get all accepted friends with their profile information.

**Parameters:** None

**Returns:**
```javascript
Promise<{
  success: boolean,
  data?: [
    {
      id: string (UUID),
      username: string,
      avatar_url: string | null,
      created_at: timestamp
    },
    // ... more friends
  ],
  error?: string
}>
```

**Example:**
```javascript
const result = await getFriendsList();
if (result.success) {
  result.data.forEach(friend => {
    console.log(`${friend.username} (${friend.id})`);
  });
}
```

**Notes:**
- Returns empty array if no friends
- Only returns 'accepted' friendships
- Includes friend profiles with usernames and avatars

---

## `getPendingFriendRequests()`

Get all pending incoming friend requests.

**Parameters:** None

**Returns:**
```javascript
Promise<{
  success: boolean,
  data?: [
    {
      id: number,
      requester_id: string (UUID),
      receiver_id: string (UUID),
      status: 'pending',
      created_at: timestamp,
      requester: {
        id: string (UUID),
        username: string,
        avatar_url: string | null
      }
    },
    // ... more requests
  ],
  error?: string
}>
```

**Example:**
```javascript
const result = await getPendingFriendRequests();
if (result.success) {
  result.data.forEach(request => {
    console.log(`Request from ${request.requester.username}`);
    // Can call acceptFriendRequest(request.id) or rejectFriendRequest(request.id)
  });
}
```

---

## Activity APIs

---

## `getActiveFriendSessions()`

Get all friends' active workout sessions (from last 2 hours).

**Parameters:** None

**Returns:**
```javascript
Promise<{
  success: boolean,
  data?: [
    {
      id: number,
      user_id: string (UUID),
      workout_id: number,
      exercises: string | object (JSONB),
      duration: number,
      completed_at: timestamp,
      created_at: timestamp,
      friend: {
        id: string (UUID),
        username: string,
        avatar_url: string | null
      },
      isActive: boolean (true)
    },
    // ... more sessions
  ],
  error?: string
}>
```

**Example:**
```javascript
const result = await getActiveFriendSessions();
if (result.success) {
  result.data.forEach(session => {
    const exerciseCount = JSON.parse(
      typeof session.exercises === 'string' 
        ? session.exercises 
        : JSON.stringify(session.exercises)
    ).length;
    
    console.log(`${session.friend.username}: ${exerciseCount} exercises`);
  });
}
```

**Notes:**
- "Active" = created within last 2 hours (configurable)
- Ordered by most recent first
- Includes friend profile information
- Exercises may be JSON string or object (handle both)

---

## `getFriendActivity(friendUserId, limit = 10)`

Get specific friend's recent workout sessions.

**Parameters:**
- `friendUserId` (string, UUID) - Friend's UUID
- `limit` (number, optional) - Number of sessions to return (default: 10)

**Returns:**
```javascript
Promise<{
  success: boolean,
  data?: [
    {
      id: number,
      workout_id: number,
      exercises: string | object (JSONB),
      duration: number,
      completed_at: timestamp,
      created_at: timestamp
    },
    // ... more sessions (up to limit)
  ],
  error?: string
}>
```

**Example:**
```javascript
const result = await getFriendActivity('550e8400-e29b-41d4-a716-446655440000', 5);
if (result.success) {
  console.log(`Last 5 workouts: ${result.data.length}`);
}
```

**Errors:**
- `Not friends with this user` - No 'accepted' friendship
- `Not authenticated` - User not logged in

---

## Session Cloning APIs

---

## `createClonedSessionData(friendSession, workoutName = null)`

Create a local session object from friend's workout template.

**Parameters:**
- `friendSession` (object) - Session object from `getActiveFriendSessions()`
- `workoutName` (string, optional) - Custom name for cloned session

**Returns:**
```javascript
{
  exerciseSets: [
    {
      name: string,
      targetSets: number,
      targetReps: string | number,
      targetWeight: string | number,
      sets: [
        {
          id: number,
          completed: boolean (false),
          reps: string (empty),
          weight: string (empty)
        },
        // ... more sets
      ]
    },
    // ... more exercises
  ],
  currentExerciseIndex: number (0),
  currentSetIndex: number (0),
  workoutStartTime: number (Date.now()),
  workoutName: string,
  clonedFromFriendId: string (UUID),
  clonedFromSessionId: number
} | null (on error)
```

**Example:**
```javascript
const sessions = await getActiveFriendSessions();
if (sessions.success && sessions.data.length > 0) {
  const cloned = createClonedSessionData(
    sessions.data[0],
    'Copy of Alex\'s Workout'
  );
  
  if (cloned) {
    localStorage.setItem('trackd_active_session', JSON.stringify(cloned));
    // Now WorkoutPlayer can load the cloned session
  }
}
```

**Notes:**
- Returns null on error
- Automatically creates empty sets based on target count
- User will fill in their own reps/weights during workout
- Stores metadata about source friend and session

---

## Usage Patterns

### Pattern 1: Display Friend's List
```javascript
import { getFriendsList } from '../services/socialService';

const MyFriendsComponent = () => {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const loadFriends = async () => {
      const result = await getFriendsList();
      if (result.success) {
        setFriends(result.data);
      }
    };
    loadFriends();
  }, []);

  return (
    <div>
      {friends.map(friend => (
        <div key={friend.id}>
          {friend.avatar_url && <img src={friend.avatar_url} alt={friend.username} />}
          <span>{friend.username}</span>
        </div>
      ))}
    </div>
  );
};
```

### Pattern 2: Join Friend's Workout
```javascript
import { 
  getActiveFriendSessions, 
  createClonedSessionData 
} from '../services/socialService';

const handleJoinWorkout = async () => {
  const result = await getActiveFriendSessions();
  
  if (result.success && result.data.length > 0) {
    const session = result.data[0];
    const cloned = createClonedSessionData(session);
    
    if (cloned) {
      localStorage.setItem('trackd_active_session', JSON.stringify(cloned));
      setActiveWorkout({ name: cloned.workoutName, exercises: [] });
    }
  }
};
```

### Pattern 3: Handle Friend Requests
```javascript
import { 
  getPendingFriendRequests, 
  acceptFriendRequest 
} from '../services/socialService';

const FriendRequests = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const loadRequests = async () => {
      const result = await getPendingFriendRequests();
      if (result.success) {
        setRequests(result.data);
      }
    };
    loadRequests();
  }, []);

  const handleAccept = async (friendshipId) => {
    const result = await acceptFriendRequest(friendshipId);
    if (result.success) {
      setRequests(prev => prev.filter(r => r.id !== friendshipId));
    }
  };

  return (
    <div>
      {requests.map(req => (
        <button key={req.id} onClick={() => handleAccept(req.id)}>
          Accept {req.requester.username}
        </button>
      ))}
    </div>
  );
};
```

---

## Error Handling Best Practices

Always check the `success` flag:

```javascript
const result = await sendFriendRequest(userId);

if (!result.success) {
  // Handle error
  console.error('Friend request failed:', result.error);
  if (result.error.includes('Unique')) {
    // Already sent request
  } else if (result.error.includes('authenticated')) {
    // User not logged in
  }
} else {
  // Success
  console.log('Request sent:', result.data.id);
}
```

---

## Performance Considerations

1. **Caching**: Consider caching friend list (invalidate when friendship changes)
2. **Pagination**: Add pagination for large friend lists
3. **Polling**: Active sessions refresh every 30 seconds (configurable)
4. **Real-time**: Consider switching to Supabase Realtime subscriptions for live updates

---

## Data Types Reference

| Type | Format | Example |
|------|--------|---------|
| UUID | string | `550e8400-e29b-41d4-a716-446655440000` |
| timestamp | ISO 8601 | `2026-01-09T12:30:45.123Z` |
| JSONB | string or object | `"[{...}]"` or `[{...}]` |
| status | enum | `'pending' \| 'accepted' \| 'rejected' \| 'blocked'` |

---

## Related Components

- **ActiveFriendsBanner.jsx** - UI component using these APIs
- **Home.jsx** - Integration point for join workout feature
- **WorkoutPlayer.jsx** - Loads cloned session data

---

**Last Updated:** January 9, 2026
**Version:** 1.0
**Status:** Production Ready
