# 400 Error Fix - Quick Reference

## Problem
Code was trying to save/fetch non-existent columns: `template_name` and `total_volume`

## Solution Summary

### 1️⃣ Save Structure (WorkoutPlayer.jsx → App.jsx)
```javascript
// NOW SAVES ONLY THESE FIELDS:
{
  user_id: uuid,
  workout_id: uuid,
  completed_at: timestamp,
  exercises: {
    name: "Workout Name",        // ← Name stored as metadata
    data: [
      {
        exercise: "Bench Press",
        sets: [
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 }
        ]
      }
    ]
  },
  duration: seconds
}
```

### 2️⃣ Load Structure (RecentHistory.jsx, Home.jsx)
```javascript
// Fetch ONLY existing columns
.select('id, user_id, workout_id, completed_at, exercises, duration, created_at')

// Extract data:
const workoutName = session.exercises.name
const volume = calculateFromExercisesData(session.exercises.data)
const date = session.completed_at
```

---

## Files Changed

| File | Change | Purpose |
|------|--------|---------|
| `WorkoutPlayer.jsx` | Wrap exercises with metadata | Store name in JSON |
| `App.jsx` | Remove template_name/total_volume saves | Only save valid columns |
| `RecentHistory.jsx` | Extract name & volume from exercises JSON | Display from metadata |
| `Home.jsx` | Handle {name, data} structure | Calculate volume correctly |
| `useWorkoutHistory.js` | Remove join query, extract from JSON | No database query needed |
| `index.html` | (No change needed) | PWA metadata already present |

---

## Test Cases

✅ Create new workout → should save without 400 error
✅ View history → should show correct name and volume
✅ Check lifetime stats → should calculate all volumes
✅ See success message → "Brawo! Twoje [X] kg właśnie zasiliło statystyki!"
✅ Restart app → no data corruption or flicker

---

## Key Functions

### Volume Calculation
```javascript
const calculateVolumeFromExercises = (exercises) => {
  let exercisesData = exercises;
  if (exercises?.data && Array.isArray(exercises.data)) {
    exercisesData = exercises.data;
  }
  
  let total = 0;
  exercisesData?.forEach(ex => {
    ex.sets?.forEach(set => {
      total += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
    });
  });
  return total;
};
```

### Name Extraction
```javascript
const getWorkoutNameFromExercises = (exercises) => {
  return exercises?.name || 'Unknown Workout';
};
```

---

## Data Integrity

✅ No data loss - name and volume preserved in exercises JSON
✅ Backwards compatible - can handle old array structure too
✅ No join queries - faster loading, fewer network calls
✅ No flicker - data calculated from actual database structure
✅ Atomic saves - all data in one exercises JSON field

---

**Last Updated:** January 5, 2026
**Status:** ✅ Ready for testing
