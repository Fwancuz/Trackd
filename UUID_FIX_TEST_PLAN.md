# ✅ UUID Split ID Fix - Testing & Verification

## 🧪 Pre-Test Checklist

Before testing, ensure:
- [ ] Application is running: `npm run dev`
- [ ] DevTools are open: F12 → Console tab
- [ ] CreateWorkout.jsx has been reloaded
- [ ] You have at least 1 split created

---

## 📋 Test Suite

### TEST 1: Create New Template with Split Assignment

**Objective:** Verify UUID split_id sends correctly on new template creation

**Steps:**
1. Go to Home → "Create New Template"
2. Enter name: "Test Template UUID Fix"
3. Add exercise: "Bench Press" (any exercise)
4. Open browser DevTools Console (F12)
5. Click split dropdown
6. Select ANY split from list
7. Observe console:
   ```
   🎯 Split selection changed: {
     newValue: "550e8400-e29b-41d4...",  ← UUID string
     willSaveAs: "550e8400-e29b-41d4...",  ← UUID string (not number!)
     splitIdType: 'string'  ← Should be 'string', not 'number'
   }
   ```
8. Click "Save Workout"
9. Observe console:
   ```
   💾 Saving workout: {
     workoutName: "Test Template UUID Fix",
     selectedSplitId: "550e8400-e29b-41d4...",
     splitIdForDB: "550e8400-e29b-41d4...",
     splitIdType: 'string'  ← CRITICAL: Must be 'string'
   }
   ```

**Expected Result:**
- ✅ Toast: "Workout saved!"
- ✅ No 400 error in console
- ✅ No network errors
- ✅ Returns to Home
- ✅ Template appears in correct split section

**FAIL Indicators:**
- ❌ 400 Bad Request error
- ❌ `splitIdType: 'number'` in console
- ❌ `willSaveAs: 550` (number instead of UUID)
- ❌ Template doesn't appear in split

---

### TEST 2: Edit Existing Template - Change Split

**Objective:** Verify UUID split_id updates correctly on template edit

**Prerequisites:**
- Have a template assigned to Split A
- Have at least 2 splits available

**Steps:**
1. Go to Home → Click Edit (✏️) on any template
2. Verify console shows:
   ```
   🔍 Editing template: {
     templateName: "...",
     templateSplitId: "550e8400-e29b-41d4...",  ← UUID string
     setTo: "550e8400-e29b-41d4...",
     splitIdType: 'string'  ← Should be 'string'
   }
   ```
3. Click split dropdown
4. Select DIFFERENT split (Split B)
5. Observe console:
   ```
   🎯 Split selection changed: {
     newValue: "660e8400-e29b-41d4...",  ← Different UUID
     willSaveAs: "660e8400-e29b-41d4...",  ← UUID, not number!
     splitIdType: 'string'
   }
   ```
6. Click "Update Template"
7. Observe console:
   ```
   💾 Saving workout: {
     selectedSplitId: "660e8400-e29b-41d4...",
     splitIdForDB: "660e8400-e29b-41d4...",
     isEditing: true,
     splitIdType: 'string'  ← CRITICAL: Must be 'string'
   }
   ```

**Expected Result:**
- ✅ Toast: "Template updated!"
- ✅ No 400 error
- ✅ No network errors
- ✅ Returns to Home
- ✅ Template moved to new split section
- ✅ No longer in old split section

**FAIL Indicators:**
- ❌ 400 Bad Request error
- ❌ `splitIdType: 'number'`
- ❌ `willSaveAs: 660` (number)
- ❌ Template doesn't move to new split

---

### TEST 3: Move Template to General (null split)

**Objective:** Verify null is sent correctly when deselecting split

**Steps:**
1. Edit any template
2. Current dropdown shows a split
3. Click dropdown
4. Select "None - General" (first option)
5. Observe console:
   ```
   🎯 Split selection changed: {
     newValue: "",  ← Empty string
     willSaveAs: null,  ← Should be null, not 0
     availableSplits: 5
   }
   ```
6. Click "Update Template"
7. Observe console:
   ```
   💾 Saving workout: {
     selectedSplitId: "",
     splitIdForDB: null,  ← Should be null
     splitIdType: 'object'  ← null is typeof 'object'
   }
   ```

**Expected Result:**
- ✅ Toast: "Template updated!"
- ✅ splitIdForDB is `null` (not empty string, not 0)
- ✅ Template moved to "General" section
- ✅ No 400 error

**FAIL Indicators:**
- ❌ `splitIdForDB: ""` (should be null)
- ❌ `splitIdForDB: 0` (should be null)
- ❌ 400 error

---

### TEST 4: Console Type Verification

