# System Motywów - Dokumentacja

## Przegląd

System motywów został zaimplementowany z pełną synchronizacją w bazie danych. Użytkownicy mogą wybierać między trzema motywami:

1. **Classic** - Aktualny domyślny motyw (ciemny z akcentem czerwonym)
2. **Professional** - Czysty czarny z białym tekstem
3. **Metal** - Czarny z czerwonymi akcentami

## Architektura

### 1. Baza Danych
- Kolumna `theme` została dodana do tabeli `user_settings`
- Default value: `'classic'`
- Automatycznie synchronizuje się między urządzeniami

### 2. CSS Variables (index.css)

Zdefiniowano zmienne CSS dla każdego motywu:

#### Classic Theme (:root)
```css
--bg: #050505;           /* Tło */
--card: #121212;         /* Karty */
--text: #D1D1D1;         /* Tekst */
--accent-color: #B22222; /* Akcent */
--border: #262626;       /* Obramowanie */
```

#### Professional Theme (html.theme-professional)
```css
--bg: #000000;           /* Czysty czarny */
--card: #0A0A0A;         /* Niemal czarny */
--text: #FFFFFF;         /* Czysty biały */
--accent-color: #FFFFFF; /* Biały akcent */
--border: #262626;       /* Szare obramowanie */
```

#### Metal Theme (html.theme-metal)
```css
--bg: #000000;           /* Czarny */
--card: #0A0A0A;         /* Niemal czarny */
--text: #FFFFFF;         /* Biały */
--accent-color: #FF0000; /* Czerwony akcent */
--border: #330000;       /* Ciemno-czerwone obramowanie */
```

### 3. Tailwind Theme Configuration

W `index.css` zdefiniowano Tailwind colors:

```css
@theme {
  --color-app-bg: var(--bg);
  --color-app-card: var(--card);
  --color-app-text: var(--text);
  --color-app-accent: var(--accent-color);
  --color-app-border: var(--border);
}
```

Można ich używać w klasach Tailwind:
- `bg-app-bg` - tło aplikacji
- `bg-app-card` - tło karty
- `text-app-text` - tekst aplikacji
- `text-app-accent` - tekst akcent
- `border-app-border` - obramowanie

### 4. ThemeContext.jsx

Context zapewnia:

```javascript
const { theme, switchTheme, availableThemes, themeInfo, loading, error } = useTheme();
```

**Właściwości:**
- `theme` - aktualnie wybrany motyw ('classic', 'professional', 'metal')
- `switchTheme(newTheme)` - zmienia motyw (optimistic update + sync DB)
- `availableThemes` - tablica dostępnych motywów
- `themeInfo` - informacje o aktualnym motywie (kolory, nazwa)
- `loading` - czy trwa ładowanie motywu z DB
- `error` - błąd podczas ładowania/przełączania

**Funkcjonalność:**
- Automatycznie pobiera motyw z bazy danych przy starcie
- Aplikuje klasę `theme-{name}` na element `<html>`
- Optimistycznie aktualizuje UI przed synchronizacją z bazą
- Tworzy wpis w `user_settings` jeśli nie istnieje

### 5. Integracja w App.jsx

ThemeProvider owija całą aplikację:

```jsx
<ToastProvider>
  <ThemeProvider user={user}>
    {/* Reszta aplikacji */}
  </ThemeProvider>
</ToastProvider>
```

### 6. UI Motywów w AppSettings

W `AppSettings.jsx` dodano sekcję wyboru motywu:

- Trzy przyciski - jeden dla każdego motywu
- Podgląd kolorów (mała paletka obok każdej nazwy)
- Aktywny motyw jest wyróżniony
- Zmiana motywu jest natychmiastowa (optimistic)
- Synchronizacja z bazą danych w tle

## Jak Używać

### Dla Deweloperów

#### 1. Dostęp do aktualnego motywu w komponencie:

