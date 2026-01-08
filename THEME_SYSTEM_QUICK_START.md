# System Motywów - Szybka Implementacja

## Co Zostało Zrobione?

✅ **Baza Danych**
- Dodana kolumna `theme` (string, default: 'classic') do tabeli `user_settings`
- Obsługuje 4 motywy: classic, professional, metal, light

✅ **CSS Variables** (`src/index.css`)
- `:root` dla Classic Theme (domyślny - Ciemny z Czerwonym)
- `html.theme-professional` dla Professional Theme (Wysoka-End z Neonowym Błękitem)
- `html.theme-metal` dla Metal Theme (Agresywny Czerwień)
- `html.theme-light` dla Light Theme (Czarny na Białym)

✅ **Theme Context** (`src/ThemeContext.jsx`)
- Pobranie motywu z bazy przy starcie
- Optimistic update + sync DB
- Hook `useTheme()` do dostępu w komponentach

✅ **Integracja** (`src/App.jsx`)
- ThemeProvider otacza całą aplikację

✅ **UI Settings** (`src/AppSettings.jsx`)
- Sekcja "Choose Theme" z 4 przyciskami
- Podgląd kolorów dla każdego motywu
- Opisy motywów

## Jak Uruchomić

### 1. Aktualizacja Bazy Danych

Jeśli już masz istniejącą bazę, uruchom migrację:

```sql
-- W Supabase SQL Editor
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'classic';
```

Jeśli tworzysz nową bazę, cały schemat jest w `supabase-schema.sql`.

### 2. Używanie w Komponentach

```jsx
import { useTheme } from './ThemeContext';

function MyComponent() {
  const { theme, switchTheme, themeInfo } = useTheme();
  
  // Wyświetl aktualny motyw
  console.log(themeInfo.name); // "Classic", "Professional", "Metal", "Light"
  
  // Zmień motyw
  await switchTheme('metal');
}
```

### 3. CSS i Tailwind

Używaj CSS variables:
```css
.element {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  accent: var(--accent-color);
}
```

Lub standardowe CSS (bez Tailwind):
```jsx
<div style={{ 
  backgroundColor: 'var(--bg)',
  color: 'var(--text)'
}}>
  Treść
</div>
```

## Motywy - Kolory

### Classic (Default)
```
Background: #050505 (Very Dark Gray)
Card:       #121212 (Slightly Lighter)
Text:       #D1D1D1 (Light Gray)
Accent:     #B22222 (Brick Red)
Border:     #262626 (Dark Gray)
```

### Professional
```
Background: #000000 (Pure Black)
Card:       #0F0F0F (Delikatne odcięcie)
Text:       #FFFFFF (Pure White)
Accent:     #00E5FF (Neon Cyan)
Border:     #1F1F1F (Dark Gray)
```

### Metal
```
Background: #000000 (Pure Black)
Card:       #1A0505 (Very Dark Red)
Text:       #FFDADA (Light Pink/White)
Accent:     #FF0000 (Blood Red)
Border:     #450a0a (Dark Red Border)
```

### Light
```
Background: #FFFFFF (Pure White)
Card:       #F3F4F6 (Light Gray)
Text:       #000000 (Pure Black)
Accent:     #2563EB (Classic Blue)
Border:     #E5E7EB (Light Gray)
```

## Edycja Motywów

Aby zmienić kolory motywu:

1. **Edytuj zmienne w `index.css`:**
   ```css
   :root {
     --bg: #050505;        /* zmień tutaj */
     --accent-color: #B22222; /* zmień tutaj */
   }
   ```

2. **Edytuj info motywu w `ThemeContext.jsx`:**
   ```javascript
   const THEME_OPTIONS = {
     classic: {
       bg: '#050505',       /* zmień tutaj */
       accent: '#B22222'    /* zmień tutaj */
     }
   };
   ```

## Dodawanie Nowego Motywu

### Krok 1: `ThemeContext.jsx`
```javascript
const THEME_OPTIONS = {
  // ... istniejące motywy
  myTheme: {
    id: 'myTheme',
    name: 'My Theme',
    bg: '#1a1a1a',
    card: '#2a2a2a',
    text: '#e0e0e0',
    accent: '#00ff00'
  }
};
```

### Krok 2: `index.css`
```css
html.theme-myTheme,
html.theme-myTheme body {
  --bg: #1a1a1a;
  --card: #2a2a2a;
  --text: #e0e0e0;
  --accent-color: #00ff00;
  --border: #004400;
}
```

### Krok 3: Gotowe!
Nowy motyw pojawi się automatycznie w UI Settings.

## Struktura Plików

```
/home/francuz/mobilegymtrack/
├── src/
│   ├── ThemeContext.jsx          # Context + Provider + Hook
│   ├── AppSettings.jsx           # UI Selection
│   ├── App.jsx                   # Provider Integration
│   └── index.css                 # CSS Variables
├── supabase-schema.sql           # Schema with theme column
└── THEME_SYSTEM_GUIDE.md         # Full documentation
```

## Testowanie

```bash
# 1. Zaloguj się do aplikacji
# 2. Przejdź do Settings
# 3. Kliknij "Choose Theme"
# 4. Spróbuj każdego motywu
# 5. Odśwież stronę - motyw się zachował?
# 6. Zaloguj się z innego urządzenia - ten sam motyw?
```

## Zmienne CSS Dostępne

```javascript
--bg              // Tło aplikacji
--card            // Tło karty/panelu
--text            // Kolor tekstu
--accent-color    // Kolor akcent
--border          // Kolor obramowania
--hud-height      // Wysokość HUD (80px)
--safe-bottom     // Safe area bottom (mobile)
```

## Troubleshooting

| Problem | Rozwiązanie |
|---------|------------|
| Motyw się nie zmienia | Sprawdź czy ThemeProvider jest w App.jsx |
| Kolory nie pasują | Wyczyść cache (Ctrl+Shift+Del) |
| Motyw się nie ładuje | Sprawdź konsolę DevTools (F12) |
| Baza danych błąd | Upewnij się że kolumna `theme` istnieje |

## Następne Funkcje (TODO)

- [ ] Animacja przejścia motywów
- [ ] Automatyczne wykrycie systemu (dark/light)
- [ ] Niestandardowe motywy
- [ ] Harmonogram zmian motywów
- [ ] Eksport/Import motywów
