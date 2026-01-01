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
export type TrainingType = "muay-thai" | "cardio" | "strength" | "flexibility" | "other"
export type MealType = "breakfast" | "lunch" | "dinner" | "snack"
export type BlockType = "work" | "training" | "meal_prep" | "personal" | "buffer"
export type RecurrenceFrequency = "daily" | "weekly" | "biweekly" | "monthly"

// Goals
export interface YearlyGoal {
  id: string
  aspect: LifeAspect
  title: string
  description?: string
  successCriteria: string
  year: number
  status: GoalStatus
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
}

export interface RecurrenceTemplate {
  id: string
  title: string
  aspect: LifeAspect
  frequency: RecurrenceFrequency
  daysOfWeek?: number[] // 0-6, Sunday = 0
  timePreference: TimePreference
  hardScheduledTime?: string
  durationEstimate?: number
  linkedGoalId?: string
  isActive: boolean
  createdAt: Date
}

// Journal
export interface JournalEntry {
  id: string
  timestamp: Date
  content: string
  detectedAspects: LifeAspect[]
  sentimentScore: number // -1 to 1
  goalAlignment: GoalAlignment
  linkedTaskIds?: string[]
  llmAnalysis?: string
  createdAt: Date
  updatedAt: Date
}

// Training
export interface TrainingSession {
  id: string
  date: string
  type: TrainingType
  duration: number // minutes
  intensity: number // 1-10
  notes?: string
  linkedTaskId?: string
  createdAt: Date
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
  startTime: string
  endTime: string
  title: string
  type: BlockType
  linkedTaskId?: string
  notes?: string
  createdAt: Date
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

// Settings
export interface AppSettings {
  id: string
  ollamaUrl: string
  theme: "light" | "dark" | "system"
  onboardingCompleted: boolean
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
