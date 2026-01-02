"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { GoalCard } from "@/components/goal-card"
import { EmptyState } from "@/components/empty-state"
import { GoalWizardModal } from "@/components/goal-wizard-modal"
import { Button } from "@/components/ui/button"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useGoalsStore } from "@/stores/goals"
import type { LifeAspect, YearlyGoal, MonthlyGoal, WeeklyGoal } from "@/lib/types"
import { Target, Plus } from "lucide-react"
import { calculateYearlyProgress, calculateMonthlyProgress, calculateWeeklyProgress } from "@/services/progress"

type GoalLevel = "yearly" | "monthly" | "weekly"

interface GoalWithProgress {
  goal: YearlyGoal | MonthlyGoal | WeeklyGoal
  level: GoalLevel
  progress: number
  children: GoalWithProgress[]
}

export default function GoalsPage() {
  const [selectedAspect, setSelectedAspect] = useState<LifeAspect | "all">("all")
  const [wizardOpen, setWizardOpen] = useState(false)
  const [goalsWithProgress, setGoalsWithProgress] = useState<GoalWithProgress[]>([])

  const yearlyGoals = useGoalsStore((state) => state.yearlyGoals)
  const monthlyGoals = useGoalsStore((state) => state.monthlyGoals)
  const weeklyGoals = useGoalsStore((state) => state.weeklyGoals)

  // Build hierarchical goals with progress
  useEffect(() => {
    async function buildGoalsWithProgress() {
      const filteredYearly =
        selectedAspect === "all"
          ? yearlyGoals.filter((g) => g.status === "active")
          : yearlyGoals.filter((g) => g.aspect === selectedAspect && g.status === "active")

      const result: GoalWithProgress[] = await Promise.all(
        filteredYearly.map(async (yg) => {
          const progress = await calculateYearlyProgress(yg.id)
          const monthlyChildren = monthlyGoals.filter(
            (mg) => mg.yearlyGoalId === yg.id && mg.status === "active"
          )

          const children: GoalWithProgress[] = await Promise.all(
            monthlyChildren.map(async (mg) => {
              const mgProgress = await calculateMonthlyProgress(mg.id)
              const weeklyChildren = weeklyGoals.filter(
                (wg) => wg.monthlyGoalId === mg.id && wg.status === "active"
              )

              const weeklyWithProgress: GoalWithProgress[] = await Promise.all(
                weeklyChildren.map(async (wg) => ({
                  goal: wg,
                  level: "weekly" as GoalLevel,
                  progress: await calculateWeeklyProgress(wg.id),
                  children: [],
                }))
              )

              return {
                goal: mg,
                level: "monthly" as GoalLevel,
                progress: mgProgress,
                children: weeklyWithProgress,
              }
            })
          )

          return {
            goal: yg,
            level: "yearly" as GoalLevel,
            progress,
            children,
          }
        })
      )

      setGoalsWithProgress(result)
    }

    buildGoalsWithProgress()
  }, [selectedAspect, yearlyGoals, monthlyGoals, weeklyGoals])

  // Get default aspect for wizard based on filter
  const defaultAspect = selectedAspect !== "all" ? selectedAspect : undefined

  return (
    <AppLayout>
      <div className="container max-w-6xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
            <p className="text-muted-foreground">Track your progress across all life aspects</p>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Goal
          </Button>
        </div>

        {/* Goal Wizard Modal */}
        <GoalWizardModal
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          defaultAspect={defaultAspect}
        />

        {/* Aspect Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedAspect === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedAspect("all")}
          >
            All
          </Button>
          {Object.entries(ASPECT_CONFIG).map(([aspect, config]) => {
            const Icon = config.icon
            return (
              <Button
                key={aspect}
                variant={selectedAspect === aspect ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAspect(aspect as LifeAspect)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {config.label}
              </Button>
            )
          })}
        </div>

        {/* Goals List */}
        {goalsWithProgress.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Create your first goal to start tracking your progress"
            actionLabel="Add Goal"
            onAction={() => setWizardOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            {goalsWithProgress.map(({ goal, progress, children }) => (
              <GoalCard
                key={goal.id}
                goal={{
                  id: goal.id,
                  title: goal.title,
                  aspect: goal.aspect,
                  level: "yearly",
                  successCriteria: (goal as YearlyGoal).successCriteria,
                  startDate: "",
                  endDate: "",
                  progress,
                }}
                children={children.flatMap((c) => [
                  {
                    id: c.goal.id,
                    title: c.goal.title,
                    aspect: c.goal.aspect,
                    level: "monthly" as const,
                    successCriteria: (c.goal as MonthlyGoal).successCriteria || "",
                    startDate: "",
                    endDate: "",
                    progress: c.progress,
                  },
                  ...c.children.map((wc) => ({
                    id: wc.goal.id,
                    title: wc.goal.title,
                    aspect: wc.goal.aspect,
                    level: "weekly" as const,
                    successCriteria: "",
                    startDate: "",
                    endDate: "",
                    progress: wc.progress,
                  })),
                ])}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
