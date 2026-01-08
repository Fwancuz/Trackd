# Workout Splits - Quick Start Guide

## What's New?

You can now organize your workouts into **Splits** (Categories). Start with a completely empty system - create splits as you need them!

---

## Quick Actions

### 🆕 Create Your First Split
1. Go to **Home** → **Your Plans** tab
2. Click **+ Split** button (top right)
3. Type split name (e.g., "Push Day", "Leg Day")
4. Press Enter or click **Add**
5. Split appears as a new section

### 📝 Create a Workout
1. Go to **Create** tab
2. Enter workout name
3. **NEW:** Select a **Split** from dropdown (or leave "None - General")
4. Add exercises and click **Save**
5. Workout appears under the selected split

### ✏️ Move Workout to Different Split
1. Go to **Home** → Click **[⋯]** on workout
2. Click **Edit**
3. Change **Split** dropdown to different category
4. Click **Update**
5. Workout instantly moves to new split

### 🗑️ Delete a Split
1. Go to **Home** → Hover over split header
2. Click **🗑️** trash icon
3. Confirm deletion
4. ✅ All workouts in that split move to **General** section
5. ✅ Workouts are NOT deleted, only uncategorized

### 🗑️ Delete a Workout
1. Go to **Home** → Click **[⋯]** on workout
2. Click **Delete**
3. Confirm deletion
4. Workout is removed

---

## Understanding the Sections

### Empty State
```
[No splits, No workouts]
┌──────────────────────────────┐
│ Start by creating your       │
│ first plan!                  │
│                              │
│ + Create New Template        │
│ + Create Your First Split    │
└──────────────────────────────┘
```

### General Section (Uncategorized)
```
├─ General
│  │ Cardio                    [⋯] [▶]
│  │ Stretching                [⋯] [▶]
```
Workouts without a split appear here automatically.

### Split Sections
```
├─ Push Day                          [🗑]
│  │ Chest & Triceps          [⋯] [▶]
│  │ Shoulder Press            [⋯] [▶]

├─ Pull Day                          [🗑]
│  │ Back & Biceps             [⋯] [▶]
│  │ Lat Pulldowns             [⋯] [▶]
```
Each split shows its own section with trash icon for deletion.

---

## Pro Tips

✅ **What You Can Do:**
- Create unlimited splits
- Move workouts between splits by editing
- Delete splits without losing workouts
- Rename workouts after assigning to splits
- Have workouts in "General" section forever

❌ **What You CAN'T Do:**
- Automatically create default splits (must create manually)
- Delete "General" section (it's always there)
- Lose workouts when deleting a split (they move to General)

---

## Keyboard Shortcuts

- **Enter** while creating split → Save split
- **Esc** while creating split → Cancel

---

## Common Questions

**Q: What happens if I delete a split?**
A: All workouts in that split move to "General" section. They're not deleted.

**Q: Can I have workouts without a split?**
A: Yes! They appear in "General" section.

**Q: Can I rename a split?**
A: Not yet - delete and recreate with new name. (Future feature coming)

**Q: Can I reorder splits?**
A: Currently shown in creation order. (Future feature coming)

**Q: What if I want to try splits but not use them?**
A: Just don't create any! System defaults to "General" section.

---

## Languages Supported

- 🇬🇧 **English** - "Split", "None - General", "Delete Split"
- 🇵🇱 **Polish** - "Kategoria", "Brak - Ogólne", "Usuń Kategorię"

Select language in **Settings** → **Language**

---

## File Structure Changes

**Database:**
- ✅ New table: `workout_splits`
- ✅ Updated table: `workout_templates` (added `split_id` column)

**Code:**
- ✅ Updated: `supabaseClient.js` (CRUD functions)
- ✅ Updated: `Home.jsx` (display & management)
- ✅ Updated: `CreateWorkout.jsx` (split assignment)
- ✅ Updated: `App.jsx` (props passing)
- ✅ Updated: `translations.js` (i18n support)

---

## Need Help?

Check `WORKOUT_SPLITS_IMPLEMENTATION.md` for:
- Detailed architecture
- API reference
- Technical details
- Troubleshooting guide
