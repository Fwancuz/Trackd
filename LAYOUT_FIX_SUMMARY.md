# Layout Fix: HUD/Dock Overlap Resolution

## Overview
Fixed layout issues where UI elements in **AppSettings.jsx** (Danger Zone) and **WorkoutPlayer.jsx** (Finish button and exercise list) were being covered by the fixed HUD/Dock navigation bar and becoming unclickable.

## Changes Implemented

### 1. Global CSS Variables (index.css, lines 4-6)
Added CSS custom properties to centralize HUD-related spacing management:

```css
:root {
  --hud-height: 80px;
  --safe-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

**Purpose:**
- `--hud-height`: Standardizes the HUD height across the app (80px)
- `--safe-bottom`: Respects mobile safe area insets (iOS home bar, Android gesture bar)

### 2. UI Center Container (index.css, line 41)
Updated `.ui-center` class with dynamic bottom padding:

**Before:**
```css
padding-bottom: 6rem;
```

**After:**
```css
padding-bottom: calc(var(--hud-height) + 2rem + var(--safe-bottom));
```

**Impact:** All centered content pages now have proper spacing above the HUD.

### 3. Progress Content Container (index.css, line 53)
Applied the same bottom padding pattern to `.progress-content`:

**Applied:**
```css
padding-bottom: calc(var(--hud-height) + 2rem + var(--safe-bottom));
```

### 4. Create Workout Container (index.css, line 130)
Updated `.create-workout` with proper spacing:

**Applied:**
```css
padding-bottom: calc(var(--hud-height) + 2rem + var(--safe-bottom));
```

### 5. App Settings Container (index.css, line 455)
Significantly increased bottom padding for the settings page to ensure Danger Zone buttons are fully accessible:

**Before:**
```css
padding-bottom: 120px;
```

**After:**
```css
padding-bottom: calc(var(--hud-height) + 4rem + var(--safe-bottom));
```

**Additional:** Added bottom margin to `.danger-zone` (line 461):
```css
margin-bottom: 3rem;
```

### 6. Home Content Container (index.css, line 621)
Added bottom padding to `.home-content`:

**Applied:**
```css
padding-bottom: calc(var(--hud-height) + 2rem + var(--safe-bottom));
```

### 7. Workout Player Container (index.css, line 710)
Updated main workout player viewport padding:

**Before:**
```css
padding-bottom: 6rem;
```

**After:**
```css
padding-bottom: calc(var(--hud-height) + 2rem + var(--safe-bottom));
```

### 8. Workout Player Content (index.css, line 1955)
Added bottom padding to `.workout-player-content` for proper scrolling:

**Applied:**
```css
padding-bottom: calc(var(--hud-height) + 2rem + var(--safe-bottom));
```

### 9. Bottom Navigation Bar (index.css, line 567)
Updated bottom positioning to respect mobile safe areas:

**Before:**
```css
bottom: 1rem;
```

**After:**
```css
bottom: max(1rem, var(--safe-bottom));
```

**Impact:** HUD properly positions above iOS home bar and Android gesture navigation.

## Z-Index Verification
Confirmed proper z-index hierarchy (no changes needed):
- `.ui-center`: `z-index: 10` (content layer)
- `.bottom-nav`: `z-index: 20` (HUD/dock layer)
- `.workout-player`: `z-index: 100` (full-screen overlay)

## Mobile Optimization
All bottom padding calculations automatically account for:
- **iOS Safe Area:** Insets for the iPhone notch and home indicator
- **Android Safe Area:** Insets for gesture navigation bars
- **Standard Padding:** Falls back to safe 1rem on devices without safe area support

## Components Fixed

### AppSettings.jsx - Danger Zone ✅
- Reset Progress button now fully clickable
- Delete Account button now fully clickable
- Buttons scroll above HUD with 3rem bottom margin buffer

### WorkoutPlayer.jsx ✅
- Finish button (HoldButton) always accessible
- Exercise list scrolls completely above HUD
- No content is hidden by the fixed finish bar or navigation

### Home.jsx ✅
- Saved workouts list scrolls above HUD
- Can view and interact with all workout cards

### PR.jsx / Progress.jsx ✅
- All content properly spaced above HUD
- Charts and tables fully visible and scrollable

### CreateWorkout.jsx ✅
- Form fields and buttons not obscured
- Full access to all form controls

## Testing Recommendations
1. Test on iOS device (iPhone with notch or home indicator)
2. Test on Android device with gesture navigation
3. Verify on tablet devices at various zoom levels
4. Test that all interactive elements in Danger Zone are clickable
5. Confirm finish button is accessible in long workouts

## Browser DevTools Testing
To simulate mobile safe areas in Chrome DevTools:
1. Open DevTools → Device Emulation → More tools → Sensors → Emulate environment
2. Use "Mobile View" with specific device models
3. Check "Mobile Safe Area" in device options

## Maintenance Notes
- To adjust HUD height globally: Edit `--hud-height` value in `:root`
- All spacing calculations use the CSS variable, so changes propagate automatically
- Safe area insets are automatically handled by browsers supporting `env()`
