# CLAUDE.md - Life Tracker App

## Who This Is For

This app is built for a software engineer based in Malaysia who:
- Trains muay thai and wants to track fitness goals
- DJs as a hobby (French house, Nu Disco) with a DDJ-400
- Works in fintech and needs to balance career goals with personal life
- Prefers direct, no-bullshit communication
- Values systems that actually get used over elaborate setups
- Wants to cook more and order less
- Has financial goals to track (savings, not detailed budgeting)

The app should feel like a personal coach, not a corporate productivity tool.

---

## Project Overview

Life Tracker is a personal life management webapp that helps users track goals, tasks, journal entries, meals, training, recipes, and shopping lists. It uses a hierarchical goal system where yearly goals break down into monthly and weekly targets, with daily task completion bubbling up to show progress.

**Core philosophy**: Offline-first, local data ownership, flexible scheduling, AI analysis optional.

**Principle-driven**: The app bakes in proven productivity and habit-building principles as default behavior. The user experiences the benefits without knowing the source.

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
│   ├── inbox/           # Quick capture inbox
│   ├── journal/         # Journal entries
│   ├── meals/           # Meal logging
│   ├── onboarding/      # Onboarding wizard
│   ├── recipes/         # Recipe CRUD
│   ├── review/          # Weekly review ritual
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
│   ├── resistance-indicator.tsx  # Deferred task warning
│   ├── deep-focus-badge.tsx      # Focus depth indicator
│   ├── streak-display.tsx        # Never skip twice logic
│   ├── journal-prompt.tsx        # Rotating prompts
│   ├── commitment-check-modal.tsx # "Hell yes?" check
│   ├── weekly-review.tsx         # Weekly review flow
│   ├── principle-tooltip.tsx     # Explains concepts (no book refs)
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
│   ├── shopping.ts      # Shopping lists and items
│   ├── inbox.ts         # Inbox items
│   ├── reviews.ts       # Weekly reviews
│   └── financial.ts     # Financial snapshots
├── services/            # Business logic
│   ├── analysis.ts      # Sentiment, aspect detection, patterns
│   ├── progress.ts      # Goal progress calculations
│   ├── resistance.ts    # Avoidance detection
│   ├── deep-focus.ts    # Focus ratio calculations
│   ├── streaks.ts       # Never skip twice logic
│   ├── prompts.ts       # Journal prompt rotation
│   └── ollama.ts        # LLM integration
├── hooks/               # Custom React hooks
│   ├── use-data.ts      # Data loading hook
│   ├── use-mobile.ts    # Mobile detection
│   └── use-toast.ts     # Toast notifications
├── lib/                 # Utilities and types
│   ├── types.ts         # TypeScript interfaces
│   ├── constants.ts     # Aspect configuration
│   ├── prompts.ts       # Journal prompt definitions
│   ├── utils.ts         # Helper functions (cn, etc.)
│   └── sample-data.ts   # Sample data for development
└── public/              # Static assets
```

---

## Behavioral Principles (Internal Reference Only)

**CRITICAL: No book names, author names, or framework references appear anywhere in the UI.** The user never sees "Atomic Habits", "Essentialism", "Deep Work", "Goggins", etc. They just experience the principles working invisibly.

This section is for **developer context only** - understanding WHY features work the way they do. The implementation is principle-based, not book-based.

### What the user sees vs what we know

| User Experience | Internal Principle (never shown) |
|-----------------|----------------------------------|
| "You've skipped this 3 times. What's blocking you?" | Resistance (War of Art) |
| "Can't do the full thing? What's the 10-minute version?" | 2-Minute Rule (Atomic Habits) |
| "23 days strong. One skip is fine, just don't skip twice." | Never Miss Twice (Atomic Habits) |
| "Is this a hell yes? If not, maybe pass." | Hell Yes or No (Essentialism) |
| "Deep focus: 3.2 hours today" | Deep Work tracking (Newport) |
| "What's the ONE thing this week?" | Essentialism |
| "Rate your week honestly, 1-10" | Accountability Mirror (Goggins) |

---

## Principle Implementation Reference

These frameworks inform the design. **None of this terminology appears in the app.**

### Atomic Habits (James Clear)

| Principle | Implementation |
|-----------|----------------|
| **Never Miss Twice** | Streaks show "days since double-miss" as primary metric, not just current streak |
| **2-Minute Rule** | Every task has optional `minimumVersion` field - "Can't do full task? Do this instead" |
| **Habit Stacking** | After completing a task, suggest related tasks: "You finished X, good time for Y?" |
| **Environment Design** | Weekly review prompt: "What would make next week easier?" |
| **Identity-Based** | Goals frame as "become someone who..." not just "do X" |

### The War of Art (Steven Pressfield)

| Principle | Implementation |
|-----------|----------------|
| **Resistance Tracking** | Tasks track `deferCount`. At 2+ deferrals, prompt: "What's the resistance here?" |
| **Turning Pro** | App language treats user as professional, not hobbyist. No coddling. |
| **Daily Battle** | Journal prompts: "What did Resistance win today?" / "Where did I go pro?" |
| **Showing Up** | Emphasis on doing the work, not on feeling ready |

### Deep Work (Cal Newport)

| Principle | Implementation |
|-----------|----------------|
| **Block Depth** | ScheduleBlocks have `depth`: 'deep' / 'shallow' / 'recovery' |
| **Ratio Tracking** | Analysis shows deep vs shallow hours per day/week |
| **Fragmentation Alerts** | "Your deep work was split into 6 fragments today" |
| **Shutdown Ritual** | End-of-day prompt to close open loops |

### Essentialism (Greg McKeown)

| Principle | Implementation |
|-----------|----------------|
| **Forced Ranking** | Goals must have unique priority numbers. No ties allowed. |
| **Hell Yes or No** | When adding new goal/commitment: "Is this a HELL YES?" prompt |
| **Stop Doing List** | Quarterly review includes: "What should I eliminate?" |
| **Trade-off Awareness** | Adding goals shows: "This will compete with [existing priority]" |

### The Compound Effect (Darren Hardy)

| Principle | Implementation |
|-----------|----------------|
| **Micro-Progress** | Visualize tiny daily actions compounding: "47 sessions = 70+ hours stronger" |
| **Momentum Score** | Consistency metric separate from completion count |
| **Trend Lines** | Show progress direction, not just current state |

### Accountability (Goggins-inspired, balanced)

| Principle | Implementation |
|-----------|----------------|
| **40% Rule** | When marking task "too hard": "You're stronger than you think. What's 10% of this?" |
| **Accountability Mirror** | Weekly self-assessment with honest rating (1-10), no sugar-coating |
| **Hard Thing Tracking** | Mark tasks as `isHardThing`, celebrate pattern of doing difficult things |
| **Callusing the Mind** | Track discomfort faced, build mental toughness log |

### Getting Things Done (David Allen)

| Principle | Implementation |
|-----------|----------------|
| **Inbox** | Quick capture → must be processed into tasks/goals/trash |
| **Weekly Review** | Built-in Sunday ritual (configurable day), guided flow |
| **Next Action** | Projects (goals) require at least one concrete next task |
| **2-Minute Rule** | If processable in <2min, do it now, don't create task |
| **Contexts** | Time preferences (morning/afternoon/evening) act as contexts |

---

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

```typescript
// === TASKS ===
interface Task {
  id: string;
  weeklyGoalId?: string;
  aspect: LifeAspect;
  title: string;
  description?: string;
  scheduledDate: string;              // "2025-01-15"
  timePreference: TimePreference;     // morning/afternoon/evening/anytime
  hardScheduledTime?: string;         // "14:30" for fixed appointments
  durationEstimate?: number;          // minutes
  recurrenceTemplateId?: string;
  status: TaskStatus;
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Behavioral fields
  minimumVersion?: string;            // Fallback: "Can't do full task? Do this instead"
  deferCount: number;                 // Track avoidance (default 0)
  resistanceNote?: string;            // Why is this hard?
  isHardThing?: boolean;              // Mark difficult tasks
}