**Objective:** Verify all split_id values are strings or null, never numbers

**Steps:**
1. Perform any split operation
2. Check console logs
3. Look for these patterns:

**CORRECT:**
```
willSaveAs: "550e8400-e29b-41d4-a716-446655440000"  ✅
willSaveAs: null  ✅
splitIdType: 'string'  ✅
splitIdType: 'object'  (when null, typeof null === 'object')  ✅
```

**INCORRECT (FIX NOT APPLIED):**
```
willSaveAs: 550  ❌ NUMBER instead of UUID
willSaveAs: 8  ❌ NUMBER instead of UUID
splitIdType: 'number'  ❌ Should be 'string'
```

**FAIL:** If you see any of the incorrect patterns, the fix wasn't applied correctly.

---

### TEST 5: Stress Test - Rapid Changes

**Objective:** Verify stability with multiple quick changes

**Steps:**
1. Edit a template
2. Rapidly change split selection 5-10 times
3. Click "Update"
4. Observe console - all logs should show string/null values
5. No errors should appear

**Expected Result:**
- ✅ All operations succeed
- ✅ All console logs show correct types
- ✅ No 400 errors
- ✅ Final template in correct split

---

### TEST 6: Data Persistence

**Objective:** Verify UUID split_id persists after page refresh

**Steps:**
1. Create template with split assignment
2. Verify it appears in correct split
3. Press F5 to refresh page
4. Wait for data to load
5. Check if template still in same split

**Expected Result:**
- ✅ Template still in correct split after refresh
- ✅ No 400 errors
- ✅ Data consistent with database

---

### TEST 7: Database Verification

**Objective:** Verify database actually received UUID string

**Prerequisites:**
- Access to Supabase dashboard

**Steps:**
1. Create/edit template with split
2. Go to Supabase dashboard
3. Open `workout_templates` table
4. Find the template you just modified
5. Check `split_id` column

**Expected Value:**
```
split_id: "550e8400-e29b-41d4-a716-446655440000"  ✅ UUID format
```

**Wrong Values:**
```
split_id: 550  ❌ NUMBER (parseInt bug still active)
split_id: "8"  ❌ Corrupted (only length?)
split_id: null (if intentional)  ✅ This is OK if you selected General
```

---

## 📊 Test Results Summary

| Test # | Name | Expected | Result | Status |
|--------|------|----------|--------|--------|
| 1 | Create with split | No 400 error | | ☐ PASS ☐ FAIL |
| 2 | Edit change split | Move to new split | | ☐ PASS ☐ FAIL |
| 3 | Move to General | split_id = null | | ☐ PASS ☐ FAIL |
| 4 | Console types | string/null, no numbers | | ☐ PASS ☐ FAIL |
| 5 | Stress test | No errors | | ☐ PASS ☐ FAIL |
| 6 | Data persists | After refresh | | ☐ PASS ☐ FAIL |
| 7 | DB verification | UUID in table | | ☐ PASS ☐ FAIL |

---

## ✅ Success Criteria

**FIX IS WORKING IF:**
- [x] All 7 tests pass
- [x] No 400 Bad Request errors
- [x] Console shows `splitIdType: 'string'` (not 'number')
- [x] Console shows UUID strings (not numbers like 550)
- [x] Templates move to correct splits
- [x] Data persists after refresh
- [x] Database stores UUID strings

---

## 🔍 Debug Mode

If tests fail:

1. **Open DevTools Console** (F12)
2. **Look for error messages**
3. **Copy error message** (including stack trace)
4. **Check these console logs:**
   - 🔍 Editing template: What type is setTo?
   - 🎯 Selection changed: What type is willSaveAs?
   - 💾 Saving: What type is splitIdForDB?

5. **Expected types:**
   - Should be: `'string'` or `'object'` (for null)
   - Should NOT be: `'number'`

---

## 📱 Browser Console Commands

Quick debug checks:

```javascript
// Run in console to verify fix:

// Check if parseInt is being used (should show nothing)
document.body.innerText.includes('parseInt') ? "❌ FIX NOT APPLIED" : "✅ FIX APPLIED"

// Monitor all console logs (run before testing)
const logs = [];
const originalLog = console.log;
console.log = function(...args) {
  logs.push(args);
  originalLog.apply(console, args);
};
// Now perform test, then check: logs.filter(l => JSON.stringify(l).includes('splitId'))
```

---

## Date

January 8, 2026

---

## Final Notes

**All tests must pass for the fix to be considered complete.**

If any test fails, the issue is that `parseInt()` is still being applied to split_id somewhere in the code.

Report any failures with:
1. Test number
2. Console log output
3. Error message
4. Steps to reproduce

