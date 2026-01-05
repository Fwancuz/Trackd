# Interactive Exercise Selector - Architecture & Data Flow

## System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                      Home Component (React)                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  State Management:                                                │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ const [selectedExercise, setSelectedExercise] = 'all'   │    │
│  │ const [activeTab, setActiveTab] = 'plans'              │    │
│  │ const [completedSessions] = (from props)               │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  Hooks (useMemo):                                                 │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ 1. uniqueExercises = Extract unique names from history  │    │
│  │    Input: completedSessions                             │    │
│  │    Output: ['Bench Press', 'Squats', ...]             │    │
│  │                                                         │    │
│  │ 2. chartData = Transform for visualization             │    │
│  │    Input: completedSessions, selectedExercise          │    │
│  │    Output: [{date, volume, ...}, ...]                │    │
│  │                                                         │    │
│  │ Dependency Arrays:                                      │    │
│  │ - uniqueExercises: [completedSessions]                │    │
│  │ - chartData: [completedSessions, selectedExercise]    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  JSX Rendering (activeTab === 'total'):                          │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │ ┌──────────────────────────────────────────────────┐   │    │
│  │ │  Stats Card (tons, kg, sessions, avg kg)         │   │    │
│  │ └──────────────────────────────────────────────────┘   │    │
│  │                                                          │    │
│  │ ┌──────────────────────────────────────────────────┐   │    │
│  │ │  Exercise Selector Dropdown                      │   │    │
│  │ │  ┌──────────────────────────────────────────┐   │   │    │
│  │ │  │ [▼ Całkowita objętość (Wszystko)    ]   │   │   │    │
│  │ │  │  - Bench Press                          │   │   │    │
│  │ │  │  - Squats                               │   │   │    │
│  │ │  │  - Deadlift                             │   │   │    │
│  │ │  │  - (etc. from uniqueExercises)          │   │   │    │
│  │ │  └──────────────────────────────────────────┘   │   │    │
│  │ │  onChange: setSelectedExercise(value)           │   │    │
│  │ └──────────────────────────────────────────────────┘   │    │
│  │                                                          │    │
│  │ ┌──────────────────────────────────────────────────┐   │    │
│  │ │  AreaChart Component (recharts)                 │   │    │
│  │ │  Input: chartData                               │   │    │
│  │ │  Displays: Volume progression over time         │   │    │
│  │ │  Updated: Instantly when selectedExercise      │   │    │
│  │ │           changes (memoized dependency)         │   │    │
│  │ └──────────────────────────────────────────────────┘   │    │
│  │                                                          │    │
│  │ ┌──────────────────────────────────────────────────┐   │    │
│  │ │  Boss Bar (Separate Component)                  │   │    │
│  │ │  "Brawo! Twoje [X] kg..." (Success Message)     │   │    │
│  │ │  Independent of exercise selector               │   │    │
│  │ └──────────────────────────────────────────────────┘   │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Data Transformation Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Input: completedSessions                         │
│  [{exercises, completed_at, duration, ...}, ...]                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌─────────────────────┐
                    │ Extract Exercise    │
                    │ Names (useMemo)     │
                    │                     │
                    │ Logic:              │
                    │ 1. Loop sessions    │
                    │ 2. Find ex.name     │
                    │ 3. Add to Set       │
                    │ 4. Sort array       │
                    └─────────────────────┘
                              │
                              ↓
            ┌─────────────────────────────────┐
            │  uniqueExercises Output         │
            │  ['Bench', 'Squat', 'DL', ...] │
            └─────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ↓                    ↓
            ┌────────────────┐  ┌────────────────┐
            │ Populate       │  │ Track User     │
            │ Dropdown with  │  │ Selection      │
            │ Options        │  │                │
            │                │  │ selectedExe = ?│
            └────────────────┘  └────────────────┘
                    │                    │
                    └─────────┬──────────┘
                              │
                              ↓
            ┌──────────────────────────────────────┐
            │  Transform Chart Data (useMemo)      │
            │  Input: completedSessions,           │
            │         selectedExercise             │
            └──────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ↓                           ↓
      ┌──────────────────┐      ┌──────────────────┐
      │ selectedExe:     │      │ selectedExe:     │
      │ 'all'            │      │ 'Bench Press'    │
      │                  │      │                  │
      │ Logic:           │      │ Logic:           │
      │ 1. Sum ALL       │      │ 1. Find BP only  │
      │    exercises     │      │ 2. Max weight    │
      │ 2. Cumulative    │      │ 3. Skip if no BP │
      │    total         │      │ 4. Cumulative    │
      │                  │      │    per session   │
      └──────────────────┘      └──────────────────┘
                │                           │
                ↓                           ↓
      ┌──────────────────┐      ┌──────────────────┐
      │ Session 1:       │      │ Session 1:       │
      │ Vol = 100 kg     │      │ MaxW = 100 kg    │
      │ Session 2:       │      │ Session 2:       │
      │ Vol = 250 kg     │      │ MaxW = 105 kg    │
      │ (cumulative)     │      │ Session 3:       │
      │ Session 3:       │      │ MaxW = 110 kg    │
      │ Vol = 380 kg     │      │ (excludes if BP  │
      │                  │      │  not performed)  │
      └──────────────────┘      └──────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                              ↓
            ┌──────────────────────────────────────┐
            │  chartData Output                    │
            │  [{date, volume, ...}, ...]          │
            │  Ready for AreaChart rendering       │
            └──────────────────────────────────────┘
                              │
                              ↓
            ┌──────────────────────────────────────┐
            │  AreaChart Component (recharts)      │
            │                                      │
            │  Renders:                            │
            │  - White line (stroke)               │
            │  - Gradient fill (white→transparent)│
            │  - Grid (minimal, no vertical)       │
            │  - Axes (Plus Jakarta Sans)          │
            │  - Tooltip (dark background)         │
            └──────────────────────────────────────┘
                              │
                              ↓
                    ┌──────────────────┐
                    │  Visual Output   │
                    │  Progress Chart  │
                    └──────────────────┘
