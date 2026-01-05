# Workout History Feature - Quick Developer Reference

## Quick Start

### Using the Feature
1. Navigate to Home tab
2. Click "History" tab (Clock icon)
3. View list of completed workouts
4. Delete by:
   - Tapping trash icon
   - Swiping left on mobile (50+ pixel swipe)

### Adding to Your Component
```jsx
import RecentHistory from './RecentHistory';
import { useWorkoutHistory } from './useWorkoutHistory';

// In your component:
const { deleteSession } = useWorkoutHistory(userId);

<RecentHistory
  completedSessions={completedSessions}
  onDeleteSession={deleteSession}
  language={language}
  onRefreshStats={() => {
    // Refresh stats after deletion
    fetchCompletedSessions();
  }}
/>
```

---

## API Reference

### useWorkoutHistory(userId)

```javascript
const {
  history,               // Array<SessionObject>
  loading,              // boolean
  error,                // string | null
  fetchHistory,         // () => Promise<Array>
  deleteSession,        // (sessionId: number) => Promise<boolean>
  calculateTotalVolume, // () => number
  setHistory           // (data: Array) => void
} = useWorkoutHistory(userId);
```

### SessionObject
```typescript
{
  id: number
  sessionId: number
  templateName: string
  workoutId: number
  completedAt: string (ISO)
  exercises: Array
  duration: number (seconds)
  totalVolume: number (kg)
  createdAt: string (ISO)
}
```

### RecentHistory Props
```typescript
interface RecentHistoryProps {
  completedSessions: SessionObject[]
  onDeleteSession: (sessionId: number) => Promise<boolean>
  language: 'en' | 'pl'
  onRefreshStats: () => void
}
```

---

## File Structure

```
src/
├── useWorkoutHistory.js      ← Custom hook for data management
├── RecentHistory.jsx         ← Main UI component
├── Home.jsx                  ← Integration point
├── App.jsx                   ← Props provider
└── index.css                 ← Styles (.recent-history, .history-*)
```

---

## CSS Classes

**Use these classes for custom styling:**

```css
.recent-history              /* Main container */
.history-title               /* Section title */
.history-list                /* Item list container */
.history-item                /* Individual item */
.history-item-content        /* Content wrapper */
.history-item-header         /* Title + delete button */
.history-template-name       /* Workout name */
.history-delete-btn          /* Delete button */
.history-item-details        /* Date + volume */
.history-date                /* Formatted date */
.history-volume              /* Total volume display */
.history-duration            /* Session duration */
.history-empty-state         /* Empty state message */
.history-footer              /* Help text footer */
```

---

## Customization Examples

### Change Delete Button Icon
In `RecentHistory.jsx`:
```jsx
// Instead of Trash2:
import { X, Delete, Trash, TrashIcon } from 'lucide-react';

<Trash2 size={18} strokeWidth={1.5} />
// Change to:
<X size={18} strokeWidth={1.5} />
```

### Adjust Swipe Sensitivity
In `RecentHistory.jsx`, change the threshold:
```javascript
// Current: 50 pixels
if (diff > 50) { /* trigger delete */ }

// Make more sensitive: 30 pixels
if (diff > 30) { /* trigger delete */ }

// Make less sensitive: 80 pixels
if (diff > 80) { /* trigger delete */ }
```

### Change Date Format
In `RecentHistory.jsx`:
```javascript
// Current: "Jan 5, 2026"
date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

// Option: Show full month "January 5, 2026"
// Change 'short' to 'long'
```

### Customize Colors
In `index.css`:
```css
.history-volume {
  color: #10b981;        /* Green - change to desired color */
}

.history-delete-btn:hover {
  color: #ef4444;        /* Red - change to desired color */
}

.history-item {
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, ...)
  /* Adjust background colors */
}
```

### Adjust List Height
In `index.css`:
```css
.history-list {
  max-height: 60vh;      /* Current: 60% of viewport height */
  /* Change to: 50vh, 80vh, or specific pixels like 400px */
}
```

---

## Common Issues & Solutions

### Issue: Delete button not responding
**Solution:** Check that `onDeleteSession` is properly passed and `userId` is defined
```javascript
// Debug log
console.log('userId:', userId);
console.log('deleteSession function:', deleteSession);
```

