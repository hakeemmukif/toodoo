import type { LifeAspect, TimePreference } from "@/lib/types"

export type WizardStep =
  | "pick-aspect"
  | "yearly-goal"
  | "monthly-goal"
  | "weekly-goal"
  | "first-task"
  | "calendar-preview"
  | "other-aspects"
  | "summary"

export type WizardMode = "onboarding" | "add-goal"

export interface WizardState {
  // Primary aspect (full breakdown)
  primaryAspect: LifeAspect | null
  yearlyGoal: { title: string; criteria: string }
  monthlyGoal: { title: string }
  weeklyGoal: { title: string }
  firstTask: {
    title: string
    scheduledDate: string
    timePreference: TimePreference
  }
  // Other aspects (yearly goals only) - for onboarding mode
  otherGoals: Record<LifeAspect, { goal: string; criteria: string; skip: boolean }>
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
