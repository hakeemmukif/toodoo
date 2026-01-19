# CLAUDE.md - Toodoo Life Tracker

## Overview
**Personal coach app** for a Malaysian software engineer (muay thai, DJing, fintech). Offline-first, no backend, productivity principles baked in invisibly. Combines psychological excavation with daily task management — the "why" layer above the "what."

---

## Tech Stack
Next.js 16 + React 19 + TypeScript | Tailwind v4 | Dexie.js (IndexedDB) | Zustand | shadcn/ui | React Three Fiber (lazy) | Ollama (optional)

---

## Critical Rules

1. **NO BOOK/AUTHOR REFERENCES IN UI** - User never sees "Atomic Habits", "Deep Work", "Dan Koe", etc. Principles work invisibly.
2. **NO CO-AUTHORED-BY IN COMMITS** - Keep commits clean.
3. **Run `npx tsc --noEmit` before committing**

### Behavioral Thresholds
- `deferCount >= 2`: Show resistance indicator
- `deferCount >= 3`: Prompt for resistanceNote + vision alignment check
- Goals: Forced unique priority ranking (no ties)
- YearlyGoal creation: Requires linking to active LifeVision

---

## Core Concept: The Hierarchy
```
LifeVision (why — the psychological foundation)
  → YearlyGoal (what — links to visionId)
    → MonthlyGoal (project / "boss fight")
      → WeeklyGoal
        → Task (daily actions)
```

The app tracks **what** and **when**. The vision layer provides the **why** — making goals stick by connecting them to identity.

---

## Data Architecture

### Life Aspects
```typescript
type LifeAspect = 'fitness' | 'nutrition' | 'career' | 'financial' | 'side-projects' | 'chores';
```

### Vision Layer (Foundation)
```typescript
interface LifeVision {
  id: string;

  // Anti-Vision (the life you refuse to live)
  antiVision: string;              // One sentence compression
  antiVisionDetailed: string;      // "Average Tuesday in 10 years" exercise

  // Vision (the life you're building toward)
  vision: string;                  // One sentence compression
  visionDetailed: string;          // "Ideal Tuesday in 3 years" exercise

  // Identity
  identityStatement: string;       // "I am the type of person who..."
  identityBeliefs: string[];       // What you'd have to believe for vision to feel natural

  // Constraints (the rules of your game)
  constraints: string[];           // What you won't sacrifice

  // Meta
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;               // Only one active vision at a time
}

interface ExcavationSession {
  id: string;
  visionId: string;                // Links to the vision this created/updated
  phase: 'morning' | 'day' | 'evening';
  completedAt?: Date;

  // Stores all prompt responses
  responses: {
    promptId: string;
    question: string;
    answer: string;
    answeredAt: Date;
  }[];

  // AI-extracted or user-tagged insights
  insights: string[];
}

interface PatternInterrupt {
  id: string;
  question: string;                // The contemplation question
  scheduledFor: Date;
  isRandom: boolean;               // Random time vs fixed schedule

  // Response
  response?: string;
  respondedAt?: Date;
  skipped: boolean;

  // Connection to vision
  alignmentCheck?: 'toward-vision' | 'toward-anti-vision' | 'neutral';
}
```

### Goal Hierarchy

YearlyGoal → MonthlyGoal → WeeklyGoal → Task (progress bubbles up)
```typescript
interface YearlyGoal {
  id: string;
  title: string;
  aspect: LifeAspect;
  priority: number;                // Unique, no ties

  // Vision connection (required)
  visionId: string;
  identityStatement: string;       // How achieving this reinforces identity
  isHellYes: boolean;              // Constraint check: worth the sacrifice?
  antiVisionEscape: string;        // "This moves me away from [aspect of anti-vision]"

  // Progress
  status: 'active' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}
```

### Key Fields
- **Task**: `minimumVersion`, `deferCount`, `resistanceNote`, `isHardThing`
- **YearlyGoal**: `priority` (unique), `isHellYes`, `identityStatement`, `visionId`, `antiVisionEscape`
- **ScheduleBlock**: `depth: 'deep' | 'shallow' | 'recovery'`
- **JournalEntry**: `energyLevel` (1-5), `sleepQuality` (1-5), `excavationSessionId?`, `fromInterruptId?`

### Date Formats
`scheduledDate`: "2025-01-15" | `week`: "2025-W03" | `month`: "2025-01"

---

## Key Features

### Foundation / North Star View

Dedicated view showing the vision layer. Always accessible, reminds user of the "why."
```
┌─────────────────────────────────────────┐
│  THE LIFE I REFUSE TO LIVE              │
│  [antiVision sentence]                  │
├─────────────────────────────────────────┤
│  THE LIFE I'M BUILDING                  │
│  [vision sentence]                      │
├─────────────────────────────────────────┤
│  I AM THE TYPE OF PERSON WHO...         │
│  [identityStatement]                    │
├─────────────────────────────────────────┤
│  MY RULES                               │
│  • [constraints...]                     │
└─────────────────────────────────────────┘
```

**Location**: `components/foundation/`

### Excavation Protocol

Guided onboarding OR periodic reset (quarterly/yearly). Three phases:

| Phase | When | Purpose |
|-------|------|---------|
| Morning | Start of protocol | Psychological excavation — anti-vision + vision building |
| Day | Throughout (interrupts) | Pattern breaking — contemplation questions |
| Evening | End of protocol | Synthesis — compress insights into actionable direction |

**Prompt categories**:
- Dissatisfaction awareness
- Anti-vision construction ("average Tuesday in 10 years")
- Vision construction ("ideal Tuesday in 3 years")
- Identity statements
- Constraint definition

**Location**: `services/excavation/`

### Pattern Interrupts

Push notifications at random times with contemplation questions.
```typescript
interface InterruptSchedule {
  enabled: boolean;
  frequency: 'low' | 'medium' | 'high';  // 3, 5, or 8 per day
  quietHours: { start: string; end: string };  // "22:00" - "07:00"
  preferredWindows: string[];  // Times likely commuting/walking
}
```

**Sample questions**:
- "What am I avoiding right now by doing what I'm doing?"
- "Am I moving toward the life I hate or the life I want?"
- "What did I do today out of identity protection rather than genuine desire?"

**UI**: Quick capture → optional expand to full journal entry.

**Location**: `services/pattern-interrupts/`

### Resistance + Vision Alignment

When `deferCount >= 3` and user adds resistanceNote, prompt vision check:
```
"You've deferred this 3 times. Is this task actually aligned
with the life you're building? Or something you think you 'should' do?"

Options:
- "Aligned, just resisting" → Keep, suggest breakdown
- "Not actually aligned" → Archive with note
- "I don't know" → Link to relevant excavation prompt
```

### Intelligent Inbox

Natural language parsing: "training today 7pm bunker kd" → extracts WHAT, WHEN, WHERE with confidence scores. Malaysian context: `kd` → Kota Damansara, `bunker` → The Bunker gym.

**Location**: `services/inbox-parser/`

### 3D Solar System

12 planets = 12 months. Planets evolve from barren to thriving based on activity (tasks, goals, habits, journal, events).

**Enhancement**: Tap sun to see vision statement. Sun brightness reflects vision clarity / recent excavation.

**Location**: `components/landscape/`

| Fill State | Visual |
|------------|--------|
| 0% | Dark asteroid |
| 1-25% | Rocky surface |
| 26-50% | Terrain forming |
| 51-75% | Oceans visible |
| 76-100% | Lush planet with rings/moons |

### Ollama Integration

Optional LLM at `localhost:11434`. All features work without it (rule-based fallbacks).

**Vision layer usage**: Can analyze excavation responses for contradictions, but never rewrites user's words.

---

## Store Pattern
```typescript
// Zustand: update IndexedDB AND local state together
addItem: async (data) => {
  await db.items.add(item)
  set((state) => ({ items: [...state.items, item] }))
}
```

**SSR Safety**: All pages need `"use client"` + hydration check.

---

## Design System

**Aesthetic**: Warm, tactile, typography-forward. Moleskine meets minimal Japanese app.

| Aspect | Color |
|--------|-------|
| Fitness | terracotta #C4726C |
| Nutrition | sage #7D9B76 |
| Career | slate blue #6B7B8C |
| Financial | warm gold #B8A068 |
| Side Projects | dusty purple #8B7B8E |
| Chores | warm gray #9B9590 |

**Vision Layer Colors**:
| Element | Color |
|---------|-------|
| Anti-vision | muted ember #8B5A5A |
| Vision | warm ivory #F5F0E6 |
| Identity | soft gold #C9B896 |

**Typography**: Newsreader (headers), Inter (body), JetBrains Mono (metadata)

**Avoid**: Bright badge pills, harsh shadows, gradient backgrounds, guilt-tripping copy.

---

## Key Files

| Path | Purpose |
|------|---------|
| `lib/types.ts` | TypeScript interfaces |
| `db/index.ts` | Dexie schema |
| `stores/*.ts` | Zustand stores |
| `stores/vision-store.ts` | LifeVision + ExcavationSession state |
| `stores/interrupt-store.ts` | PatternInterrupt state + scheduling |
| `services/inbox-parser/` | NL parsing |
| `services/excavation/` | Protocol prompts + flow logic |
| `services/excavation/prompts.ts` | All excavation questions by phase |
| `services/pattern-interrupts/` | Interrupt scheduling + notification |
| `components/landscape/` | 3D visualization |
| `components/foundation/` | Vision/anti-vision display |
| `components/excavation/` | Protocol flow UI |

---

## Commands
```bash
npm run dev          # Dev server
npm run build        # Production build
npx tsc --noEmit     # TypeScript check (required)
```

---

## Gotchas

- **Dexie booleans**: `.where("isActive").equals(1)` not `.equals(true)`
- **Path aliases**: `@/db`, `@/lib/types`, `@/components/ui/button`
- **Excavation responses**: Store raw user input, never AI-rewrite
- **Pattern interrupts**: Always skippable, never guilt-trip on skip

---

## Guiding Principles

1. Offline-first (never assume network)
2. Coach not tracker (guides behavior)
3. Mobile-first design
4. Simpler is better
5. Typography over decoration
6. Principles invisible to user
7. Vision layer present but not preachy — shows up when relevant
8. User's words are sacred — never rewrite their excavation responses
9. Identity > actions — change who you are, behavior follows