### Issue: Stats not updating after deletion
**Solution:** Ensure `onRefreshCompletedSessions` is called
```javascript
onRefreshStats={() => {
  setStatsRefreshKey(prev => prev + 1);
  if (onRefreshCompletedSessions) {
    onRefreshCompletedSessions();  // ← This must be defined
  }
}}
```

### Issue: Swipe not working on mobile
**Solution:** Verify touch events are firing
```javascript
// Add to RecentHistory.jsx for debugging
const handleTouchStart = (e, sessionId) => {
  console.log('Touch start:', e.touches[0].clientX);
  setTouchStart(e.touches[0].clientX);
};
```

### Issue: Confirmation modal not showing
**Solution:** Check that ConfirmModal props are correct
```javascript
<ConfirmModal
  isOpen={deleteModal.isOpen}           // Must be true
  title={...}                            // Must be defined
  message={...}                          // Must be defined
  onConfirm={handleConfirmDelete}       // Must be defined
  onCancel={() => {...}}                // Must be defined
  isDangerous={true}
/>
```

### Issue: History list not scrolling
**Solution:** Check CSS - max-height and overflow
```css
.history-list {
  max-height: 60vh;          /* Must be set */
  overflow-y: auto;          /* Must be auto or scroll */
  padding-right: 0.5rem;     /* Prevent scrollbar overlap */
}
```

---

## Performance Tips

1. **Lazy Load History** - Only fetch when History tab opens
   ```javascript
   // Current implementation already does this via completedSessions prop
   ```

2. **Memoize Calculations** - Already done in Home.jsx
   ```javascript
   const { totalLifetimeVolume, totalSessions } = useMemo(() => {
     // ...calculations...
   }, [completedSessions]);
   ```

3. **Debounce Delete Calls** - Prevent double-clicking
   ```javascript
   // Already handled by modal confirmation
   ```

4. **Cache Template Names** - Use workout_templates join
   ```javascript
   // Already implemented in useWorkoutHistory hook
   ```

---

## Testing Checklist

```javascript
// Test basic rendering
test('RecentHistory renders with sessions', () => {
  const sessions = [
    { id: 1, templateName: 'Push Day', completedAt: '2026-01-05T10:00:00Z', totalVolume: 500 }
  ];
  // Render and assert
});

// Test delete flow
test('Delete modal opens on trash click', () => {
  // Click trash icon
  // Assert modal.isOpen === true
});

// Test swipe gesture
test('Swipe left triggers delete', () => {
  // Simulate touch with 60px left swipe
  // Assert modal.isOpen === true
});

// Test confirmation
test('Confirmation calls onDeleteSession', () => {
  const mockDelete = jest.fn().mockResolvedValue(true);
  // Click confirm
  // Assert mockDelete was called
});

// Test stats refresh
test('Stats refresh called after deletion', () => {
  const mockRefresh = jest.fn();
  // Delete session
  // Assert mockRefresh was called
});
```

---

## Database Schema Reference

The feature uses these Supabase tables:

### completed_sessions
```sql
id              bigint (PK)
user_id         uuid (FK to auth.users)
workout_id      bigint (FK to workout_templates)
completed_at    timestamp
exercises       jsonb
duration        integer
created_at      timestamp
```

**RLS Policies Required:**
- SELECT: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

---

## Internationalization

Add new language support:

1. Update `translations.js`:
```javascript
const translations = {
  en: { ... },
  pl: { ... },
  es: {
    // Add Spanish translations
  }
};
```

2. Use in component:
```javascript
const t = translations[language];
<h2>{t.recentSessions}</h2>
```

---

## Mobile Optimization

The feature is optimized for mobile with:

- **Touch Targets**: 44×44px minimum (48×48px on mobile)
- **Swipe Gesture**: 50+ pixel left swipe triggers delete
- **Responsive Text**: Scales from 0.7rem to 1rem
- **Scrolling**: Native mobile scroll with custom scrollbar
- **Safe Area**: Respects env(safe-area-inset-bottom)

---

## Accessibility Features

- **ARIA Labels**: `aria-label="Delete workout"`
- **Keyboard Navigation**: All buttons accessible with Tab
- **Color Contrast**: ✓ WCAG AA compliant
- **Focus States**: Visible focus indicators on buttons
- **Language Support**: Polish + English

---

**Last Updated: January 5, 2026**
