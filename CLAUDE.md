# CLAUDE.md - Life Tracker App

## Project Overview

Life Tracker is a personal life management webapp that helps users track goals, tasks, journal entries, meals, training, recipes, and shopping lists. It uses a hierarchical goal system where yearly goals break down into monthly and weekly targets, with daily task completion bubbling up to show progress.

**Core philosophy**: Offline-first, local data ownership, flexible scheduling, AI analysis optional.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Storage**: IndexedDB via Dexie.js (offline-first, no backend)
- **State**: Zustand
- **UI Components**: shadcn/ui (Radix primitives)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Sentiment Analysis**: `sentiment` npm package (in-browser)
- **Local LLM**: Ollama API at localhost:11434 (optional, graceful fallback)
- **Analytics**: Vercel Analytics

## Project Structure

```
/
├── app/                 # Next.js App Router pages
│   ├── page.tsx         # Dashboard
│   ├── layout.tsx       # Root layout with providers
│   ├── globals.css      # Tailwind + design system
│   ├── analysis/        # Analysis & insights page
│   ├── calendar/        # Calendar view
│   ├── goals/           # Goal management
│   ├── journal/         # Journal entries
│   ├── meals/           # Meal logging
│   ├── onboarding/      # Onboarding wizard
│   ├── recipes/         # Recipe CRUD
│   ├── settings/        # App settings
│   ├── shopping/        # Shopping lists
│   ├── tasks/           # Task management
│   └── training/        # Training log
├── components/          # React components
│   ├── ui/              # shadcn/ui primitives
│   ├── app-layout.tsx   # Main layout with sidebar
│   ├── task-item.tsx    # Task display component
│   ├── goal-card.tsx    # Goal display component
│   ├── progress-ring.tsx
│   ├── sentiment-dot.tsx
│   ├── aspect-badge.tsx
│   ├── empty-state.tsx
│   ├── providers.tsx    # Data initialization provider
│   └── theme-provider.tsx
├── db/                  # Dexie database setup
│   └── index.ts         # Schema and utilities
├── stores/              # Zustand stores
│   ├── app.ts           # Settings, schedule blocks, import/export
│   ├── goals.ts         # Yearly, monthly, weekly goals
│   ├── tasks.ts         # Tasks and recurrence templates
│   ├── journal.ts       # Journal entries
│   ├── training.ts      # Training sessions
│   ├── meals.ts         # Meals
│   ├── recipes.ts       # Recipes
│   └── shopping.ts      # Shopping lists and items
├── services/            # Business logic
│   ├── analysis.ts      # Sentiment, aspect detection, patterns
│   ├── progress.ts      # Goal progress calculations
│   └── ollama.ts        # LLM integration
├── hooks/               # Custom React hooks
│   ├── use-data.ts      # Data loading hook
│   ├── use-mobile.ts    # Mobile detection
│   └── use-toast.ts     # Toast notifications
├── lib/                 # Utilities and types
│   ├── types.ts         # TypeScript interfaces
│   ├── constants.ts     # Aspect configuration
│   ├── utils.ts         # Helper functions (cn, etc.)
│   └── sample-data.ts   # Sample data for development
└── public/              # Static assets
```

## Key Data Models

### Life Aspects
```typescript
type LifeAspect = 'fitness' | 'nutrition' | 'career' | 'financial' | 'side-projects' | 'chores';
```

### Goal Hierarchy
- **YearlyGoal** → has many **MonthlyGoal** → has many **WeeklyGoal** → has many **Task**
- Progress bubbles up: task completion → weekly progress → monthly progress → yearly progress
- Goals can be standalone (no parent) at any level

### Core Entities
- **Task**: Has `scheduledDate`, `timePreference` (morning/afternoon/evening/anytime), optional `hardScheduledTime`, links to `weeklyGoalId`
- **RecurrenceTemplate**: Defines recurring tasks, generates Task instances
- **JournalEntry**: Free-form text with auto-analyzed `sentimentScore`, `detectedAspects`, `goalAlignment`
- **TrainingSession**: Type (muay-thai/cardio/strength/flexibility/other), duration, intensity (1-10), notes
- **Meal**: Date, type (breakfast/lunch/dinner/snack), cooked boolean, optional recipe link
- **Recipe**: Full recipe with ingredients, instructions, nutrition, tags
- **ShoppingList/ShoppingItem**: Lists organized by store, items by category with priority (need/want/someday)
- **ScheduleBlock**: Time blocks for calendar view (work/training/meal_prep/personal/buffer)

## Database (Dexie.js)

All data stored in IndexedDB. No server. User owns their data.

