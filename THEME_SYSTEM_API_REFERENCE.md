# System Motywów - Referencyjna API

## Publiczne API

### useTheme() Hook

```typescript
function useTheme(): ThemeContextValue
```

**Zwraca:**
```typescript
{
  theme: 'classic' | 'professional' | 'metal',
  switchTheme: (newTheme: string) => Promise<void>,
  loading: boolean,
  error: string | null,
  themeInfo: ThemeInfo,
  availableThemes: ThemeInfo[]
}
```

### ThemeInfo Interface

```typescript
interface ThemeInfo {
  id: string;
  name: string;
  bg: string;           // Hex color
  card: string;         // Hex color
  text: string;         // Hex color
  accent: string;       // Hex color
}
```

## Internal API

### ThemeProvider Props

```typescript
interface ThemeProviderProps {
  children: React.ReactNode,
  user: {
    id: string,
    // ... inne properties
  }
}
```

### Database Schema

**Tabela:** `user_settings`

```sql
ALTER TABLE public.user_settings 
ADD COLUMN theme text DEFAULT 'classic';

-- Constraints
CHECK (theme IN ('classic', 'professional', 'metal'))
```

## CSS Variables

### Available Variables

```css
/* Color Variables */
--bg              /* Background color */
--card            /* Card/Panel background */
--text            /* Text color */
--accent-color    /* Primary accent color */
--border          /* Border color */

/* Layout Variables */
--hud-height      /* Navigation bar height (80px) */
--safe-bottom     /* Safe area for notch/rounded corners */
--radius          /* Border radius (0px) */

/* Legacy Variables */
--bg-app          /* Alias for --bg-app (old) */
--bg-card         /* Alias for old card background */
--text-main       /* Alias for old text color */
--accent          /* Alias for old accent */
```

### Theme Values

#### Classic Theme (Default)
```css
:root {
  --bg: #050505;           /* Very dark gray/black */
  --card: #121212;         /* Slightly lighter black */
  --text: #D1D1D1;         /* Light gray */
  --accent-color: #B22222; /* Brick red */
  --border: #262626;       /* Dark gray */
}
```

#### Professional Theme
```css
html.theme-professional {
  --bg: #000000;           /* Pure black */
  --card: #0A0A0A;         /* Almost black */
  --text: #FFFFFF;         /* Pure white */
  --accent-color: #FFFFFF; /* Pure white */
  --border: #262626;       /* Dark gray */
}
```

#### Metal Theme
```css
html.theme-metal {
  --bg: #000000;           /* Pure black */
  --card: #0A0A0A;         /* Almost black */
  --text: #FFFFFF;         /* Pure white */
  --accent-color: #FF0000; /* Bright red */
  --border: #330000;       /* Dark red */
}
```

## Component Integration

### Required: App.jsx

```jsx
import ThemeProvider from './ThemeContext';

export default function App() {
  const { user } = useAuth();
  
  return (
    <ToastProvider>
      <ThemeProvider user={user}>
        {/* Application content */}
      </ThemeProvider>
    </ToastProvider>
  );
}
```

### Usage: Any Component

```jsx
import { useTheme } from './ThemeContext';

function MyComponent() {
  const { theme, switchTheme, themeInfo } = useTheme();
  
  return (
    <div>
      <p>Current theme: {themeInfo.name}</p>
      <button onClick={() => switchTheme('metal')}>
        Switch to Metal
      </button>
    </div>
  );
}
```

## Event Flow

### Theme Loading

```
App Mount
  ↓
ThemeProvider initializes
  ↓
Checks user.id
  ↓
Fetches theme from user_settings
  ↓
Sets loading = true
  ↓
Query completes
  ↓
Sets theme + loading = false
  ↓
Apply class to <html>
  ↓
UI updates
```

### Theme Switching

```
User clicks theme button
  ↓
switchTheme(newTheme) called
  ↓
Optimistic update: setTheme(newTheme)
  ↓
UI updates immediately
  ↓
DB update in background
  ↓
If error: revert theme
  ↓
Success/error handled
```

## Error Handling

### Possible Errors

1. **User not authenticated**
   - ThemeProvider skips DB operations
   - Uses default theme (classic)

2. **user_settings record doesn't exist**
   - Auto-creates record with default theme
   - Sets: `{ user_id, theme: 'classic', settings: { language: 'en' } }`

3. **Invalid theme value in DB**
   - Falls back to 'classic'
   - Logs error to console

4. **Network error during switch**
   - Optimistic update reverts
   - Error shown in console
   - UI returns to previous theme

## Performance Considerations

1. **Lazy Loading:** Theme loads once on app start
2. **Optimistic Updates:** UI responds immediately
3. **CSS Variables:** No runtime color calculations
4. **Class-based Theming:** Single class toggle on `<html>`
5. **No Re-renders:** Theme context only triggers when changing

## Backwards Compatibility

- **Existing users:** Default to 'classic' theme
- **New users:** Assigned 'classic' on first login
- **Database:** Gracefully handles missing theme column
- **CSS:** Old variables still work alongside new ones

## Security Considerations

- Theme stored in user_settings with RLS policies
- Only user can read/write their own theme
- No sensitive data in theme
- Theme changes only affect UI, not permissions

## Testing Checklist

- [ ] Theme persists after page refresh
- [ ] Theme syncs across tabs
- [ ] Theme syncs across devices
- [ ] New users get 'classic' theme
- [ ] All 3 themes render correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Dark mode preferred still works
- [ ] Performance acceptable
- [ ] DB migration runs without errors
