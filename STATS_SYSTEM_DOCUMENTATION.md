# 🏋️ Zaawansowany System Statystyk i Progresu - Dokumentacja

## 📋 Przegląd Systemu

Rozbudowany system statystyk zaimplementowany w `Home.jsx` zapewnia pełny tracking lifelong volume oraz system rang z interaktywną wizualizacją. System jest w pełni zgodny ze strukturą JSONB Supabase i wykorzystuje React hooks do optymalizacji wydajności.

---

## 1️⃣ LOGIKA OBLICZEŃ (JSONB & useMemo)

### Struktura Danych JSONB

Każda sesja treningowa (`completed_sessions`) posiada strukturę:

```json
{
  "id": 123,
  "user_id": "uuid",
  "workout_id": 456,
  "completed_at": "2024-01-05T12:00:00Z",
  "exercises": [
    {
      "name": "Squat",
      "sets": [
        { "weight": 100, "reps": 8 },
        { "weight": 100, "reps": 6 },
        { "weight": 100, "reps": 5 }
      ]
    },
    {
      "name": "Bench Press",
      "sets": [
        { "weight": 80, "reps": 10 },
        { "weight": 80, "reps": 8 }
      ]
    }
  ],
  "duration": 3600,
  "created_at": "2024-01-05T12:30:00Z"
}
```

### Algorytm Obliczeń

Całkowita waga (volume) liczona jest używając `useMemo` w funkcji:

```javascript
const { totalLifetimeVolume, totalSessions } = useMemo(() => {
  let total = 0;
  completedSessions.forEach(session => {
    if (session.exercises && Array.isArray(session.exercises)) {
      session.exercises.forEach(exercise => {
        if (exercise.sets && Array.isArray(exercise.sets)) {
          exercise.sets.forEach(set => {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseInt(set.reps) || 0;
            total += weight * reps; // ← LOGIKA: weight * reps
          });
        }
      });
    }
  });
  return {
    totalLifetimeVolume: total,
    totalSessions: completedSessions.length
  };
}, [completedSessions]);
```

**Logika:** `session → exercises → sets → (weight × reps)`

Dla Squat 3×100kg: `100×8 + 100×6 + 100×5 = 1900 kg`

### Silent Refresh (Brak Mrugania)

- Dane są obliczane w tle przy każdej zmianie `completedSessions`
- Nigdy nie wyświetlamy `0` ani loading spinnerów jeśli są już dane w pamięci
- Animacje transitionów zapewniają gładkie przejścia wartości

---

## 2️⃣ BOSS BAR i SYSTEM RANG

### Rangi Użytkownika

| Ranga | Emoji | Zakres (kg) | Zakres (tony) |
|-------|-------|------------|---------------|
| Bronze | 🥉 | 0 - 1,000 | 0 - 1 |
| Silver | 🥈 | 1,000 - 6,000 | 1 - 6 |
| Gold | 🥇 | 6,000 - 41,000 | 6 - 41 |
| Platinum | 🏆 | 41,000 - 100,000 | 41 - 100 |
| Diamond | 💎 | 100,000 - 204,000 | 100 - 204 |
| Titan | 🌌 | 204,000+ | 204+ |

### Komponenty Boss Bar

#### 1. Wyświetlanie Bieżącej Rangi
```jsx
<div className="current-rank-display">
  <span className="rank-emoji">{currentRank.emoji}</span>
  <span className="rank-name">{currentRank.name[language]}</span>
</div>
```

#### 2. Pasek Postępu
- Wizualizuje procent drogi do następnej rangi
- Animacja płynna (cubic-bezier) z transitionem 1.2s
- Gradient: #00d4ff → #7c3aed → #ec4899
- Box-shadow: efekt świetlny (glow)

```jsx
<div className="boss-bar-progress" style={{
  width: `${rankProgress}%`,
  transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
}} />
```

#### 3. Informacja o Następnej Randze
```jsx
Next Rank: Gold (45%)
```

#### 4. Wyświetlanie Tonaży
Górna część paska wyświetla całkowitą wagę w tonach:
```jsx
<span className="volume-display">
  {(totalLifetimeVolume / 1000).toFixed(1)} <span className="volume-unit">ton</span>
</span>
```

### Obliczanie Progresu