```typescript
// Key indexes for common queries
yearlyGoals: 'id, aspect, year, status'
monthlyGoals: 'id, yearlyGoalId, aspect, month, status'
weeklyGoals: 'id, monthlyGoalId, aspect, week, status'
tasks: 'id, weeklyGoalId, aspect, scheduledDate, status, recurrenceTemplateId'
journalEntries: 'id, timestamp, *detectedAspects, goalAlignment'
trainingSessions: 'id, date, type'
meals: 'id, date, type, recipeId'
recipes: 'id, *tags, rating'
shoppingLists: 'id, store'
shoppingItems: 'id, listId, category, status, priority'
scheduleBlocks: 'id, date, type, linkedTaskId'
appSettings: 'id'
```

## Critical Implementation Details

### Progress Calculation
```typescript
// Weekly progress = completed tasks / total tasks for that weekly goal
// Monthly progress = average of weekly goal progresses
// Yearly progress = average of monthly goal progresses
```

### Journal Analysis (In-Browser)
1. **Sentiment**: Use `sentiment` npm package, normalize to -1 to 1 range
2. **Aspect Detection**: Keyword matching against predefined dictionaries per aspect
3. **Goal Alignment**: Heuristic based on drift/progress indicators + sentiment score

### Ollama Integration (Optional)
- Check connection: `GET http://localhost:11434/api/tags`
- Generate: `POST http://localhost:11434/api/generate` with `{ model, prompt, stream: false }`
- Always provide fallback to rule-based analysis when Ollama unavailable
- Use for: deep journal analysis, weekly nudges, monthly summaries, aspect insights

### Time Preferences
Tasks have `timePreference` (morning/afternoon/evening/anytime) for flexible scheduling, and optional `hardScheduledTime` for fixed appointments. Dashboard groups tasks by time preference.

### Streak Calculation
Dashboard shows streaks for:
- Training days
- Cooking (home-cooked meals)
- Journal entries

## Design System

**Aesthetic**: Warm, tactile, typography-forward. Like a Moleskine meets minimal Japanese app.

