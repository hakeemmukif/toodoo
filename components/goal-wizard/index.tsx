"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { useGoalsStore } from "@/stores/goals"
import { useTasksStore } from "@/stores/tasks"
import { useAppStore } from "@/stores/app"
import { formatDate, getMonthString, getWeekString } from "@/db"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import type { LifeAspect, TimePreference } from "@/lib/types"
import type { WizardStep, WizardMode, WizardState, GoalWizardProps } from "./types"

import { StepAspect } from "./step-aspect"
import { StepGoalType } from "./step-goal-type"
import { StepWish } from "./step-wish"
import { StepOutcome } from "./step-outcome"
import { StepObstacle } from "./step-obstacle"
import { StepPlan } from "./step-plan"
import { StepIdentity } from "./step-identity"
import { StepConfigureHabit } from "./step-configure-habit"
import { StepConfigureMastery } from "./step-configure-mastery"
import { StepConfigureProject } from "./step-configure-project"
import { StepConfigureOutcome } from "./step-configure-outcome"
import { StepYearly } from "./step-yearly"
import { StepMonthly } from "./step-monthly"
import { StepWeekly } from "./step-weekly"
import { StepTask } from "./step-task"
import { StepPreview } from "./step-preview"
import { StepOtherAspects } from "./step-other-aspects"
import { StepSummary } from "./step-summary"

const aspects = Object.keys(ASPECT_CONFIG) as LifeAspect[]

function getStepOrder(mode: WizardMode, includeOtherAspects: boolean): WizardStep[] {
  // WOOP-enhanced flow: psychology-backed goal creation
  const baseSteps: WizardStep[] = [
    "pick-aspect",
    "pick-goal-type",        // NEW: Choose goal type
    "wish",                  // WOOP - W: What do you want?
    "outcome-visualization", // WOOP - O: Best outcome
    "obstacle-discovery",    // WOOP - O: Inner obstacle
    "plan-creation",         // WOOP - P: If-then plans
    "identity-statement",    // Identity-based goals
    "configure-goal-type",   // Type-specific config
    "yearly-goal",
    "monthly-goal",
    "weekly-goal",
    "first-task",
    "calendar-preview",
  ]

  if (mode === "onboarding" || includeOtherAspects) {
    return [...baseSteps, "other-aspects", "summary"]
  }

  return [...baseSteps, "summary"]
}

