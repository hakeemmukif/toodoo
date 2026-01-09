# CLAUDE.md - Life Tracker App

## User Context

Software engineer in Malaysia: trains muay thai, DJs (French house, Nu Disco), works in fintech. Prefers direct communication. Values simple systems that get used. Wants to cook more, track savings (not budgeting).

**App vibe**: Personal coach, not corporate productivity tool.

---

## Core Philosophy

- **Offline-first**: All features work without internet. Data in IndexedDB via Dexie.js.
- **Local data ownership**: No backend. Export/import JSON via settings.
- **Principle-driven**: Productivity principles baked in invisibly (user never sees book/author names).
- **Ollama optional**: AI features gracefully degrade when unavailable.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Storage**: IndexedDB via Dexie.js
- **State**: Zustand
- **UI**: shadcn/ui (Radix), React Hook Form + Zod, Recharts, Lucide icons
- **Analysis**: `sentiment` npm package (in-browser)
- **LLM**: Ollama at localhost:11434 (optional)

---

## Critical Rules

### NO BOOK/AUTHOR REFERENCES IN UI
User never sees "Atomic Habits", "Essentialism", "Deep Work", "Goggins", etc. Principles work invisibly.

| User Sees | Internal Principle |
|-----------|-------------------|
| "Skipped 3 times. What's blocking you?" | Resistance tracking |
| "Can't do full thing? 10-minute version?" | Minimum version fallback |
| "23 days strong. One skip is fine, don't skip twice." | Never miss twice |
| "Is this a hell yes?" | Forced commitment check |
| "Deep focus: 3.2 hours" | Focus depth tracking |
| "What's the ONE thing?" | Priority forcing |

### NO CO-AUTHORED-BY IN COMMITS
Never add "Co-Authored-By: Claude" or any AI attribution to git commits. Keep commits clean.

### Key Behavioral Thresholds
- `deferCount >= 2`: Show resistance indicator
- `deferCount >= 3`: Prompt for resistanceNote
- Streaks: Track "days since double-miss" not just current streak
- Goals: Forced unique priority ranking (no ties)

---

## Data Architecture

### Life Aspects
```typescript
type LifeAspect = 'fitness' | 'nutrition' | 'career' | 'financial' | 'side-projects' | 'chores';
```

### Goal Hierarchy
YearlyGoal → MonthlyGoal → WeeklyGoal → Task

Progress bubbles up: task completion → weekly → monthly → yearly progress.

### Key Fields (see `lib/types.ts` for full interfaces)

**Task behavioral fields:**
- `minimumVersion?: string` - "Can't do full task? Do this instead"
- `deferCount: number` - Track avoidance (default 0)
- `resistanceNote?: string` - Why is this hard?
- `isHardThing?: boolean` - Mark difficult tasks

**YearlyGoal behavioral fields:**
- `priority: number` - Forced unique ranking
- `isHellYes?: boolean` - Commitment check
- `identityStatement?: string` - "Become someone who..."

**ScheduleBlock:**
- `depth: 'deep' | 'shallow' | 'recovery'` - Focus tracking

**JournalEntry:**
- `energyLevel?: number` (1-5), `sleepQuality?: number` (1-5)
- `promptCategory?: string` - Internal only, never shown to user

**TrainingType:** `'muay-thai' | 'cardio' | 'strength' | 'flexibility' | 'dj-practice' | 'other'`

### Date Formats
- `scheduledDate`: `"2025-01-15"` (date only string)
- `timestamp`: Full `Date` object
- `week`: `"2025-W03"` format
- `month`: `"2025-01"` format

---

## Intelligent Inbox

Natural language parsing for quick task capture. Extracts WHO, WHAT, WHEN, WHERE from text input and generates START-MIDDLE-END task breakdowns.

### Example Flow
```
Input: "training today at 7pm bunker kota damansara"
Output:
  - what: "Training" (0.95)
  - when: date="2026-01-07", time="19:00" (0.98)
  - where: "The Bunker, Kota Damansara" (0.95)
  - aspect: "fitness" (0.92)
  - breakdown: Warm up → Main session → Cool down
```

### Parsing Architecture

**Services** (`services/inbox-parser/`):
| File | Purpose |
|------|---------|
| `index.ts` | Main orchestrator, combines all extractors |
| `entity-extractors/date-extractor.ts` | Relative/absolute date parsing |
| `entity-extractors/time-extractor.ts` | Time and duration parsing |
| `malaysian-context.ts` | Local locations and abbreviations |
| `intent-classifier.ts` | LifeAspect classification |
| `confidence-scorer.ts` | Confidence calculation and auto-fill decisions |
| `breakdown-generator.ts` | START-MIDDLE-END task structure |
| `ollama-parser.ts` | LLM enhancement when available |

### Malaysian Context

**Abbreviations auto-expanded:**
- `kd` → "Kota Damansara"
- `pj` → "Petaling Jaya"
- `bunker` → "The Bunker" (gym)
- `tmr`/`esok` → tomorrow

**Known locations:** Bunker KD, Celebrity Fitness, FF 24, Jaya Grocer, Village Grocer, etc.

### Confidence Levels

| Level | Score | Action |
|-------|-------|--------|
| High | >= 0.80 | Quick confirm (one-tap create) |
| Medium | 0.50-0.79 | Suggest with review |
| Low | < 0.50 | Manual entry required |

### Task Breakdown (Implementation Intentions)

Based on Gollwitzer's research: "When X, I will Y at Z" format.