```jsx
import { useTheme } from './ThemeContext';

function MyComponent() {
  const { theme, themeInfo } = useTheme();
  
  return (
    <div style={{ color: themeInfo.text }}>
      {theme === 'metal' ? 'Używam Metal!' : 'Inny motyw'}
    </div>
  );
}
```

#### 2. Zmiana motywu programowo:

```jsx
const { switchTheme } = useTheme();

// Przełącz na Professional
await switchTheme('professional');
```

#### 3. Używanie CSS variables:

```css
.my-component {
  background-color: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  accent: var(--accent-color);
}
```

#### 4. Używanie Tailwind classes:

```jsx
<div className="bg-app-bg text-app-text border border-app-border">
  <h1 className="text-app-accent">Nagłówek</h1>
</div>
```

### Dla Użytkowników

1. Otwórz **Settings** (ostatnia ikona w dolnym menu)
2. Przejdź do sekcji **"Choose Theme"** (lub "Wybierz Motyw" w polskim)
3. Kliknij jeden z trzech przycisków motywu
4. Motyw zmieni się natychmiast
5. Wybór jest automatycznie synchronizowany w bazie danych
6. Na wszystkich urządzeniach będziesz widzieć wybrany motyw

## Dodawanie Nowych Motywów

Aby dodać nowy motyw:

1. **ThemeContext.jsx** - Dodaj wpis do `THEME_OPTIONS`:
```javascript
const THEME_OPTIONS = {
  classic: { /* ... */ },
  professional: { /* ... */ },
  metal: { /* ... */ },
  myNewTheme: {
    id: 'myNewTheme',
    name: 'My Theme',
    bg: '#COLOR1',
    card: '#COLOR2',
    text: '#COLOR3',
    accent: '#COLOR4'
  }
};
```

2. **index.css** - Dodaj CSS variables:
```css
html.theme-myNewTheme,
html.theme-myNewTheme body {
  --bg: #COLOR1;
  --card: #COLOR2;
  --text: #COLOR3;
  --accent-color: #COLOR4;
  --border: #COLOR5;
}
```

3. Gotowe! Nowy motyw pojawi się automatycznie w UI

## Problemy i Rozwiązania

### Motyw się nie ładuje
- Sprawdź czy kolumna `theme` istnieje w tabeli `user_settings`
- Upewnij się że RLS policies są poprawnie skonfigurowane
- Sprawdź konsolę DevTools (F12) czy są błędy

### Motyw się nie zmienia
- Sprawdź czy ThemeProvider jest w strukturze komponentów
- Upewnij się że `user` jest prawidłowo przekazywany do `ThemeProvider`
- Sprawdź czy supabase client jest prawidłowo skonfigurowany

### Kolory nie pasują między motywami
- Sprawdź CSS variables w `:root` i `.theme-{name}` selektorach
- Upewnij się że nazwy zmiennych są spójne (`--bg`, `--text`, itd.)
- Wyczyść cache przeglądarki (Ctrl+Shift+Del)

## Zmieniane Elementy

Poniższe komponenty zostały zmodyfikowane:

- ✅ `ThemeContext.jsx` - Nowy (context + provider)
- ✅ `App.jsx` - Dodano ThemeProvider
- ✅ `AppSettings.jsx` - Dodano UI motywów
- ✅ `index.css` - CSS variables + @theme + klasy
- ✅ `supabase-schema.sql` - Kolumna `theme` w `user_settings`

## Następne Kroki

Opcjonalne ulepszenia:

1. Dodanie animacji przejścia motywów
2. Obsługa preferencji systemu (dark/light mode)
3. Niestandardowe motywy - dialog tworzenia motywu
4. Harmonogram motywów (auto-zmiana o danym czasie)
5. Synchronizacja z systemową preferenceją motywu

## Testowanie

Aby przetestować system:

1. Zaloguj się do aplikacji
2. Przejdź do Settings
3. Kliknij różne motywy i obserwuj zmianę
4. Odśwież stronę - motyw powinien się zachować
5. Zaloguj się z innego urządzenia - motyw powinien być ten sam
6. Sprawdź konsolę DevTools aby upewnić się że nie ma błędów