export function GoalWizard({
  mode,
  defaultAspect,
  includeOtherAspects = mode === "onboarding",
  onComplete,
  onCancel,
}: GoalWizardProps) {
  const router = useRouter()
  const { toast } = useToast()

  const STEP_ORDER = getStepOrder(mode, includeOtherAspects)

  // Determine initial step based on defaultAspect
  const initialStep: WizardStep = defaultAspect ? "yearly-goal" : "pick-aspect"

  const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep)
  const [isSaving, setIsSaving] = useState(false)

  // Wizard state - WOOP-enhanced with psychology-backed fields
  const [state, setState] = useState<WizardState>(() => ({
    primaryAspect: defaultAspect || null,

    // Goal type (will be suggested based on aspect)
    goalType: null,

    // WOOP Data
    wish: "",
    outcomeVisualization: "",
    mainObstacle: "",
    ifThenPlans: [],

    // Identity & Motivation
    identityStatement: "",
    whyImportant: "",

    // Type-specific configurations
    habitConfig: null,
    masteryConfig: null,
    projectConfig: null,
    outcomeConfig: null,

    // Goal hierarchy
    yearlyGoal: { title: "", criteria: "" },
    monthlyGoal: { title: "" },
    weeklyGoal: { title: "" },

    // First task with implementation intention
    firstTask: {
      title: "",
      scheduledDate: formatDate(new Date()),
      timePreference: "morning" as TimePreference,
      contextCue: "",
      implementationPlan: "",
    },

    // Other aspects
    otherGoals: aspects.reduce(
      (acc, aspect) => ({
        ...acc,
        [aspect]: { goal: "", criteria: "", skip: false },
      }),
      {} as Record<LifeAspect, { goal: string; criteria: string; skip: boolean }>
    ),
  }))

  // Other aspects navigation
  const [currentOtherAspectIndex, setCurrentOtherAspectIndex] = useState(0)
  const otherAspects = aspects.filter((a) => a !== state.primaryAspect)
  const currentOtherAspect = otherAspects[currentOtherAspectIndex]

  // Store actions
  const addYearlyGoal = useGoalsStore((s) => s.addYearlyGoal)
  const addMonthlyGoal = useGoalsStore((s) => s.addMonthlyGoal)
  const addWeeklyGoal = useGoalsStore((s) => s.addWeeklyGoal)
  const addTask = useTasksStore((s) => s.addTask)
  const updateSettings = useAppStore((s) => s.updateSettings)

  // Progress calculation
  const stepIndex = STEP_ORDER.indexOf(currentStep)
  const progress = ((stepIndex + 1) / STEP_ORDER.length) * 100

  // Navigation
  const goToStep = (step: WizardStep) => setCurrentStep(step)

  const nextStep = () => {
    const idx = STEP_ORDER.indexOf(currentStep)
    if (idx < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[idx + 1])
    }
  }

  const prevStep = () => {
    const idx = STEP_ORDER.indexOf(currentStep)
    if (idx > 0) {
      setCurrentStep(STEP_ORDER[idx - 1])
    } else if (onCancel) {
      onCancel()
    }
  }

  // Save handler - WOOP-enhanced goal creation
  const handleFinish = async () => {
    if (!state.primaryAspect) return

    setIsSaving(true)
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = getMonthString(today)
    const currentWeek = getWeekString(today)

    try {
      // Build WOOP data from wizard state
      const woopData = state.wish ? {
        wish: state.wish,
        outcome: state.outcomeVisualization,
        obstacle: state.mainObstacle,
        plan: state.ifThenPlans[0] || "",
      } : undefined

      // Build type-specific data
      const habitData = state.goalType === "habit" && state.habitConfig ? {
        target: state.habitConfig.target || 3,
        period: state.habitConfig.period || "week",
        action: state.habitConfig.action || "",
        contextCue: state.habitConfig.contextCue || "",
        implementation: state.habitConfig.implementation || "",
        suggestedDays: state.habitConfig.suggestedDays,
        flexibleSchedule: state.habitConfig.flexibleSchedule ?? true,
        currentStreak: 0,
        longestStreak: 0,
      } : undefined

      const masteryData = state.goalType === "mastery" && state.masteryConfig ? {
        skillLevels: state.masteryConfig.skillLevels || [],
        currentLevel: state.masteryConfig.currentLevel || 0,
        resources: state.masteryConfig.resources || [],
        practiceLog: [],
      } : undefined

      const projectData = state.goalType === "project" && state.projectConfig ? {
        milestones: state.projectConfig.milestones || [],
        estimatedCompletionDate: state.projectConfig.estimatedCompletionDate,
        nextAction: state.projectConfig.nextAction,
      } : undefined

      const outcomeData = state.goalType === "outcome" && state.outcomeConfig ? {
        targetValue: state.outcomeConfig.targetValue || 0,
        currentValue: state.outcomeConfig.currentValue || 0,
        unit: state.outcomeConfig.unit || "",
        checkpoints: state.outcomeConfig.checkpoints || [],
      } : undefined

      // 1. Create yearly goal for primary aspect with WOOP and type data
      const yearlyId = await addYearlyGoal({
        aspect: state.primaryAspect,
        year: currentYear,
        title: state.yearlyGoal.title || state.wish, // Use wish as fallback title
        description: state.yearlyGoal.criteria,
        successCriteria: state.yearlyGoal.criteria,
        status: "active",
        priority: 1,
        // Psychology-backed fields
        goalType: state.goalType || "project",
        woop: woopData,
        identityStatement: state.identityStatement || undefined,
        motivation: state.whyImportant ? { whyImportant: state.whyImportant } : undefined,
        anticipatedObstacles: state.mainObstacle ? [state.mainObstacle] : undefined,
        ifThenPlans: state.ifThenPlans.length > 0 ? state.ifThenPlans : undefined,
        // Type-specific data
        habit: habitData,
        mastery: masteryData,
        project: projectData,
        outcome: outcomeData,
      })

      // 2. Create monthly goal linked to yearly
      const monthlyId = await addMonthlyGoal({
        yearlyGoalId: yearlyId,
        aspect: state.primaryAspect,
        month: currentMonth,
        title: state.monthlyGoal.title,
        status: "active",
        priority: 1,
      })

      // 3. Create weekly goal linked to monthly
      const weeklyId = await addWeeklyGoal({
        monthlyGoalId: monthlyId,
        aspect: state.primaryAspect,
        week: currentWeek,
        title: state.weeklyGoal.title,
        status: "active",
      })

      // 4. Create task linked to weekly with implementation intention
      await addTask({
        weeklyGoalId: weeklyId,
        aspect: state.primaryAspect,
        title: state.firstTask.title,
        scheduledDate: state.firstTask.scheduledDate,
        timePreference: state.firstTask.timePreference,
        status: "pending",
        deferCount: 0,
        // Implementation intention (Gollwitzer)
        contextCue: state.firstTask.contextCue || habitData?.contextCue || undefined,
        implementationPlan: state.firstTask.implementationPlan || undefined,
      })

      // 5. Create yearly goals for other aspects (if applicable)
      if (includeOtherAspects) {
        let priority = 2
        for (const [aspect, data] of Object.entries(state.otherGoals)) {
          if (aspect !== state.primaryAspect && !data.skip && data.goal.trim()) {
            await addYearlyGoal({
              aspect: aspect as LifeAspect,
              year: currentYear,
              title: data.goal,
              description: data.criteria,
              successCriteria: data.criteria,
              status: "active",
              priority: priority++,
            })
          }
        }
      }

      // 6. Mark onboarding complete (if in onboarding mode)
      if (mode === "onboarding") {
        await updateSettings({ onboardingCompleted: true })
      }

      const otherGoalsCount = Object.entries(state.otherGoals).filter(
        ([aspect, data]) => aspect !== state.primaryAspect && !data.skip && data.goal.trim()
      ).length

      toast({
        title: mode === "onboarding" ? "Setup complete!" : "Goal created!",
        description:
          mode === "onboarding"
            ? `Created your goal chain${otherGoalsCount > 0 ? ` and ${otherGoalsCount} additional goal${otherGoalsCount !== 1 ? "s" : ""}` : ""}.`
            : `Your ${ASPECT_CONFIG[state.primaryAspect].label} goal chain is ready.`,
      })

      // 7. Complete
      if (mode === "onboarding") {
        router.push("/calendar")
      }
      onComplete()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your goals. Please try again.",
        variant: "destructive",
      })
      setIsSaving(false)
    }
  }

  // Render step header with progress
  const renderHeader = () => (
    <div className="mb-6">
      <Progress value={progress} className="h-2" />
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Step {stepIndex + 1} of {STEP_ORDER.length}
        {currentStep === "other-aspects" && ` - ${ASPECT_CONFIG[currentOtherAspect].label}`}
      </p>
    </div>
  )

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case "pick-aspect":
        return (
          <StepAspect
            selectedAspect={state.primaryAspect}
            onSelect={(aspect) => setState({ ...state, primaryAspect: aspect })}
            onNext={nextStep}
          />
        )

      case "pick-goal-type":
        if (!state.primaryAspect) return null
        return (
          <StepGoalType
            aspect={state.primaryAspect}
            selectedType={state.goalType}
            onSelect={(type) => setState({ ...state, goalType: type })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )

      case "wish":
        if (!state.primaryAspect || !state.goalType) return null
        return (
          <StepWish
            aspect={state.primaryAspect}
            goalType={state.goalType}
            value={state.wish}
            onChange={(wish) => setState({ ...state, wish })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )

      case "outcome-visualization":
        if (!state.primaryAspect || !state.goalType) return null
        return (
          <StepOutcome
            aspect={state.primaryAspect}
            goalType={state.goalType}
            wish={state.wish}
            value={state.outcomeVisualization}
            onChange={(outcomeVisualization) => setState({ ...state, outcomeVisualization })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )

      case "obstacle-discovery":
        if (!state.primaryAspect) return null
        return (
          <StepObstacle
            aspect={state.primaryAspect}
            wish={state.wish}
            value={state.mainObstacle}
            onChange={(mainObstacle) => setState({ ...state, mainObstacle })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )

      case "plan-creation":
        if (!state.primaryAspect) return null
        return (
          <StepPlan
            aspect={state.primaryAspect}
            obstacle={state.mainObstacle}
            value={state.ifThenPlans}
            onChange={(ifThenPlans) => setState({ ...state, ifThenPlans })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )

      case "identity-statement":
        if (!state.primaryAspect || !state.goalType) return null
        return (
          <StepIdentity
            aspect={state.primaryAspect}
            goalType={state.goalType}
            wish={state.wish}
            value={state.identityStatement}
            onChange={(identityStatement) => setState({ ...state, identityStatement })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )

      case "configure-goal-type":
        if (!state.primaryAspect || !state.goalType) return null
        switch (state.goalType) {
          case "habit":
            return (
              <StepConfigureHabit
                aspect={state.primaryAspect}
                wish={state.wish}
                value={state.habitConfig}
                onChange={(habitConfig) => setState({ ...state, habitConfig })}
                onNext={nextStep}
                onBack={prevStep}
              />
            )
          case "mastery":
            return (
              <StepConfigureMastery
                aspect={state.primaryAspect}
                wish={state.wish}
                value={state.masteryConfig}
                onChange={(masteryConfig) => setState({ ...state, masteryConfig })}
                onNext={nextStep}
                onBack={prevStep}
              />
            )
          case "project":
            return (
              <StepConfigureProject
                aspect={state.primaryAspect}
                wish={state.wish}
                value={state.projectConfig}
                onChange={(projectConfig) => setState({ ...state, projectConfig })}
                onNext={nextStep}
                onBack={prevStep}
              />
            )
          case "outcome":
            return (
              <StepConfigureOutcome
                aspect={state.primaryAspect}
                wish={state.wish}
                value={state.outcomeConfig}
                onChange={(outcomeConfig) => setState({ ...state, outcomeConfig })}
                onNext={nextStep}
                onBack={prevStep}
              />
            )
          default:
            return null
        }

      case "yearly-goal":
        if (!state.primaryAspect) return null
        return (
          <StepYearly
            aspect={state.primaryAspect}
            value={state.yearlyGoal}
            onChange={(v) => setState({ ...state, yearlyGoal: v })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )

      case "monthly-goal":
        if (!state.primaryAspect) return null
        return (
          <StepMonthly
            aspect={state.primaryAspect}
            yearlyGoalTitle={state.yearlyGoal.title}
            value={state.monthlyGoal}
            onChange={(v) => setState({ ...state, monthlyGoal: v })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )

      case "weekly-goal":
        if (!state.primaryAspect) return null
        return (
          <StepWeekly
            aspect={state.primaryAspect}
            yearlyGoalTitle={state.yearlyGoal.title}
            monthlyGoalTitle={state.monthlyGoal.title}
            value={state.weeklyGoal}
            onChange={(v) => setState({ ...state, weeklyGoal: v })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )

      case "first-task":
        if (!state.primaryAspect) return null
        return (
          <StepTask
            aspect={state.primaryAspect}
            weeklyGoalTitle={state.weeklyGoal.title}
            value={state.firstTask}
            onChange={(v) => setState({
              ...state,
              firstTask: {
                ...state.firstTask,  // Preserve contextCue and implementationPlan
                ...v,
              },
            })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )

      case "calendar-preview":
        if (!state.primaryAspect) return null
        return (
          <StepPreview
            aspect={state.primaryAspect}
            yearlyGoalTitle={state.yearlyGoal.title}
            monthlyGoalTitle={state.monthlyGoal.title}
            weeklyGoalTitle={state.weeklyGoal.title}
            task={state.firstTask}
            onNext={nextStep}
            onBack={prevStep}
            nextLabel={includeOtherAspects ? "Add more goals" : "Review & Save"}
          />
        )

      case "other-aspects":
        if (!state.primaryAspect || !currentOtherAspect) {
          nextStep()
          return null
        }
        return (
          <StepOtherAspects
            primaryAspect={state.primaryAspect}
            currentAspect={currentOtherAspect}
            currentIndex={currentOtherAspectIndex}
            totalCount={otherAspects.length}
            value={state.otherGoals[currentOtherAspect]}
            onChange={(v) =>
              setState({
                ...state,
                otherGoals: { ...state.otherGoals, [currentOtherAspect]: v },
              })
            }
            onNext={() => {
              if (currentOtherAspectIndex >= otherAspects.length - 1) {
                nextStep()
              } else {
                setCurrentOtherAspectIndex(currentOtherAspectIndex + 1)
              }
            }}
            onBack={() => {
              if (currentOtherAspectIndex > 0) {
                setCurrentOtherAspectIndex(currentOtherAspectIndex - 1)
              } else {
                prevStep()
              }
            }}
            onSkip={() => {
              setState({
                ...state,
                otherGoals: {
                  ...state.otherGoals,
                  [currentOtherAspect]: { ...state.otherGoals[currentOtherAspect], skip: true },
                },
              })
              if (currentOtherAspectIndex >= otherAspects.length - 1) {
                nextStep()
              } else {
                setCurrentOtherAspectIndex(currentOtherAspectIndex + 1)
              }
            }}
            isLast={currentOtherAspectIndex >= otherAspects.length - 1}
          />
        )

      case "summary":
        if (!state.primaryAspect) return null
        return (
          <StepSummary
            mode={mode}
            primaryAspect={state.primaryAspect}
            yearlyGoal={state.yearlyGoal}
            monthlyGoal={state.monthlyGoal}
            weeklyGoal={state.weeklyGoal}
            firstTask={state.firstTask}
            otherGoals={state.otherGoals}
            isSaving={isSaving}
            onFinish={handleFinish}
            onBack={() => {
              if (includeOtherAspects) {
                setCurrentOtherAspectIndex(0)
              }
              prevStep()
            }}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full">
      {renderHeader()}
      {renderStep()}
    </div>
  )
}

export { type GoalWizardProps, type WizardMode } from "./types"
