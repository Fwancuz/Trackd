# Workout Splits System Implementation Guide

## Overview

A complete **Workout Splits** (Categories) system has been implemented for the `workout_templates` table. This system allows users to organize their workout plans into custom categories called "Splits". The system starts completely empty - no default splits or example data are created.

---

## Database Architecture

### New Table: `workout_splits`
```sql
CREATE TABLE public.workout_splits (
    id bigint PRIMARY KEY AUTO_INCREMENT,
    user_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW()
)
```

**Key Features:**
- Each split is owned by a specific user (`user_id`)
- Splits are ordered by creation date
- Full Row Level Security (RLS) enabled

### Updated Table: `workout_templates`
The `workout_templates` table now includes:
- `split_id` column (nullable) - Links template to a split
- Foreign key constraint: `ON DELETE SET NULL` - When a split is deleted, templates are set to `split_id = NULL`

---

## API Functions (supabaseClient.js)

### Available CRUD Operations

#### 1. Fetch User Splits
```javascript
const splits = await fetchUserSplits(userId);
```
Returns all splits for the current user, ordered by creation date.

#### 2. Create New Split
```javascript
const newSplit = await createSplit(userId, "Push Day");
// Returns: { id, user_id, name, created_at, updated_at }
```

#### 3. Update Split
```javascript
const updated = await updateSplit(splitId, "New Name");
// Returns the updated split object
```

#### 4. Delete Split
```javascript
const success = await deleteSplit(splitId);
```
**Important:** Deleting a split automatically moves all associated workouts to the "General" section by setting their `split_id` to `NULL`.

#### 5. Assign Template to Split
```javascript
const template = await assignTemplateToSplit(templateId, splitId);
// Pass NULL as splitId to unassign from split
```

---

## User Interface

### Home Screen - Workout Plans Tab

#### Display Logic

**Case 1: No Splits & No Workouts**
```
┌─────────────────────────────────┐
│  Start by creating your first   │
│           plan!                 │
│                                 │
│  [+ Create New Template]        │
│  [+ Create Your First Split]    │
└─────────────────────────────────┘
```

**Case 2: Workouts But No Splits**
```
┌─────────────────────────────────┐
│ ├─ General                      │
│ │  ┌───────────────────────────┐│
│ │  │ Chest & Triceps      [⋯] ││
│ │  │ 6 exercises          [▶] ││
│ │  └───────────────────────────┘│
│ │  ┌───────────────────────────┐│
│ │  │ Leg Day              [⋯] ││
│ │  │ 5 exercises          [▶] ││
│ │  └───────────────────────────┘│
│                                 │
│  [+ Create New Template]        │
└─────────────────────────────────┘
```

**Case 3: With Splits**
```
┌─────────────────────────────────┐
│ [+ Split]                       │
│                                 │
│ ├─ Push Day              [🗑]   │
│ │  ┌───────────────────────────┐│
│ │  │ Upper Push           [⋯] ││
│ │  │ 4 exercises          [▶] ││
│ │  └───────────────────────────┘│
│ │  ┌───────────────────────────┐│
│ │  │ Lower Push           [⋯] ││
│ │  │ 3 exercises          [▶] ││
│ │  └───────────────────────────┘│
│                                 │
│ ├─ Pull Day              [🗑]   │
│ │  ┌───────────────────────────┐│
│ │  │ Back & Biceps        [⋯] ││
│ │  │ 5 exercises          [▶] ││
│ │  └───────────────────────────┘│
│                                 │
│ ├─ General                      │
│ │  ┌───────────────────────────┐│
│ │  │ Cardio               [⋯] ││
│ │  │ 2 exercises          [▶] ││
│ │  └───────────────────────────┘│
│                                 │
│  [+ Create New Template]        │
└─────────────────────────────────┘
```

### Features

#### Add Split Button
- Located at the top right of the "Your Plans" section
- Opens a simple input field with "Add" and "Cancel" buttons
- Once added, the split appears as a new section header
- Split headers use: `bg-[var(--card)]` with `border-l-4 border-[var(--accent)]`

#### Delete Split
- Small trash icon appears on split header (right side)
- Clicking shows confirmation modal
- Modal explains that workouts will move to "General" section
- Does NOT delete the workouts themselves

#### Split Management Modal
```
┌──────────────────────────────────┐
│  Delete Split                    │
├──────────────────────────────────┤
│  Are you sure you want to delete │
│  the split "Push Day"?           │
│  Workouts in this split will be  │
│  moved to "General" section.     │
│                                  │
│         [Delete]  [Cancel]       │
└──────────────────────────────────┘
```

---

## Create/Edit Workout Screen

### New Split Assignment Dropdown

Located below the workout name input:
```
┌──────────────────────────────────┐
│ Workout Name                     │
│ ┌──────────────────────────────┐ │
│ │ My Workout               [🔽] │ │
│ └──────────────────────────────┘ │
│                                  │
│ Split (optional)                 │
│ ┌──────────────────────────────┐ │
│ │ None - General           [🔽] │ │
│ └──────────────────────────────┘ │
│                                  │
│ [Exercises...]                   │
└──────────────────────────────────┘
```

