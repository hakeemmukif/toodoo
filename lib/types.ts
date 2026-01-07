// ========== INBOX PARSING TYPES ==========

// Confidence level for UI display
export type ConfidenceLevel = 'high' | 'medium' | 'low'

// Location types for task context
export type LocationType = 'gym' | 'home' | 'office' | 'venue' | 'online' | 'other'

// Ollama connection status
export type OllamaStatus = 'connected' | 'disconnected' | 'checking'

// Parsed slot with confidence scoring
export interface ParsedSlot<T = string> {
  value: T
  rawMatch: string           // Original matched text
  confidence: number         // 0-1 confidence score
  source: 'rule' | 'llm'     // How it was extracted
}

// Parsed date/time information
export interface ParsedDateTime {
  date?: ParsedSlot<string>         // "2026-01-07" format
  time?: ParsedSlot<string>         // "19:00" format
  timePreference?: ParsedSlot<TimePreference>
  isRelative: boolean               // "today" vs "2026-01-15"
}

// Extended WHO slot with type classification
export interface ParsedWhoSlot extends ParsedSlot<string> {
  whoType: "solo" | "one-on-one" | "group" | "team"
}

// Complete parsing result from inbox processor
export interface ParsedResult {
  // Core slots (WHO, WHAT, WHEN, WHERE)
  what: ParsedSlot | null           // Activity description
  when: ParsedDateTime | null       // Date/time extraction
  where: ParsedSlot | null          // Location
  who: ParsedWhoSlot | null         // People involved with type classification
  duration: ParsedSlot<number> | null  // Minutes

  // Classification (WHY - linked to aspect)
  intent: ParsedSlot<LifeAspect> | null

  // Goal matching (connects tasks to goals)
  goalMatch: GoalMatch | null       // Best matched goal
  alternativeGoals: GoalMatch[]     // Other possible matches

  // Metadata
  overallConfidence: number         // 0-1 aggregate
  confidenceLevel: ConfidenceLevel  // For UI display
  parsingMethod: 'rule' | 'llm' | 'hybrid'
  processingTimeMs: number

  // Pre-built suggestions
  suggestedTask: Partial<Task>
  suggestedBreakdown?: TaskBreakdown

  // Debug info
  rawExtractions?: {
    tokens: string[]
    matchedPatterns: string[]
  }
}

// ========== TIME CONFLICT DETECTION TYPES ==========

// Time conflict between tasks
export interface TimeConflict {
  conflictingTaskId: string
  conflictingTaskTitle: string
  conflictType: "exact" | "overlap" | "adjacent" // exact = same time, overlap = intersecting, adjacent = within 30min
  conflictStart: string // "19:00"
  conflictEnd: string // "20:30"
  suggestedAlternatives: string[] // Alternative times that work
}

// Result of conflict check
export interface ConflictCheckResult {
  hasConflict: boolean
  conflicts: TimeConflict[]
  suggestedTimes: string[] // Free time slots sorted by proximity to original
}

// ========== DEEP PROMPTING TYPES ==========

// Question asked before generating breakdown
export interface DeepPromptQuestion {
  id: string
  aspect: LifeAspect
  questionKey: string // e.g., "session_type", "complexity"
  question: string
  options: DeepPromptOption[]
  required: boolean
  order: number
}

// Option for deep prompt question (selection chip)
export interface DeepPromptOption {
  value: string
  label: string
  icon?: string // Lucide icon name
  defaultDuration?: number // Suggests duration when selected
}

// User's answers to deep prompts
export interface DeepPromptAnswers {
  [questionKey: string]: string
}

// ========== SLOT CLARIFICATION TYPES ==========

// Slot types for mandatory field collection
export type SlotType = 'who' | 'what' | 'when' | 'where' | 'why' | 'duration'

// Question input types for UI rendering
export type SlotInputType = 'text' | 'select' | 'datetime' | 'number'

// Individual slot status in analysis
export interface SlotStatus {
  slot: SlotType
  filled: boolean
  confidence: number
  value?: string | number
  source?: 'rule' | 'llm' | 'user'
}

// Question to ask user for missing slot
export interface SlotQuestion {
  slot: SlotType
  question: string
  placeholder?: string
  inputType: SlotInputType
  options?: { value: string; label: string }[]
  required: boolean
  context?: string  // AI reasoning for why this question
}

// Result of slot analysis
export interface SlotAnalysis {
  slots: SlotStatus[]
  missingRequired: SlotType[]
  completeness: number  // 0-1 percentage of required slots filled
  canProceed: boolean   // All required slots above min confidence
}

// Result from question generation
export interface ClarificationResult {
  questions: SlotQuestion[]
  generationMethod: 'ai' | 'rule'
  context?: string  // Overall AI reasoning
}

// State for clarification dialog
export interface ClarificationState {
  originalText: string
  parsed: ParsedResult
  analysis: SlotAnalysis
  questions: SlotQuestion[]
  answers: Partial<Record<SlotType, string>>
  generationMethod: 'ai' | 'rule' | null
}

// Task breakdown for START-MIDDLE-END structure
export interface TaskBreakdown {
  // START: Implementation Intention (Gollwitzer)
  trigger: string              // "When it's 7pm and I arrive at Bunker"
  triggerType: 'time' | 'location' | 'event' | 'completion'
  environmentalCue?: string    // "Gym bag by door"