type TimePreference = 'morning' | 'afternoon' | 'evening' | 'anytime';
type TaskStatus = 'pending' | 'done' | 'skipped' | 'deferred';

// === GOALS ===
interface YearlyGoal {
  id: string;
  aspect: LifeAspect;
  title: string;
  description?: string;
  successCriteria: string;
  year: number;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Behavioral fields
  priority: number;                   // Forced ranking, unique, no ties
  isHellYes?: boolean;                // Commitment check
  identityStatement?: string;         // "Become someone who..."
}

interface MonthlyGoal {
  id: string;
  yearlyGoalId?: string;
  aspect: LifeAspect;
  title: string;
  successCriteria?: string;
  month: string;                      // "2025-01"
  status: GoalStatus;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

interface WeeklyGoal {
  id: string;
  monthlyGoalId?: string;
  aspect: LifeAspect;
  title: string;
  week: string;                       // "2025-W03"
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

type GoalStatus = 'active' | 'paused' | 'achieved' | 'abandoned';

// === SCHEDULE BLOCKS ===
interface ScheduleBlock {
  id: string;
  date: string;
  startTime: string;                  // "09:00"
  endTime: string;                    // "17:00"
  title: string;
  type: BlockType;
  linkedTaskId?: string;
  notes?: string;
  createdAt: Date;
  