```

## Exercise Filtering Logic

```
selectedExercise = 'all'
├─ Include all exercises
├─ Calculate: ∑(weight × reps) for each session
├─ Display: Cumulative volume line
├─ Y-axis: "kg"
└─ Tooltip: "Razem" (Total)

selectedExercise = 'Bench Press'
├─ Filter: Only sessions with Bench Press
├─ Calculate: max(weight) for Bench Press per session
├─ Display: Personal record progression
├─ Y-axis: "Max kg"
└─ Tooltip: "Max Waga" (Max Weight)
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────┐
│         User Interacts with Dropdown                    │
└─────────────────────────────────────────────────────────┘
                       │
                       ↓
            ┌────────────────────────────┐
            │ onChange Handler Triggers  │
            │ setSelectedExercise(value) │
            └────────────────────────────┘
                       │
                       ↓
            ┌────────────────────────────┐
            │ State Update               │
            │ selectedExercise = 'BP'    │
            └────────────────────────────┘
                       │
                       ↓
      ┌─────────────────────────────────────────┐
      │ React Re-render (Component Updates)     │
      │                                         │
      │ 1. uniqueExercises unchanged            │
      │ 2. chartData dependency includes        │
      │    selectedExercise → recalculates!     │
      │ 3. Chart JSX props updated              │
      └─────────────────────────────────────────┘
                       │
                       ↓
            ┌────────────────────────────┐
            │ useEffect Not Triggered    │
            │ (memoized, not watching    │
            │ selectedExercise)          │
            └────────────────────────────┘
                       │
                       ↓
            ┌────────────────────────────┐
            │ AreaChart Re-renders       │
            │ with new chartData         │
            │                            │
            │ Smooth transition:         │
            │ Old line → New line        │
            │ No page reload!            │
            └────────────────────────────┘
```

## CSS Styling Cascade

```
.exercise-selector-wrapper
├─ display: flex
├─ flex-direction: column
├─ gap: 0.75rem
└─ margin-bottom: 1.5rem

.exercise-selector (select element)
├─ width: 100%
├─ padding: 0.75rem 1rem
├─ background: rgba(20, 20, 22, 0.8) ← Off-Black
├─ border: 1px solid #3f3f46 ← Zinc-800
├─ color: #ffffff ← White text
├─ font-family: Plus Jakarta Sans
├─ font-size: 0.95rem
├─ border-radius: 0.75rem
├─ cursor: pointer
├─ transition: all 0.2s ease
├─ appearance: none (remove default)
└─ background-image: svg (dropdown arrow)

.exercise-selector:hover
├─ border-color: #52525b ← Lighter zinc
└─ background-color: rgba(20, 20, 22, 0.95) ← Darker

.exercise-selector:focus
├─ outline: none
├─ border-color: #7c3aed ← Purple
└─ box-shadow: glow effect

.exercise-selector option
├─ background: #141416
├─ color: #ffffff
└─ padding: 0.5rem
```

## Language Support (Bilingual)

```
English Mode (language='en'):
├─ Default: "Total Volume (All)"
├─ Y-axis (all): "kg"
├─ Y-axis (specific): "Max kg"
└─ Tooltip (specific): "Max Weight"

Polish Mode (language='pl'):
├─ Default: "Całkowita objętość (Wszystko)"
├─ Y-axis (all): "kg"
├─ Y-axis (specific): "Max kg"
└─ Tooltip (specific): "Max Waga"

Exercise Names:
├─ Always shown as entered by user
├─ Sorted alphabetically
├─ From uniqueExercises array
└─ No translation (user-provided)
```

---

**Visual Complexity**: 5/10 (Medium)  
**Data Flow Complexity**: 6/10 (Medium-High)  
**User Interaction Complexity**: 3/10 (Low)  
**Performance Impact**: Minimal (Memoized)