  // MIDDLE: Action steps (mini-tasks)
  steps: TaskStep[]

  // END: Completion criteria
  completionCriteria: string   // "Session completed, changed out of gym clothes"
  satisfactionCheck?: string   // "Did I push my limits?"
}

// Individual step within a task breakdown
export interface TaskStep {
  id: string
  title: string
  duration?: number           // minutes
  order: number
  status: 'pending' | 'done' | 'skipped'
  scheduledTime?: string      // For calendar visualization "19:00"
}

// ========== LIFE ASPECTS ==========

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
  frequency?: FrequencyGoal // Structured frequency (preferred over title parsing)
  createdAt: Date
  updatedAt: Date
}

// Frequency tracking for goals (e.g., "train 4x per week")
export interface FrequencyGoal {
  target: number // e.g., 4
  period: "day" | "week" | "month"
  action?: string // e.g., "train", "cook" (for keyword matching)
}

// Goal match result from inbox parser
export interface GoalMatch {
  goalId: string
  goalTitle: string
  goalLevel: "yearly" | "monthly" | "weekly"
  weeklyGoalId: string // For task.weeklyGoalId linking
  matchConfidence: number // 0-1
  matchReasons: string[] // ["aspect:fitness", "keyword:train"]
  frequencyProgress?: {
    current: number // Tasks scheduled/completed this period
    target: number // Goal target
    period: "day" | "week" | "month"
  }
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
  // Location context (first-class field)
  location?: string // "The Bunker, Kota Damansara"
  locationType?: LocationType // gym, home, office, venue, online, other
  // Task breakdown (START-MIDDLE-END structure)
  breakdown?: TaskBreakdown // Implementation intention + steps + completion criteria
  parentTaskId?: string // For subtasks - links to parent task
  isSubtask?: boolean // Default false - true for mini-tasks within breakdown
  // WHO: Who's involved in this task
  who?: string // "solo", "coach", "team", etc.
  whoType?: "solo" | "one-on-one" | "group" | "team" // For filtering/analysis
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
  // Goal integration
  linkedGoalIds?: string[] // Goals this entry relates to
  goalContext?: string // Which goal triggered the prompt (for goal-based prompts)
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
  linkedGoalId?: string // Link to fitness/side-project goal for progress tracking
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
  linkedGoalId?: string // Link to nutrition goal for progress tracking
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
  linkedGoalId?: string // Direct link to goal for milestone blocks
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
  // Intelligent parsing (added for context extraction)
  parsed?: ParsedResult
  parseAttemptedAt?: Date
  parseVersion?: number // For cache invalidation when parser improves
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
  // Ollama connection status tracking
  ollamaStatus: OllamaStatus // 'connected' | 'disconnected' | 'checking'
  ollamaLastChecked?: Date
}

// ========== GOAL PLANNING TYPES ==========

// Planning message in conversation
export interface PlanningMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

// Monthly breakdown item in a plan
export interface MonthlyPlanItem {
  month: string // "2025-01"
  title: string
  successCriteria: string
  milestones: string[]
}

// Weekly breakdown item in a plan
export interface WeeklyPlanItem {
  week: string // "2025-W03"
  month: string // Parent month reference
  title: string
  focus: string
  estimatedHours?: number
}

// Task item generated from plan
export interface TaskPlanItem {
  week: string // Which week this belongs to
  title: string
  description?: string
  scheduledDate: string
  timePreference: TimePreference
  durationEstimate?: number
  minimumVersion?: string
  isHardThing?: boolean
  reasoning: string // Why this task is suggested
}

// User context for personalized AI prompts
export interface UserContext {
  location: string // "Malaysia"
  timezone: string // "Asia/Kuala_Lumpur"
  currentDate: Date
  interests: string[] // ["muay thai", "DJ (French house, Nu Disco)", "fintech"]
  workSchedule?: {
    daysPerWeek: number
    hoursPerDay: number
    flexibility: "high" | "medium" | "low"
  }
  availableTimePerWeek?: number // hours
  activeGoals: {
    aspect: LifeAspect
    title: string
    priority: number
  }[]
}

// Draft plan state (before committing to DB)
export interface GoalPlanDraft {
  id: string
  userPrompt: string
  aspect: LifeAspect
  yearlyGoal: {
    title: string
    description: string
    successCriteria: string
    identityStatement?: string
  }
  monthlyBreakdown: MonthlyPlanItem[]
  weeklyBreakdown: WeeklyPlanItem[]
  initialTasks: TaskPlanItem[]
  analysis: string // AI's reasoning about the goal
  suggestions: string[] // AI's recommendations
  warnings: string[] // Potential challenges identified
  conversationHistory: PlanningMessage[]
  createdAt: Date
  lastModifiedAt: Date
}

// Persisted planning session for draft recovery
export interface PlanningDraft {
  id: string
  aspect: LifeAspect
  draft: GoalPlanDraft
  expiresAt: Date // Auto-expire after 7 days
  createdAt: Date
  lastModifiedAt: Date
}

// Result after committing a plan
export interface CommittedGoalPlan {
  yearlyGoalId: string
  monthlyGoalIds: string[]
  weeklyGoalIds: string[]
  taskIds: string[]
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