**Colors** (OKLCH color space, muted earthy tones):
- Background: `oklch(0.986 0.003 85.87)` - warm off-white (#FAF9F7)
- Foreground: `oklch(0.25 0 0)` - charcoal (#2D2D2D)
- Fitness: `oklch(0.56 0.1 25)` - terracotta (#C4726C)
- Nutrition: `oklch(0.58 0.08 145)` - sage (#7D9B76)
- Career: `oklch(0.52 0.06 250)` - slate blue (#6B7B8C)
- Financial: `oklch(0.65 0.09 85)` - warm gold (#B8A068)
- Side Projects: `oklch(0.54 0.06 310)` - dusty purple (#8B7B8E)
- Chores: `oklch(0.58 0.02 50)` - warm gray (#9B9590)

**Dark Mode**: Warm dark background `oklch(0.18 0.005 50)` (#1C1B1A)

**Typography**:
- Headers: Newsreader (serif)
- Body: Inter (sans-serif)
- Metadata: JetBrains Mono (monospace)

**Special Effects**: Subtle paper texture overlay on body background

**Avoid**: Bright badge pills, harsh shadows, generic SaaS aesthetic, gradient backgrounds.

## Path Aliases

```typescript
// tsconfig.json - all imports use @/* pointing to project root
import { db } from "@/db"           // → ./db/index.ts
import { Task } from "@/lib/types"  // → ./lib/types.ts
import { Button } from "@/components/ui/button"
```

## Data Initialization Pattern

The app uses a **DataProvider** wrapper that handles IndexedDB initialization and hydration:

```typescript
// components/providers.tsx
// 1. Waits for client-side mount (avoids SSR hydration issues with IndexedDB)
// 2. Initializes app settings via useAppStore.initialize()
// 3. Loads all data in parallel via useInitializeData()
// 4. Shows loading spinner until ready
```

**Critical**: All pages are wrapped in `<DataProvider>` in the root layout. Data loads once on app start.

### Store Pattern

Each Zustand store follows this pattern:
```typescript
// Store state
items: Item[]
isLoading: boolean
error: string | null

// Load method - called once on app init
loadItems: async () => {
  const items = await db.items.toArray()
  set({ items })
}

// CRUD methods - update both IndexedDB AND local state
addItem: async (data) => {
  await db.items.add(item)
  set((state) => ({ items: [...state.items, item] }))
}
```

### Hydration Handling

IndexedDB doesn't exist on server. The DataProvider uses a `mounted` state to avoid hydration mismatch:
```typescript
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null  // Render nothing on server
```

## Navigation Structure

**Desktop**: Left sidebar with two sections
- Main: Dashboard, Calendar, Goals, Tasks, Journal
- More: Training, Meals, Recipes, Shopping, Analysis, Settings

**Mobile**:
- Bottom nav (first 4 main items + More)
- Sheet drawer for remaining items
- Floating Action Button (FAB) for quick actions

### Quick Actions (FAB)

Bottom-right FAB provides shortcuts:
- Add Task
- Write Journal
- Log Meal
- Log Training

*Note: Quick action handlers not yet implemented - they just show in dropdown.*

## Recurring Tasks

`RecurrenceTemplate` generates `Task` instances via `generateRecurringTasks()`:

```typescript
// stores/tasks.ts
// Called on app load to generate missing tasks for current week
// Frequencies: daily, weekly (specific days), biweekly, monthly
// Links generated tasks back to template via recurrenceTemplateId
```

## Commands & Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Run production build
npm run lint         # Run ESLint
npx tsc --noEmit     # TypeScript check (recommended before commits)
```

## Common Tasks

### Adding a new page
1. Create page component in `app/[route]/page.tsx`
2. Add `"use client"` directive at top (required for data access)
3. Wrap content in `<AppLayout>` component
4. Add `loading.tsx` for loading state if needed
5. Add navigation link in `components/app-layout.tsx`:
   - `mainNavItems` array for primary nav (shows in bottom bar on mobile)
   - `moreNavItems` array for secondary nav (in "More" drawer)

### Adding a new data entity
1. Define TypeScript interface in `lib/types.ts`
2. Add table to Dexie schema in `db/index.ts`
3. Increment database version and add migration if needed
4. Create Zustand store in `stores/` following existing pattern
5. Add `loadX()` call to `hooks/use-data.ts` in `useInitializeData()`
6. Add to export/import in `stores/app.ts` (`exportData` and `importData`)

### Adding analysis feature
1. In-browser logic goes in `services/analysis.ts`
2. Ollama prompts go in `services/ollama.ts`
3. Always implement fallback via `getDeepAnalysis()` pattern

## Important Notes

1. **Offline-first**: Never assume network. All features must work without internet.
2. **No backend**: This is a client-only app. All data in IndexedDB.
3. **Graceful degradation**: Ollama features are optional enhancements.
4. **Mobile-first**: Design for mobile, enhance for desktop.
5. **User data ownership**: Export/import all data as JSON via settings.
6. **Performance**: Next.js App Router handles code splitting automatically.
7. **shadcn/ui**: Use existing components from `components/ui/` - don't reinvent.

## Environment Variables

**None required.** This is a fully client-side app with no backend.

Optional: Ollama URL is configured in-app via Settings page (stored in IndexedDB).

## Testing

**Current state**: No tests implemented yet.

Recommended testing focus when adding:
- Database operations (CRUD for each entity)
- Progress calculations (goal hierarchy rollup)
- Recurring task generation logic
- Streak calculations
- Sentiment analysis accuracy

## Known Issues & Gotchas

### TypeScript Build Errors Ignored
```javascript
// next.config.mjs
typescript: { ignoreBuildErrors: true }
```
The build ignores TS errors. Always run `npx tsc --noEmit` manually before committing.

### Dexie Boolean Indexing
```typescript
// Dexie stores booleans as 0/1, not true/false
// When querying:
.where("isActive").equals(1)  // ✓ correct
.where("isActive").equals(true)  // ✗ won't work
```

### Date Formats
All dates stored as ISO strings:
- `scheduledDate`: `"2025-01-15"` (date only)
- `timestamp`: Full `Date` object (for journal entries)
- `week`: `"2025-W03"` format
- `month`: `"2025-01"` format

### Component Hydration
All page components must be `"use client"` since they depend on IndexedDB/Zustand state. Server components won't have access to client-side data.

### Images Unoptimized
```javascript
// next.config.mjs
images: { unoptimized: true }
```
Next.js Image optimization disabled - images served as-is.

## Incomplete Features

Features that exist in UI but need implementation:
1. **Quick Actions FAB** - Dropdown shows but actions don't do anything
2. **Onboarding Wizard** - Page exists but flow may be incomplete
3. **Calendar View** - Basic page, may need schedule block integration
4. **Recurring Task Auto-Generation** - `generateRecurringTasks()` exists but may not be called automatically

## When In Doubt

- Simpler is better
- Make it work offline first
- Typography and whitespace over decorative elements
- User should be able to start using immediately without setup
- Analysis is a nice-to-have, core task/goal tracking is essential
- Run `npx tsc --noEmit` before committing to catch type errors