  // Behavioral fields
  depth: 'deep' | 'shallow' | 'recovery';  // Focus depth tracking
}

type BlockType = 'work' | 'training' | 'meal_prep' | 'personal' | 'buffer';

// === JOURNAL ===
interface JournalEntry {
  id: string;
  timestamp: Date;
  content: string;
  
  // Auto-analyzed
  detectedAspects: LifeAspect[];
  sentimentScore: number;             // -1 to 1
  goalAlignment: 'positive' | 'neutral' | 'negative' | 'drift';
  linkedTaskIds?: string[];
  llmAnalysis?: string;
  
  // Prompt tracking (internal)
  promptUsed?: string;                // Which prompt triggered this entry
  promptCategory?: string;            // Internal category for analysis
  
  // Energy/Sleep (embedded, not separate tracking)
  energyLevel?: number;               // 1-5, how you're feeling
  sleepQuality?: number;              // 1-5, for morning entries
  sleepHours?: number;                // Optional, approximate hours slept
  
  createdAt: Date;
  updatedAt: Date;
}

// === TRAINING ===
interface TrainingSession {
  id: string;
  date: string;
  type: TrainingType;
  duration: number;                   // minutes
  intensity: number;                  // 1-10 (for DJ: focus level)
  notes?: string;                     // For DJ: what you practiced (transitions, beatmatching, new tracks)
  linkedTaskId?: string;
  isHardThing?: boolean;              // Was this a challenge/pushed yourself?
  createdAt: Date;
}

// Expanded to include DJ practice - uses same fields
// For DJ sessions: intensity = focus level, notes = what you worked on
type TrainingType = 'muay-thai' | 'cardio' | 'strength' | 'flexibility' | 'dj-practice' | 'other';

// === MEALS ===
interface Meal {
  id: string;
  date: string;
  type: MealType;
  description: string;
  cooked: boolean;
  recipeId?: string;
  notes?: string;
  createdAt: Date;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// === RECIPES ===
interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  tags: string[];
  nutrition?: Nutrition;
  sourceUrl?: string;
  lastCooked?: Date;
  timesCooked: number;
  rating?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RecipeIngredient {
  item: string;
  quantity: number;
  unit: string;
}

interface Nutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

// === SHOPPING ===
interface ShoppingList {
  id: string;
  store: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ShoppingItem {
  id: string;
  listId: string;
  item: string;
  category: string;
  quantity?: string;
  priority: 'need' | 'want' | 'someday';
  status: 'pending' | 'bought';
  linkedGoalId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// === FINANCIAL SNAPSHOTS ===
// Monthly check-in for financial goals - simple progress tracking, not full budgeting
interface FinancialSnapshot {
  id: string;
  date: string;                       // "2025-01-31" - typically end of month
  
  // Track what matters to you (all optional)
  savingsBalance?: number;            // Current savings
  netWorth?: number;                  // If tracking overall
  monthlyTarget?: number;             // What you aimed to save this month
  actualSaved?: number;               // What you actually saved
  
  // Goal check-in
  linkedGoalId?: string;              // Which financial goal this relates to
  onTrack: boolean;                   // Simple yes/no assessment
  notes?: string;                     // Context, wins, setbacks
  
  createdAt: Date;
}

// === RECURRENCE ===
interface RecurrenceTemplate {
  id: string;
  title: string;
  aspect: LifeAspect;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  daysOfWeek?: number[];              // 0-6, Sunday = 0
  timePreference: TimePreference;
  hardScheduledTime?: string;
  durationEstimate?: number;
  linkedGoalId?: string;
  minimumVersion?: string;            // Inherited by generated tasks
  isActive: boolean;
  createdAt: Date;
}

// === GTD INBOX ===
interface InboxItem {
  id: string;
  content: string;
  capturedAt: Date;
  processedAt?: Date;
  convertedToTaskId?: string;
  convertedToGoalId?: string;
  trashedAt?: Date;
}

// === WEEKLY REVIEW ===
interface WeeklyReview {
  id: string;
  weekOf: string;                     // "2025-W03"
  completedAt: Date;
  
  // Reflection
  wins: string[];
  struggles: string[];
  resistancePatterns: string[];       // What did you avoid?
  
  // Priority check
  stopDoingItems: string[];
  nextWeekFocus: string;              // The ONE thing
  
  // Self-assessment
  selfRating: number;                 // 1-10 honest assessment
  effortHonesty: string;              // "Am I being honest about my effort?"
  
  // Focus tracking
  deepWorkHours: number;
  shallowWorkHours: number;
  
  // Planning
  nextWeekIntentions: string[];
}

// === APP SETTINGS ===
interface AppSettings {
  id: 'settings';
  theme: 'light' | 'dark' | 'system';
  ollamaUrl: string;
  weekStartsOn: 0 | 1;                // Sunday (0) or Monday (1)
  
  // Prompt settings
  weeklyReviewDay: number;            // 0-6, default 0 (Sunday)
  weeklyReviewTime: string;           // "18:00"
  journalPromptMode: 'rotating' | 'pick' | 'none';
  preferredPromptCategories: string[]; // resistance, consistency, focus, priority, progress, honesty, clarity
  coachTone: 'gentle' | 'balanced' | 'intense';
  deepWorkDailyTarget: number;        // hours, default 4
  showPrincipleTooltips: boolean;     // Explain concepts on hover (no book refs)
}

// === STREAKS ===
interface StreakData {
  type: 'training' | 'cooking' | 'journal' | 'deep-work';
  current: number;
  longest: number;
  lastActivityDate?: string;
  lastMissDate?: string;
  daysSinceDoubleMiss: number;        // The real metric: one skip is fine, two breaks momentum
}
```

---

## Journal Prompt System

### Prompt Rotation

```typescript
interface JournalPrompt {
  id: string;
  category: PromptCategory;           // Internal categorization only
  prompt: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  aspect?: LifeAspect;
}

// Internal categories - NEVER shown to user
type PromptCategory = 
  | 'energy'          // Sleep/energy check-in
  | 'resistance'      // Facing avoidance
  | 'consistency'     // Showing up
  | 'focus'           // Deep work
  | 'priority'        // What matters
  | 'progress'        // Compound gains
  | 'honesty'         // Self-assessment
  | 'clarity'         // Mental capture
  | 'general';
```

### Default Prompts

User sees only the prompt text. Categories are for internal analysis/rotation logic.

```typescript
const JOURNAL_PROMPTS: JournalPrompt[] = [
  // === ENERGY/SLEEP (Morning) ===
  { category: 'energy', prompt: "How did you sleep? How's your energy today?", frequency: 'daily' },
  { category: 'energy', prompt: "Energy check: 1-5, what's affecting it?", frequency: 'daily' },
  
  // === RESISTANCE (Daily) ===
  { category: 'resistance', prompt: "What did I avoid today?", frequency: 'daily' },
  { category: 'resistance', prompt: "Where did I half-ass it when I could've gone all in?", frequency: 'daily' },
  { category: 'resistance', prompt: "What was I avoiding, and did I face it?", frequency: 'daily' },
  
  // === CONSISTENCY (Daily) ===
  { category: 'consistency', prompt: "What's one thing I could make slightly easier tomorrow?", frequency: 'daily' },
  { category: 'consistency', prompt: "Did I show up today, even if imperfectly?", frequency: 'daily' },
  { category: 'consistency', prompt: "What environment change would help me?", frequency: 'daily' },
  { category: 'consistency', prompt: "Who am I becoming through today's actions?", frequency: 'daily' },
  
  // === FOCUS (Daily) ===
  { category: 'focus', prompt: "How many hours of real, focused work did I do?", frequency: 'daily' },
  { category: 'focus', prompt: "What broke my concentration today?", frequency: 'daily' },
  { category: 'focus', prompt: "Did I protect my focus time?", frequency: 'daily' },
  
  // === HONESTY (Daily) ===
  { category: 'honesty', prompt: "What hard thing did I do today?", frequency: 'daily' },
  { category: 'honesty', prompt: "Where did I take the easy path?", frequency: 'daily' },
  { category: 'honesty', prompt: "Am I being honest with myself about my effort?", frequency: 'daily' },
  
  // === CLARITY (Daily) ===
  { category: 'clarity', prompt: "What's still in my head that needs to be written down?", frequency: 'daily' },
  { category: 'clarity', prompt: "What open loops are draining my energy?", frequency: 'daily' },
  
  // === PRIORITY (Weekly) ===
  { category: 'priority', prompt: "What should I have said no to this week?", frequency: 'weekly' },
  { category: 'priority', prompt: "What's the ONE thing that matters most right now?", frequency: 'weekly' },
  { category: 'priority', prompt: "What am I doing that doesn't actually matter?", frequency: 'weekly' },
  
  // === PROGRESS (Weekly) ===
  { category: 'progress', prompt: "What small actions am I stacking up?", frequency: 'weekly' },
  { category: 'progress', prompt: "Where am I being inconsistent?", frequency: 'weekly' },
  
  // === HONESTY (Weekly) ===
  { category: 'honesty', prompt: "Rate my week honestly, 1-10. Why?", frequency: 'weekly' },
  { category: 'honesty', prompt: "What uncomfortable truth am I avoiding?", frequency: 'weekly' },
  
  // === QUARTERLY ===
  { category: 'priority', prompt: "What should I stop doing entirely?", frequency: 'quarterly' },
  { category: 'priority', prompt: "Are my priorities still the right priorities?", frequency: 'quarterly' },
  { category: 'honesty', prompt: "Am I proud of who I'm becoming?", frequency: 'quarterly' },
];
```

### Prompt Selection Logic

```typescript
// services/prompts.ts
function getTodaysPrompt(settings: AppSettings, recentPrompts: string[]): JournalPrompt {
  const eligiblePrompts = JOURNAL_PROMPTS.filter(p => {
    // Filter by frequency
    if (p.frequency !== 'daily') return false;
    
    // Filter by user's preferred categories (if set)
    if (settings.preferredPromptCategories.length > 0) {
      if (!settings.preferredPromptCategories.includes(p.category)) return false;
    }
    
    // Don't repeat recent prompts (last 5)
    if (recentPrompts.includes(p.id)) return false;
    
    return true;
  });
  
  // Random selection from eligible
  return eligiblePrompts[Math.floor(Math.random() * eligiblePrompts.length)];
}
```

---

## Behavioral Analysis Services

### Resistance Detection

```typescript
// services/resistance.ts
interface ResistanceAnalysis {
  highResistanceTasks: Task[];        // deferCount >= 2
  patterns: string[];                 // e.g., "Fitness tasks on Mondays"
  suggestions: string[];
}

function analyzeResistance(tasks: Task[]): ResistanceAnalysis {
  const highResistance = tasks.filter(t => t.deferCount >= 2);
  
  // Pattern detection
  const patterns: string[] = [];
  
  // Group by aspect
  const byAspect = groupBy(highResistance, 'aspect');
  for (const [aspect, tasks] of Object.entries(byAspect)) {
    if (tasks.length >= 3) {
      patterns.push(`You consistently avoid ${aspect} tasks`);
    }
  }
  
  // Group by day of week
  const byDay = groupBy(highResistance, t => getDayOfWeek(t.scheduledDate));
  for (const [day, tasks] of Object.entries(byDay)) {
    if (tasks.length >= 2) {
      patterns.push(`${day}s seem to be avoidance days`);
    }
  }
  
  return { highResistanceTasks: highResistance, patterns, suggestions: [] };
}
```

### Deep Focus Tracking

```typescript
// services/deep-focus.ts
interface DeepFocusAnalysis {
  todayDeep: number;                  // hours
  todayShallow: number;
  weeklyDeep: number;
  weeklyShallow: number;
  ratio: number;                      // deep / total
  targetMet: boolean;
  fragmentationScore: number;         // How broken up was focus time?
  alerts: string[];
}

function analyzeDeepFocus(blocks: ScheduleBlock[], target: number): DeepFocusAnalysis {
  // Calculate hours by depth
  // Detect fragmentation (many short blocks vs few long ones)
  // Compare to target
  // Generate alerts
}
```

### Streak Calculation (Never Skip Twice)

```typescript
// services/streaks.ts
function calculateStreak(activities: { date: string }[]): StreakData {
  // Sort by date descending
  // Walk backwards counting consecutive days
  // Track last miss
  // Calculate days since DOUBLE miss (the key metric)
  
  // Key insight: Single miss is fine. Double miss breaks momentum.
  // Show: "23 days strong · Last slip-up: 8 days ago"
}
```

### Progress Visualization

```typescript
// services/progress.ts
interface CompoundProgress {
  aspect: LifeAspect;
  totalActions: number;
  totalTime: number;                  // minutes
  humanizedTime: string;              // "47 sessions = 70+ hours"
  trend: 'accelerating' | 'steady' | 'declining';
  projectedYearEnd: string;           // "At this rate, you'll hit 200 sessions"
}
```

---

## UI Components for Principles

**Remember: No book/author names in any user-facing text.**

### Resistance Indicator
```tsx
// components/resistance-indicator.tsx
// Shows on tasks with deferCount >= 2
// Subtle warning icon
// Tooltip: "You've skipped this 3 times. What's getting in the way?"
// Click opens modal to add resistanceNote
```

### Deep Focus Badge
```tsx
// components/deep-focus-badge.tsx
// Shows on ScheduleBlocks in calendar
// Visual depth: darker shade = deeper focus
// Hover shows: "Deep focus · 2.5 hours"
```

### Streak Display
```tsx
// components/streak-display.tsx
// Primary: "23 days strong"
// Secondary: "One skip is fine. Don't skip twice."
// Visual: Progress bar or flame icon
// Celebrates recovery, not just perfection
```

### Principle Tooltip
```tsx
// components/principle-tooltip.tsx
// Wraps any element with (i) icon
// On hover/tap, shows explanation IN PLAIN LANGUAGE
// Example: "The smallest version: What's the 10-minute version of this task?"
// NO book references. Just explain the concept.
// Can be disabled in settings
```

### Commitment Check Modal
```tsx
// components/commitment-check-modal.tsx
// Triggered when adding new YearlyGoal
// "Is this a hell yes? If you're not genuinely excited, consider passing."
// Options: "Hell yes" / "Let me think" / "Add anyway"
// Not blocking, just prompting reflection
```

### Weekly Review Flow
```tsx
// components/weekly-review.tsx (or app/review/page.tsx)
// Guided flow, not just a form
// Steps:
//   1. Review completed tasks (auto-populated)
//   2. What went well? (wins)
//   3. What was hard? (struggles)
//   4. What did you avoid?
//   5. Deep focus hours this week (auto-calculated)
//   6. What should you stop doing?
//   7. What's the ONE focus for next week?
//   8. Honest self-rating 1-10
// Takes ~10 minutes
// Saves as WeeklyReview entity
```

### Minimum Version Input
```tsx
// Part of task form
// Field: "Fallback version"
// Placeholder: "If I can't do the full task, I'll at least..."
// Tooltip: "What's the 10-minute version? Sometimes showing up matters more than doing it perfectly."
// When task is due and user hesitates, show: "Just do: [minimum version]"
```

---

## Database (Dexie.js)

All data stored in IndexedDB. No server. User owns their data.

```typescript
// db/index.ts
const db = new Dexie('LifeTrackerDB');

db.version(2).stores({
  yearlyGoals: 'id, aspect, year, status, priority',
  monthlyGoals: 'id, yearlyGoalId, aspect, month, status, priority',
  weeklyGoals: 'id, monthlyGoalId, aspect, week, status',
  tasks: 'id, weeklyGoalId, aspect, scheduledDate, status, recurrenceTemplateId, deferCount',
  recurrenceTemplates: 'id, aspect, isActive',
  journalEntries: 'id, timestamp, *detectedAspects, goalAlignment, promptCategory, energyLevel',
  trainingSessions: 'id, date, type, isHardThing',
  meals: 'id, date, type, recipeId, cooked',
  recipes: 'id, *tags, rating',
  shoppingLists: 'id, store',
  shoppingItems: 'id, listId, category, status, priority',
  scheduleBlocks: 'id, date, type, depth, linkedTaskId',
  inboxItems: 'id, capturedAt, processedAt',
  weeklyReviews: 'id, weekOf, completedAt',
  financialSnapshots: 'id, date, linkedGoalId, onTrack',
  appSettings: 'id',
  streakData: 'type'
});
```

---

## Critical Implementation Details

### Progress Calculation
```typescript
// Weekly progress = completed tasks / total tasks for that weekly goal
// Monthly progress = average of weekly goal progresses
// Yearly progress = average of monthly goal progresses
```

### Task Deferral Logic
```typescript
// When user defers a task:
task.deferCount += 1;
task.status = 'deferred';
task.scheduledDate = newDate;

// If deferCount >= 2, show resistance indicator
// If deferCount >= 3, prompt for resistanceNote
```

### Journal Analysis (In-Browser)
1. **Sentiment**: Use `sentiment` npm package, normalize to -1 to 1 range
2. **Aspect Detection**: Keyword matching against predefined dictionaries per aspect
3. **Goal Alignment**: Heuristic based on drift/progress indicators + sentiment score
4. **Framework Tagging**: Track which prompt was used, for pattern analysis

### Ollama Integration (Optional)
- Check connection: `GET http://localhost:11434/api/tags`
- Generate: `POST http://localhost:11434/api/generate` with `{ model, prompt, stream: false }`
- Always provide fallback to rule-based analysis when Ollama unavailable
- Use for: deep journal analysis, weekly nudges, monthly summaries, resistance insights

### Weekly Review Automation
```typescript
// On app load, check if weekly review is due
const lastReview = await db.weeklyReviews.orderBy('completedAt').last();
const currentWeek = getCurrentWeek();

if (!lastReview || lastReview.weekOf !== currentWeek) {
  // Show nudge: "Time for your weekly review"
  // Or show automatically on reviewDay at reviewTime
}
```

### Inbox Processing
```typescript
// Quick capture: just text, no categorization
// Processing options:
//   - Convert to Task (pick aspect, date, etc.)
//   - Convert to Goal
//   - Trash (not important)
//   - Do it now (if <2 min)

// Inbox should be empty = clear mind
// Show badge count on Inbox nav item
```

---

## Energy & Sleep Tracking

**Approach**: Embedded in journal, not separate logging. Low friction.

### How it works
- Journal entries have optional `energyLevel` (1-5) and `sleepQuality` (1-5) fields
- Morning journal prompts include energy/sleep check-in
- Fields appear at top of journal entry form, quick tap to set
- Analysis correlates energy with task completion, training, meals

### UI Implementation
```tsx
// In journal entry form, before the text area:
<div className="flex gap-4 mb-4">
  <div>
    <label>Energy</label>
    <StarRating value={energyLevel} onChange={setEnergyLevel} max={5} />
  </div>
  <div>
    <label>Sleep</label>
    <StarRating value={sleepQuality} onChange={setSleepQuality} max={5} />
  </div>
</div>
```

### Analysis patterns
- "Low energy days → 70% more likely to skip training"
- "Sleep < 3 correlates with negative journal sentiment"
- "Your best deep focus days follow sleep quality 4+"
- Weekly review shows average energy trend

---

## Financial Goal Tracking

**Approach**: Milestone-based goals + monthly snapshots. No transaction tracking.

### How it works
1. **Financial goals** use the same goal system (yearly → monthly)
   - Example: "Save RM20k by December 2025"
   - Success criteria: specific target amount
   
2. **Monthly snapshots** track progress
   - End of month: log current savings, whether on track
   - Simple form: amount saved, on track (yes/no), notes
   - App calculates if you're ahead/behind pace

3. **Analysis** shows trajectory
   - "At current pace, you'll hit RM18k by December (RM2k short)"
   - "3 months on track, 1 month behind"

### UI Implementation
- Financial snapshots accessible from Goals page when viewing financial goals
- Or dedicated simple page under "More"
- Monthly reminder: "Time for your financial check-in"

### No scope creep
- NOT a budgeting app
- NOT tracking individual transactions
- NOT categorizing expenses
- Just: "Here's my number, am I on track?"

---

## DJ Practice (Training Extension)

**Approach**: Uses existing training log with `dj-practice` type.

### How it works
- Training type dropdown includes "DJ Practice"
- Same fields apply:
  - **Duration**: How long you practiced
  - **Intensity**: Focus level (1-10) - were you locked in or distracted?
  - **Notes**: What you worked on (transitions, beatmatching, new tracks, set building)
  - **isHardThing**: Did you push yourself? (new technique, unfamiliar genre)

### Example entries
```
Type: DJ Practice
Duration: 60 min
Intensity: 7
Notes: "Worked on transitions between French house and Nu Disco. 
       Struggled with BPM matching on faster tracks. 
       Found 3 new tracks that work well together."
isHardThing: true (tried harmonic mixing for first time)
```

### Analysis
- Tracks practice streaks alongside training
- "You've logged 12 DJ sessions this month - 8 hours total"
- Correlates with side-projects goal progress

---

## Coach Tone Settings

The app adjusts its language based on `coachTone` setting:

### Gentle
- "Nice work completing that task!"
- "Maybe tomorrow would be better for this?"
- "You're making progress, even small steps count"

### Balanced (Default)
- "Task done."
- "Deferred. What's blocking you?"
- "5 days since last double-miss. Keep it up."

### Intense
- "Done. Next."
- "Deferred again. What's the resistance? Name it."
- "You've been avoiding this for a week. Time to face it."
- "Good isn't good enough. What's next?"

---

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

**Principle UI**:
- Tooltips use a slightly different background to stand out
- Resistance indicators are subtle (muted orange/amber)
- Focus depth shown through opacity/saturation, not different colors
- Coach tone affects copy, not visual style

**Avoid**: Bright badge pills, harsh shadows, generic SaaS aesthetic, gradient backgrounds, any book/author references.

---

## Navigation Structure

**Desktop**: Left sidebar with sections
- Main: Dashboard, Calendar, Goals, Tasks, Journal
- Track: Training, Meals, Recipes
- Organize: Shopping, Inbox
- Reflect: Analysis, Review (Weekly)
- Settings

**Mobile**:
- Bottom nav (Dashboard, Calendar, Goals, Tasks, More)
- Sheet drawer for remaining items
- Floating Action Button (FAB) for quick actions

### Quick Actions (FAB)

- Add Task
- Capture to Inbox
- Write Journal
- Log Meal
- Log Training

---

## Data Initialization Pattern

The app uses a **DataProvider** wrapper that handles IndexedDB initialization:

```typescript
// components/providers.tsx
// 1. Waits for client-side mount (avoids SSR hydration issues)
// 2. Initializes app settings via useAppStore.initialize()
// 3. Loads all data in parallel via useInitializeData()
// 4. Shows loading spinner until ready
```

**Critical**: All pages wrapped in `<DataProvider>` in root layout.

### Store Pattern
Each Zustand store follows:
```typescript
// State
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
IndexedDB doesn't exist on server:
```typescript
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null  // Render nothing on server
```

---

## Path Aliases

```typescript
// tsconfig.json - all imports use @/* pointing to project root
import { db } from "@/db"
import { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { JOURNAL_PROMPTS } from "@/lib/prompts"
```

---

## Commands & Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Run production build
npm run lint         # Run ESLint
npx tsc --noEmit     # TypeScript check (recommended before commits)
```

---

## Common Tasks

### Adding a new page
1. Create page component in `app/[route]/page.tsx`
2. Add `"use client"` directive at top (required for data access)
3. Wrap content in `<AppLayout>` component
4. Add `loading.tsx` for loading state if needed
5. Add navigation link in `components/app-layout.tsx`

### Adding a new data entity
1. Define TypeScript interface in `lib/types.ts`
2. Add table to Dexie schema in `db/index.ts`
3. Increment database version and add migration if needed
4. Create Zustand store in `stores/` following existing pattern
5. Add `loadX()` call to `hooks/use-data.ts` in `useInitializeData()`
6. Add to export/import in `stores/app.ts`

### Adding a new behavioral principle
1. Add to this CLAUDE.md documentation (internal reference only)
2. If new data field: update types, db schema, stores
3. If new UI: create component in `components/`
4. If new analysis: add to `services/`
5. If new prompt: add to `lib/prompts.ts`
6. **Ensure NO book/author names appear in user-facing code**

### Adding analysis feature
1. In-browser logic goes in `services/`
2. Ollama prompts go in `services/ollama.ts`
3. Always implement fallback for when Ollama unavailable

---

## Important Notes

1. **Offline-first**: Never assume network. All features must work without internet.
2. **No backend**: This is a client-only app. All data in IndexedDB.
3. **Graceful degradation**: Ollama features are optional enhancements.
4. **Mobile-first**: Design for mobile, enhance for desktop.
5. **User data ownership**: Export/import all data as JSON via settings.
6. **No book/framework references in UI**: User never sees "Atomic Habits", "Essentialism", etc. Principles work invisibly.
7. **Coach tone matters**: `gentle` vs `balanced` vs `intense` changes copy throughout app.
8. **Tooltips explain concepts, not sources**: "What's the 10-minute version?" not "The 2-minute rule from Atomic Habits"

---

## Known Issues & Gotchas

### TypeScript Build Errors Ignored
```javascript
// next.config.mjs
typescript: { ignoreBuildErrors: true }
```
Always run `npx tsc --noEmit` manually before committing.

### Dexie Boolean Indexing
```typescript
// Dexie stores booleans as 0/1
.where("isActive").equals(1)  // ✓ correct
.where("isActive").equals(true)  // ✗ won't work
```

### Date Formats
- `scheduledDate`: `"2025-01-15"` (date only)
- `timestamp`: Full `Date` object
- `week`: `"2025-W03"` format
- `month`: `"2025-01"` format

### Component Hydration
All page components must be `"use client"` since they depend on IndexedDB/Zustand state.

---

## Incomplete Features (TODO)

1. **Quick Actions FAB** - Dropdown shows but actions need wiring
2. **Inbox page** - Quick capture/process flow
3. **Weekly Review page** - Guided review ritual
4. **Resistance indicators** - Show on high-defer tasks
5. **Deep focus tracking** - Calendar block depth, analysis
6. **Principle tooltips** - Component exists, needs plain-language content
7. **Commitment check modal** - Trigger on new goal creation
8. **Streak "never skip twice"** - Update calculation logic
9. **Fallback version** - Add field to task form, show when due
10. **Journal prompt rotation** - Implement selection logic
11. **Progress visualization** - Analysis page enhancement
12. **Coach tone settings** - Add to settings page, apply throughout app
13. **Energy/sleep fields** - Add to journal entry form, correlate in analysis
14. **Financial snapshots** - Monthly check-in page, goal progress tracking
15. **DJ practice type** - Add to training type dropdown

---

## When In Doubt

- Simpler is better
- Make it work offline first
- Typography and whitespace over decorative elements
- User should be able to start using immediately without setup
- Principles are baked in invisibly - user never sees source references
- The app is a coach, not a passive tracker
- Plain language only - no jargon, no book titles, no author names
- Run `npx tsc --noEmit` before committing