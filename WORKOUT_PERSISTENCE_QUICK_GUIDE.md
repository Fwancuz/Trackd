# 🚀 Quick Guide: Workout Persistence Fix

## TL;DR - Co się zmieniło?

### Home.jsx
**Added**: Focus/Visibility listener (55 lines)
- Nasłuchuje na `visibilitychange` i `focus` events
- Synchronizuje `activeWorkout` z localStorage na powrót do aplikacji
- Zapobiega "ghost" workouts poprzez usunięcie sierocych sesji

**Enhanced**: onCancel callback
- Dodane explicit localStorage cleanup
- Dodane onRefreshCompletedSessions() call

### WorkoutPlayer.jsx
**Verified**: Nie zmienione
- finishWorkout() już prawidłowo czyszcze localStorage
- handleCancelWorkout() już prawidłowo czyszcze localStorage

## 🎯 Rozwiązane Problemy

```
BEFORE:
- Trening "zasypiał" - po wybudzeniu telefonu nie synchronizował się
- Powracające "duchy" - stare treningu wracały bez powodu

AFTER:
- ✅ Focus listener synchronizuje automatycznie
- ✅ localStorage jest zawsze czyszczony
- ✅ Ghost workouts są detektowane i usuwane
```

## 📝 Implementation Details

### Focus/Visibility Sync
**Plik**: `src/Home.jsx` (linia ~57)

```javascript
// Nasłuchuje na powrót do aplikacji
document.addEventListener('visibilitychange', handleFocusOrVisibility);
window.addEventListener('focus', handleFocusOrVisibility);

// Sprawdza localStorage i synchronizuje state
const savedSession = localStorage.getItem('trackd_active_session');
if (savedSession) {
  setActiveWorkout({ ... }); // Restore
} else if (activeWorkout) {
  setActiveWorkout(null); // Clear ghost
}
```

### Enhanced Cancel Flow
**Plik**: `src/Home.jsx` (linia ~288)

```javascript
onCancel={() => {
  setActiveWorkout(null);
  localStorage.removeItem('trackd_active_session');
  if (onRefreshCompletedSessions) {
    onRefreshCompletedSessions();
  }
}}
```

## ✅ Testing Checklist

- [ ] Start workout
- [ ] Switch to another app (simulates sleep)
- [ ] Switch back - trening should still be active
- [ ] Cancel workout - localStorage should be empty
- [ ] Refresh page - no ghost workout
- [ ] Complete workout - localStorage should be empty

## 🔍 Files Modified

| File | Lines Changed | Type |
|------|--------------|------|
| src/Home.jsx | +55 new, ~5 modified | Focus listener + enhanced onCancel |
| src/WorkoutPlayer.jsx | 0 | Verified, no changes needed |

## 📚 Related Storage Keys

```javascript
'trackd_active_session' // Active workout session (WorkoutPlayer)
'trackd_recovered_session' // Recovered session on app start (App.jsx)
```

## 🎓 Architecture Pattern

```
User Opens App
    ↓
App.jsx checks localStorage for 'trackd_active_session'
    ├─ Found → setRecoveredSession (passed to Home)
    └─ Not found → continue
    ↓
Home.jsx renders
    ├─ If recoveredSession → render WorkoutPlayer
    └─ If no recovered → render Plans
    ↓
PHONE SLEEP / APP SWITCH
    ↓
User Returns to App
    ↓
document.visibilitychange or window.focus triggered
    ↓
Home.jsx focus listener checks localStorage again
    ├─ Session exists → setActiveWorkout (restore UI)
    ├─ No session + activeWorkout set → setActiveWorkout(null) (clear ghost)
    └─ No session + no activeWorkout → do nothing
    ↓
WorkoutPlayer renders with restored state
```

## 🚀 Deployment

No additional configuration needed:
- Build command unchanged: `npm install --legacy-peer-deps && npm run build`
- No new dependencies added
- No environment variables needed
- Backward compatible with existing data

## 💡 Key Insight

Problem był lifecycle issue - komponenty znikały/rehydratowały bez sprawdzenia localStorage. Solution nasłuchuje na visibility/focus changes i natychmiast synchronizuje state. To zapewnia seamless experience zarówno dla snu telefonu jak i tab switches.
