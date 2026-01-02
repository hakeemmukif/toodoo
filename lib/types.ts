// Life Aspects
export type LifeAspect =
  | "fitness"
  | "nutrition"
  | "career"
  | "financial"
  | "side-projects"
  | "chores"

// Time and Status Types
export type TimePreference = "morning" | "afternoon" | "evening" | "anytime"
export type TaskStatus = "pending" | "done" | "skipped" | "deferred"
export type GoalStatus = "active" | "paused" | "achieved" | "abandoned"
export type Priority = "need" | "want" | "someday"
export type ItemStatus = "pending" | "bought"
export type Sentiment = "positive" | "neutral" | "negative"
export type GoalAlignment = "positive" | "neutral" | "negative" | "drift"
export type TrainingType = "muay-thai" | "cardio" | "strength" | "flexibility" | "dj-practice" | "other"
export type MealType = "breakfast" | "lunch" | "dinner" | "snack"
export type BlockType = "work" | "training" | "meal_prep" | "personal" | "buffer"
export type BlockDepth = "deep" | "shallow" | "recovery"
export type RecurrenceFrequency = "daily" | "weekly" | "biweekly" | "monthly"
export type CoachTone = "gentle" | "balanced" | "intense"
export type JournalPromptMode = "rotating" | "pick" | "none"
export type PromptCategory =
  | "energy"
  | "resistance"
  | "consistency"
  | "focus"
  | "priority"
  | "progress"
  | "honesty"
  | "clarity"
  | "general"
export type PromptFrequency = "daily" | "weekly" | "monthly" | "quarterly"

// Goals
export interface YearlyGoal {
  id: string
  aspect: LifeAspect
  title: string
  description?: string
  successCriteria: string
  year: number
  status: GoalStatus
  priority: number // Forced ranking, unique, no ties
  isHellYes?: boolean // Commitment check
  identityStatement?: string // "Become someone who..."
  createdAt: Date
  updatedAt: Date
}

export interface MonthlyGoal {
  id: string
  yearlyGoalId?: string
  aspect: LifeAspect
  title: string
  successCriteria?: string
  month: string // Format: "2025-01"
  status: GoalStatus
  priority: number
  createdAt: Date
  updatedAt: Date
}

export interface WeeklyGoal {
  id: string
  monthlyGoalId?: string
  aspect: LifeAspect
  title: string
  week: string // Format: "2025-W03"
  status: GoalStatus
  createdAt: Date
  updatedAt: Date
}

// Tasks
export interface Task {
  id: string
  weeklyGoalId?: string
  aspect: LifeAspect
  title: string
  description?: string
  scheduledDate: string // Format: "2025-01-15"
  timePreference: TimePreference
  hardScheduledTime?: string // Format: "14:30"
  durationEstimate?: number // minutes
  recurrenceTemplateId?: string
  status: TaskStatus
  notes?: string
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  // Behavioral fields
  minimumVersion?: string // Fallback: "Can't do full task? Do this instead"
  deferCount: number // Track avoidance (default 0)
  resistanceNote?: string // Why is this hard?
  isHardThing?: boolean // Mark difficult tasks
}

export interface RecurrenceTemplate {
  id: string
  title: string
  aspect: LifeAspect
  frequency: RecurrenceFrequency
  daysOfWeek?: number[] // 0-6, Sunday = 0
  dayOfMonth?: number // 1-31, for monthly recurrence
  biweeklyStartDate?: string // Anchor date for biweekly calculation
  timePreference: TimePreference
  hardScheduledTime?: string
  durationEstimate?: number
  linkedGoalId?: string
  minimumVersion?: string // Inherited by generated tasks
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}

// Journal
export interface JournalEntry {
  id: string
  timestamp: Date
  content: string
  // Auto-analyzed
  detectedAspects: LifeAspect[]
  sentimentScore: number // -1 to 1
  goalAlignment: GoalAlignment
  linkedTaskIds?: string[]
  llmAnalysis?: string
  // Prompt tracking (internal)
  promptUsed?: string // Which prompt triggered this entry
  promptCategory?: PromptCategory // Internal category for analysis
  // Energy/Sleep (embedded, not separate tracking)
  energyLevel?: number // 1-5, how you're feeling
  sleepQuality?: number // 1-5, for morning entries
  sleepHours?: number // Optional, approximate hours slept
  createdAt: Date
  updatedAt: Date
}

// Journal Prompts
export interface JournalPrompt {
  id: string
  category: PromptCategory
  prompt: string
  frequency: PromptFrequency
  aspect?: LifeAspect
}

// Training
export interface TrainingSession {
  id: string
  date: string
  type: TrainingType
  duration: number // minutes
  intensity: number // 1-10 (for DJ: focus level)
  notes?: string // For DJ: what you practiced
  linkedTaskId?: string
  isHardThing?: boolean // Was this a challenge/pushed yourself?
  createdAt: Date
  updatedAt: Date
}