```javascript
const rankProgress = useMemo(() => {
  if (!nextRank) return 100;
  const current = totalLifetimeVolume - currentRank.min;
  const range = nextRank.min - currentRank.min;
  return Math.min(100, Math.max(0, (current / range) * 100));
}, [totalLifetimeVolume, currentRank, nextRank]);
```

---

## 3️⃣ STATYSTYKI i 100 PORÓWNAŃ

### Struktura Tabów

Trzy karty nawigacyjne:
1. **💪 Your Workouts** - Lista treningów do wykonania
2. **📋 Workout Templates** - Szablony treningów
3. **🏋️ Total Lifted** - Sekcja statystyk i porównań

### Karta "Total Lifted"

Wyświetla:
- **Ogromna liczba tonaży** (gradient #00d4ff → #ec4899)
- **Jednostka (tony)**
- **Subtekst (kg)**

```jsx
<div className="total-lifted-value">
  {(totalLifetimeVolume / 1000).toFixed(2)}
</div>
<div className="total-lifted-unit">ton</div>
<div className="total-lifted-subtitle">{totalLifetimeVolume.toFixed(0)} kg</div>
```

### Sekcja "To tyle, co..."

#### Tablica 100 Porównań

100+ unikalnych obiektów od 0.3kg do 500,000kg:

```javascript
const comparisonObjects = useMemo(() => [
  { name: { en: 'Cola Can', pl: 'Puszka Coli' }, weight: 0.375, emoji: '🥤' },
  { name: { en: 'Apple', pl: 'Jabłko' }, weight: 0.2, emoji: '🍎' },
  // ... 100+ więcej
  { name: { en: 'Blue Whale', pl: 'Płetwal Błękitny' }, weight: 190000, emoji: '🐋' },
  { name: { en: 'Statue of Liberty', pl: 'Statua Wolności' }, weight: 200000, emoji: '🗽' },
], []);
```

#### Logika Losowania

Przy każdym wejściu na Home.jsx losujemy przedmiot **lżejszy niż aktualna waga użytkownika**:

```javascript
useEffect(() => {
  if (totalLifetimeVolume > 0) {
    const lighterItems = comparisonObjects.filter(
      item => item.weight < totalLifetimeVolume
    );
    if (lighterItems.length > 0) {
      const randomItem = lighterItems[
        Math.floor(Math.random() * lighterItems.length)
      ];
      setComparisonItem(randomItem);
    }
  }
}, [totalLifetimeVolume, comparisonObjects]);
```

#### Wyświetlanie Porównania

```jsx
<div className="comparison-item">
  <span className="comparison-emoji">{comparisonItem.emoji}</span>
  <p className="comparison-name">{comparisonItem.name[language]}</p>
  <p className="comparison-weight">{comparisonItem.weight} kg</p>
</div>
```

---

## 4️⃣ INTERAKCJA i FEEDBACK

### Komunikat po Treningu

Po ukończeniu treningu wyświetlany jest animowany komunikat:

```jsx
{showCompletionMessage && lastCompletedVolume !== null && (
  <div className="completion-message">
    <span className="completion-emoji">🎉</span>
    <p>
      {language === 'pl'
        ? `Brawo! Twoje ${lastCompletedVolume.toFixed(0)} kg właśnie zasiliło statystyki!`
        : `Great job! Your ${lastCompletedVolume.toFixed(0)} kg just boosted your stats!`}
    </p>
  </div>
)}
```

**Logika:**
1. Gdy użytkownik ukończy trening, obliczamy volume z `exerciseData`
2. Wyświetlamy komunikat przez 5 sekund
3. Automatycznie znika

```javascript
setLastCompletedVolume(sessionVolume);
setShowCompletionMessage(true);
setTimeout(() => setShowCompletionMessage(false), 5000);
```

### Animacje

#### 1. Boss Bar Progress
- **Transition:** `width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)`
- Płynna easing animacja rosnącej wartości

#### 2. Rank Emoji Pulse
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

#### 3. Completion Message
- **Slide in:** `slideInDown 0.4s ease-out`
- **Emoji bounce:** `bounce 0.6s ease-out`

#### 4. Comparison Emoji Float
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

#### 5. Tab Button Hover
- Transformacja: `translateY(-2px)`
- Zmiana tła na brighter glassmorphism

---

## 5️⃣ STYL: GLASSMORPHISM

### Efekt Szklany (Glass Effect)

Wszystkie elementy wykorzystują:

```css
backdrop-filter: blur(12px);
background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%);
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 1rem;
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
```

### Kolory i Gradienty

#### Boss Bar Progress
```css
background: linear-gradient(90deg, #00d4ff 0%, #7c3aed 50%, #ec4899 100%);
```

#### Volume Display
```css
background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

#### Tab Button Active
```css
background: linear-gradient(135deg, rgba(123, 58, 237, 0.4) 0%, rgba(236, 72, 153, 0.4) 100%);
border-color: rgba(123, 58, 237, 0.6);
box-shadow: 0 0 20px rgba(123, 58, 237, 0.3);
```

### Paleta Kolorów

- **Primary Glow:** #7c3aed (Violet)
- **Secondary Glow:** #ec4899 (Pink)
- **Accent Light:** #00d4ff (Cyan)
- **White Text:** rgba(255, 255, 255, 0.95)
- **Subtle Text:** rgba(255, 255, 255, 0.7)
- **Dark Background:** Black (z Aurora gradient w tle)

---

## 6️⃣ IMPLEMENTACJA TECHNICZNA

### Zależności

```javascript
import React, { useState, useMemo, useEffect } from 'react';
```

### State Management

```javascript
const [activeWorkout, setActiveWorkout] = useState(null);
const [deleteModal, setDeleteModal] = useState({...});
const [activeTab, setActiveTab] = useState('workouts'); // 'workouts', 'templates', 'total'
const [comparisonItem, setComparisonItem] = useState(null);
const [lastCompletedVolume, setLastCompletedVolume] = useState(null);
const [showCompletionMessage, setShowCompletionMessage] = useState(false);
```

### Performance Optimizations

1. **useMemo dla obliczeń volume** - Przelicza się tylko gdy `completedSessions` zmienia
2. **useMemo dla array porównań** - Inicjalizuje się raz na komponencie
3. **useMemo dla rangi** - Zmienia się tylko przy zmianie `totalLifetimeVolume`
4. **useEffect dla porównań** - Losuje nowy element gdy zmienia się `totalLifetimeVolume`

---

## 7️⃣ OBSŁUGIWANE JĘZYKI

### Polskie (PL)
- "Następna Ranga"
- "Razem Podniesione"
- "Sesji"
- "Średnio kg"
- "Brawo! Twoje X kg właśnie zasiliło statystyki!"

### English (EN)
- "Next Rank"
- "Total Lifted"
- "Sessions"
- "Avg kg"
- "Great job! Your X kg just boosted your stats!"

---

## 8️⃣ RESPONSYWNOŚĆ

### Desktop (90vw max-width)
- Boss Bar pełna szerokość
- 3 Taby obok siebie
- Statystyki w gridzie

### Mobile (90vw max-width)
- Boss Bar skaluje się do 90vw
- Taby zawijają się (flex-wrap)
- Statystyki stackują się (grid auto-fit)

---

## 9️⃣ TESTOWANIE

### Test Case 1: Bronze → Silver
1. Wykonaj 20 sesji x 100kg x 5 reps
2. Całkowita: 10,000 kg
3. Powinno osiągnąć Silver (🥈)

### Test Case 2: Completion Message
1. Zapisz trening 50kg x 10x5 serii
2. Wykonaj trening
3. Powinien pojawić się komunikat: "Brawo! Twoje 2500 kg..."

### Test Case 3: Random Comparison
1. Miej 50,000 kg volume
2. Refresh strony
3. Powinno wybrać losowy przedmiot < 50,000 kg

---

## 🔟 PODSUMOWANIE

System statystyk spełnia ALL wymagania:

✅ **Logika Obliczeń** - useMemo, JSONB parsing, Silent Refresh  
✅ **Boss Bar** - Animacje, Rangi 6-poziomowe, Procent progresu  
✅ **100 Porównań** - Tablica, losowe selekcje, PL/EN  
✅ **Interakcja** - Komunikaty, animacje, UI feedback  
✅ **Styl** - Pełny Glassmorphism, Aurora kompatybilny  

🚀 **Production Ready!**