### Dropdown Options
- **None - General** (default) - Workout appears in "General" section
- **[Split Name 1]** - Workout appears under "Split Name 1" section
- **[Split Name 2]** - Workout appears under "Split Name 2" section
- etc. (all user's splits dynamically loaded)

**Dynamic Loading:**
- Dropdown is automatically populated with user's splits
- Updates in real-time when new splits are created
- Respects user's split list from Supabase

---

## Responsive Design

### Mobile (< 640px)
- Split headers remain full-width with clear visual separation
- Delete icon (trash) scales appropriately
- Input fields are touch-friendly (larger tap targets)
- Add Split button becomes a floating action or header button
- Workout cards maintain grid layout or stack into single column

### Tablet (640px - 1024px)
- 2-column template grid per split section
- Comfortable spacing between elements
- All interactive elements remain accessible

### Desktop (> 1024px)
- 3-column template grid per split section
- Optimized use of horizontal space
- Full visual hierarchy with split sections clearly separated

---

## Workflow Examples

### Example 1: Creating First Split and Workout
1. User opens "Your Plans" tab
2. Sees empty state with two buttons
3. Clicks "+ Create Your First Split"
4. Types "Push Day" and presses Enter
5. Split appears as a new section with empty state
6. User clicks "+ Create New Template"
7. Fills in workout details and selects "Push Day" from Split dropdown
8. Saves workout → appears under "Push Day" section

### Example 2: Moving Workout Between Splits
1. User opens existing workout for editing
2. Changes split assignment from "Push Day" to "Pull Day"
3. Saves changes
4. Workout immediately moves to "Pull Day" section on home screen

### Example 3: Deleting a Split
1. User hovers over "Push Day" split header
2. Clicks trash icon
3. Confirmation modal appears
4. User clicks "Delete"
5. All workouts in "Push Day" move to "General" section
6. "Push Day" section disappears from home screen

---

## Key Behaviors & Safety

### ✅ What Happens When You Delete a Split
- ✓ Split is removed from the database
- ✓ All templates with `split_id` matching the deleted split are updated to `split_id = NULL`
- ✓ Workouts appear in "General" section
- ✓ No workout data is lost

### ✅ What Happens When You Delete a Workout
- ✓ Only that workout is deleted
- ✓ Split remains intact
- ✓ Other workouts in the split are unaffected

### ✅ What Happens When You Edit a Workout
- ✓ You can change the workout's split assignment
- ✓ Previous split assignment is ignored
- ✓ Workout updates in Supabase with new `split_id`
- ✓ UI immediately reflects the change

### ❌ What Does NOT Happen
- ✗ Splits are never created by default
- ✗ Sample/example data is never added
- ✗ Workouts are never deleted when you delete a split
- ✗ "General" section cannot be deleted

---

## Technical Implementation Details

### State Management (Home.jsx)
```javascript
const [splits, setSplits] = useState([]);
const [showAddSplit, setShowAddSplit] = useState(false);
const [newSplitName, setNewSplitName] = useState('');
const [deleteSplitModal, setDeleteSplitModal] = useState({...});
```

### Grouped Templates (useMemo)
```javascript
const groupedTemplates = useMemo(() => {
  // Groups templates by split_id
  // Creates sections for each split + "uncategorized" section
  // Returns object: { splitId: { split, templates: [...] } }
}, [templates, splits]);
```

### CreateWorkout.jsx Updates
- Receives `userId` prop from App.jsx
- Fetches user's splits on mount
- Includes split dropdown in form
- Saves `split_id` when creating/updating templates

---

## Migration Notes

If you had existing workout templates before this implementation:
1. All existing templates will have `split_id = NULL` (no migration script needed)
2. They will appear in the "General" section
3. You can manually assign them to splits by editing each workout
4. No data loss occurs

---

## Internationalization (i18n)

New translation keys added:
- English: `splitAssignment: 'Split (optional)'`, `noneGeneral: 'None - General'`
- Polish: `splitAssignment: 'Kategoria (opcjonalnie)'`, `noneGeneral: 'Brak - Ogólne'`

Split-related UI strings dynamically use `language` prop from context.

---

## Future Enhancements (Optional)

Potential features that could be added:
- Edit split name (rename)
- Reorder splits (drag and drop)
- Bulk assign workouts to splits
- Split templates (copy entire split with all workouts)
- Split statistics (total volume per split)
- Default split selection for new workouts

---

## Troubleshooting

### "Split dropdown is empty"
- Ensure you're logged in and have a valid `user_id`
- Create at least one split first before creating workouts
- Check browser console for API errors

### "Split not appearing in home screen"
- Verify the split was created successfully (check database)
- Refresh the page to reload data from Supabase
- Check that workouts have correct `split_id` in database

### "Workout not moving when I change splits"
- Save the workout form (don't just navigate away)
- Check network tab to ensure update request succeeded
- Refresh home screen to reload data

---

## Summary

The Workout Splits system is now fully integrated into the app, providing:
- ✅ Complete CRUD for splits
- ✅ Dynamic grouping of workouts by split
- ✅ Intuitive UI with clear visual separation
- ✅ Full safety (no accidental deletion of workouts)
- ✅ Mobile-responsive design
- ✅ Multi-language support
- ✅ Empty-start approach (no default data)

The implementation is production-ready and can be deployed immediately.