// Meals
export interface Meal {
  id: string
  date: string
  type: MealType
  description: string
  cooked: boolean
  recipeId?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Recipes
export interface RecipeIngredient {
  item: string
  quantity: number
  unit: string
}

export interface Nutrition {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface Recipe {
  id: string
  title: string
  description?: string
  ingredients: RecipeIngredient[]
  instructions: string
  prepTime: number
  cookTime: number
  servings: number
  tags: string[]
  nutrition?: Nutrition
  sourceUrl?: string
  lastCooked?: Date
  timesCooked: number
  rating?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Shopping
export interface ShoppingList {
  id: string
  store: string
  createdAt: Date
  updatedAt: Date
}

export interface ShoppingItem {
  id: string
  listId: string
  item: string
  category: string
  quantity?: string
  priority: Priority
  status: ItemStatus
  linkedGoalId?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Schedule
export interface ScheduleBlock {
  id: string
  date: string
  startTime: string // "09:00"
  endTime: string // "17:00"
  title: string
  type: BlockType
  linkedTaskId?: string
  notes?: string
  depth: BlockDepth // Focus depth tracking
  createdAt: Date
  updatedAt: Date
}

// GTD Inbox
export interface InboxItem {
  id: string
  content: string
  capturedAt: Date
  processedAt?: Date
  convertedToTaskId?: string
  convertedToGoalId?: string
  trashedAt?: Date
}

// Weekly Review
export interface WeeklyReview {
  id: string
  weekOf: string // "2025-W03"
  completedAt: Date
  // Reflection
  wins: string[]
  struggles: string[]
  resistancePatterns: string[] // What did you avoid?
  // Priority check
  stopDoingItems: string[]
  nextWeekFocus: string // The ONE thing
  // Self-assessment
  selfRating: number // 1-10 honest assessment
  effortHonesty: string // "Am I being honest about my effort?"
  // Focus tracking
  deepWorkHours: number
  shallowWorkHours: number
  // Planning
  nextWeekIntentions: string[]
}

// Financial Snapshots
export interface FinancialSnapshot {
  id: string
  date: string // "2025-01-31" - typically end of month
  // Track what matters (all optional)
  savingsBalance?: number
  netWorth?: number
  monthlyTarget?: number
  actualSaved?: number
  // Goal check-in
  linkedGoalId?: string
  onTrack: boolean
  notes?: string
  createdAt: Date
}

// Streaks
export interface StreakData {
  type: "training" | "cooking" | "journal" | "deep-work"
  current: number
  longest: number
  lastActivityDate?: string
  lastMissDate?: string
  daysSinceDoubleMiss: number // The real metric
}

// Onboarding State
export interface OnboardingState {
  started: boolean
  completedAspects: LifeAspect[]
  skippedAspects: LifeAspect[]
  completed: boolean
}

// Analysis Types
export interface DailyStats {
  date: string
  tasksPlanned: number
  tasksCompleted: number
  tasksSkipped: number
  completionRate: number
  aspectBreakdown: Record<LifeAspect, {
    planned: number
    completed: number
  }>
  trainingLogged: boolean
  mealsLogged: number
  journalWritten: boolean
  overallSentiment?: number
}

export interface WeeklyStats {
  week: string
  dailyStats: DailyStats[]
  patterns: string[]
  aspectProgress: Record<LifeAspect, number>
  weeklyGoalProgress: {
    goalId: string
    title: string
    progress: number
  }[]
}

export interface MonthlySummary {
  month: string
  aspectSummaries: Record<LifeAspect, {
    goalProgress: number
    taskCompletionRate: number
    averageSentiment: number
    highlights: string[]
    concerns: string[]
  }>
  monthlyGoalProgress: {
    goalId: string
    title: string
    progress: number
    status: string
  }[]
  trends: {
    metric: string
    direction: "up" | "down" | "stable"
    change: number
  }[]
}

// Resistance Analysis
export interface ResistanceAnalysis {
  highResistanceTasks: Task[]
  patterns: string[]
  suggestions: string[]
}

// Deep Focus Analysis
export interface DeepFocusAnalysis {
  todayDeep: number // hours
  todayShallow: number
  weeklyDeep: number
  weeklyShallow: number
  ratio: number // deep / total
  targetMet: boolean
  fragmentationScore: number
  alerts: string[]
}

// Compound Progress
export interface CompoundProgress {
  aspect: LifeAspect
  totalActions: number
  totalTime: number // minutes
  humanizedTime: string // "47 sessions = 70+ hours"
  trend: "accelerating" | "steady" | "declining"
  projectedYearEnd: string
}

// Settings
export interface AppSettings {
  id: string
  ollamaUrl: string
  ollamaModel?: string
  theme: "light" | "dark" | "system"
  onboardingCompleted: boolean
  weekStartsOn: 0 | 1 // Sunday (0) or Monday (1)
  // Prompt settings
  weeklyReviewDay: number // 0-6, default 0 (Sunday)
  weeklyReviewTime: string // "18:00"
  journalPromptMode: JournalPromptMode
  preferredPromptCategories: PromptCategory[]
  coachTone: CoachTone
  deepWorkDailyTarget: number // hours, default 4
  showPrincipleTooltips: boolean
  createdAt: Date
  updatedAt: Date
}

// Legacy Goal type for backward compatibility
export interface Goal {
  id: string
  title: string
  aspect: LifeAspect
  level: "yearly" | "monthly" | "weekly"
  successCriteria: string
  startDate: string
  endDate: string
  parentId?: string
  progress: number
}