**Structure per aspect:**
```typescript
// fitness breakdown
{
  trigger: "When it's 7pm and I arrive at Bunker",
  steps: [
    { title: "Warm up", duration: 15 },
    { title: "Main session", duration: 60 },
    { title: "Cool down & stretch", duration: 15 }
  ],
  completionCriteria: "Training session completed",
  environmentalCue: "Gym bag packed by door"
}
```

### Ollama Integration

- **Status indicator**: Shows on dashboard and inbox page
- **Graceful fallback**: Rule-based parsing always works
- **Hybrid mode**: LLM enhances low-confidence parses
- **Timeout**: 10s max for LLM calls

### UI Components (`components/inbox/`)

| Component | Purpose |
|-----------|---------|
| `parsed-preview.tsx` | Quick confirm UI with confidence badges |
| `ollama-status.tsx` | Connection status indicator |

---

## Store Pattern

All Zustand stores follow:
```typescript
// State
items: Item[]
isLoading: boolean
error: string | null

// Load once on init
loadItems: async () => {
  const items = await db.items.toArray()
  set({ items })
}

// CRUD: update IndexedDB AND local state
addItem: async (data) => {
  await db.items.add(item)
  set((state) => ({ items: [...state.items, item] }))
}
```

### Hydration (SSR safety)
```typescript
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null
```

All pages need `"use client"` directive.

---

## Ollama Integration

- Check: `GET http://localhost:11434/api/tags`
- Generate: `POST http://localhost:11434/api/generate` with `{ model, prompt, stream: false }`
- Status indicator on dashboard and inbox page

| Feature | Ollama Required | Fallback |
|---------|-----------------|----------|
| Inbox parsing | No | Rule-based extraction |
| Journal analysis | No | Rule-based sentiment |
| AI Goal Planning | **Yes** | Manual wizard only |
| Other analysis | No | Pattern matching |

---

## Design System

**Aesthetic**: Warm, tactile, typography-forward. Moleskine meets minimal Japanese app.

**Colors** (OKLCH, muted earthy):
- Background: `oklch(0.986 0.003 85.87)` (#FAF9F7)
- Foreground: `oklch(0.25 0 0)` (#2D2D2D)
- Fitness: terracotta (#C4726C)
- Nutrition: sage (#7D9B76)
- Career: slate blue (#6B7B8C)
- Financial: warm gold (#B8A068)
- Side Projects: dusty purple (#8B7B8E)
- Chores: warm gray (#9B9590)
- Dark mode bg: (#1C1B1A)

**Typography**: Newsreader (headers), Inter (body), JetBrains Mono (metadata)

**Avoid**: Bright badge pills, harsh shadows, generic SaaS aesthetic, gradient backgrounds.

---

## Coach Tone (`coachTone` setting)

| Tone | Example |
|------|---------|
| gentle | "Nice work! Maybe tomorrow for this one?" |
| balanced | "Done. Deferred - what's blocking you?" |
| intense | "Done. Next. Deferred again - name the resistance." |

---

## Journal Prompts

Categories (internal only, never shown): `energy`, `resistance`, `consistency`, `focus`, `priority`, `progress`, `honesty`, `clarity`

See `lib/prompts.ts` for full prompt list. Selection logic in `services/prompts.ts`.

Goal-based prompts: 50% chance to generate prompt from active goals.

---

## Gotchas

### Dexie Boolean Indexing
```typescript
.where("isActive").equals(1)  // correct
.where("isActive").equals(true)  // won't work
```

### TypeScript Build Errors
```javascript
// next.config.mjs ignores TS errors
typescript: { ignoreBuildErrors: true }
```
**Always run `npx tsc --noEmit` before committing.**

### Path Aliases
```typescript
import { db } from "@/db"
import { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
```

---

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check (required before commits)
```

---

## Key Files

| Path | Purpose |
|------|---------|
| `lib/types.ts` | All TypeScript interfaces |
| `db/index.ts` | Dexie schema (v4: parsing + breakdown fields) |
| `stores/*.ts` | Zustand stores (one per entity) |
| `services/*.ts` | Business logic (analysis, progress, resistance, streaks) |
| `services/inbox-parser/` | Natural language parsing services |
| `services/ollama.ts` | Ollama LLM integration |
| `lib/prompts.ts` | Journal prompt definitions |
| `components/providers.tsx` | DataProvider for IndexedDB init |
| `components/inbox/` | Parsing UI components |

---

## Adding New Features

### New page
1. Create `app/[route]/page.tsx` with `"use client"`
2. Wrap in `<AppLayout>`
3. Add nav link in `components/app-layout.tsx`

### New data entity
1. Interface in `lib/types.ts`
2. Table in `db/index.ts` (increment version)
3. Store in `stores/`
4. Add `loadX()` to `hooks/use-data.ts`

### New behavioral principle
- Update types/db/stores if new fields needed
- **Never expose book/author names in UI**

---

## Important Notes

1. **Offline-first**: Never assume network
2. **No backend**: Client-only, IndexedDB storage
3. **Mobile-first**: Design for mobile, enhance for desktop
4. **Coach not tracker**: App guides behavior, doesn't just record
5. **Plain language**: No jargon, no book titles, explain concepts simply
6. **Run `npx tsc --noEmit` before committing**

---

## When In Doubt

- Simpler is better
- Make it work offline first
- Typography and whitespace over decoration
- Principles baked in invisibly
- User starts immediately without setup
