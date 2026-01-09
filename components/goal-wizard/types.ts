import type {
  LifeAspect,
  TimePreference,
  GoalType,
  HabitGoal,
  MasteryGoal,
  ProjectGoal,
  OutcomeGoal,
} from "@/lib/types"

export type WizardStep =
  | "pick-aspect"
  | "pick-goal-type"       // NEW: Habit/Mastery/Project/Outcome
  | "wish"                 // NEW: WOOP - W
  | "outcome-visualization" // NEW: WOOP - O
  | "obstacle-discovery"   // NEW: WOOP - O
  | "plan-creation"        // NEW: WOOP - P
  | "identity-statement"   // Enhanced
  | "configure-goal-type"  // NEW: Type-specific configuration
  | "yearly-goal"
  | "monthly-goal"
  | "weekly-goal"
  | "first-task"           // Enhanced with context cue
  | "calendar-preview"
  | "other-aspects"
  | "summary"

export type WizardMode = "onboarding" | "add-goal"

/**
 * WOOP-Enhanced Wizard State
 *
 * Based on Gabriele Oettingen's WOOP research and Peter Gollwitzer's
 * Implementation Intentions - this structure captures psychology-backed
 * goal setting elements that significantly increase success rates.
 */
export interface WizardState {
  // Primary aspect (full breakdown)
  primaryAspect: LifeAspect | null

  // Goal type (psychology-based classification)
  goalType: GoalType | null

  // WOOP Data (Oettingen's Mental Contrasting with Implementation Intentions)
  wish: string                    // What do you really want?
  outcomeVisualization: string    // Imagine the best possible outcome
  mainObstacle: string            // Main internal obstacle
  ifThenPlans: string[]           // "If [obstacle], then [response]"

  // Identity-based goals (James Clear's "Atomic Habits" approach)
  identityStatement: string       // "I am becoming someone who..."

  // Motivation check (Self-Determination Theory)
  whyImportant: string            // Intrinsic motivation

  // Type-specific configuration
  habitConfig: Partial<HabitGoal> | null
  masteryConfig: Partial<MasteryGoal> | null
  projectConfig: Partial<ProjectGoal> | null
  outcomeConfig: Partial<OutcomeGoal> | null

  // Existing goal fields (enhanced)
  yearlyGoal: { title: string; criteria: string }
  monthlyGoal: { title: string }
  weeklyGoal: { title: string }

  // First task with implementation intention
  firstTask: {
    title: string
    scheduledDate: string
    timePreference: TimePreference
    contextCue: string             // "When I [trigger]..."
    implementationPlan: string     // "...I will [action]"
  }

  // Other aspects (yearly goals only) - for onboarding mode
  otherGoals: Record<LifeAspect, { goal: string; criteria: string; skip: boolean }>
}

/**
 * Default goal type suggestions by aspect
 * Based on typical goal patterns for each life area
 */
export const ASPECT_DEFAULT_GOAL_TYPES: Record<LifeAspect, GoalType> = {
  fitness: "habit",        // Most fitness goals are frequency-based habits
  nutrition: "habit",      // Cooking, eating patterns are habits
  career: "mastery",       // Career goals often involve skill development
  financial: "outcome",    // Financial goals have measurable targets
  "side-projects": "project", // Side projects have deliverable milestones
  chores: "habit",         // Household routines are habits
}

export interface GoalWizardProps {
  mode: WizardMode
  // Pre-select aspect (e.g., when adding goal from specific aspect view)
  defaultAspect?: LifeAspect
  // Skip other aspects step in add-goal mode
  includeOtherAspects?: boolean
  // Callbacks
  onComplete: () => void
  onCancel?: () => void
}
