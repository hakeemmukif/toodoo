"use client"

import { Button } from "@/components/ui/button"
import { ASPECT_CONFIG } from "@/lib/constants"
import { formatDate } from "@/db"
import type { LifeAspect, TimePreference } from "@/lib/types"
import { ArrowLeft, Calendar, Check, ListTodo, Loader2, Sparkles, Target } from "lucide-react"

interface StepSummaryProps {
  mode: "onboarding" | "add-goal"
  primaryAspect: LifeAspect
  yearlyGoal: { title: string; criteria: string }
  monthlyGoal: { title: string }
  weeklyGoal: { title: string }
  firstTask: { title: string; scheduledDate: string; timePreference: TimePreference }
  otherGoals: Record<LifeAspect, { goal: string; criteria: string; skip: boolean }>
  isSaving: boolean
  onFinish: () => void
  onBack: () => void
}

export function StepSummary({
  mode,
  primaryAspect,
  yearlyGoal,
  monthlyGoal,
  weeklyGoal,
  firstTask,
  otherGoals,
  isSaving,
  onFinish,
  onBack,
}: StepSummaryProps) {
  const primaryConfig = ASPECT_CONFIG[primaryAspect]
  const PrimaryIcon = primaryConfig.icon
  const today = formatDate(new Date())

  const otherGoalsSet = Object.entries(otherGoals).filter(
    ([aspect, data]) => aspect !== primaryAspect && !data.skip && data.goal.trim()
  )

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mb-3 flex items-center justify-center gap-3">
          <Sparkles className="h-8 w-8" />
          <h2 className="text-2xl font-semibold sm:text-3xl">You're all set!</h2>
        </div>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">Here's what we'll create for you</p>
      </div>

      {/* Primary Goal Chain */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <div className="mb-4 flex items-center gap-3">
          <PrimaryIcon className="h-6 w-6" style={{ color: primaryConfig.color }} />
          <span className="text-lg font-semibold">{primaryConfig.label} - Full Goal Chain</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="text-base">
              <span className="text-muted-foreground">Yearly:</span> {yearlyGoal.title}
            </div>
          </div>
          <div className="ml-4 flex items-start gap-3">
            <ListTodo className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="text-base">
              <span className="text-muted-foreground">Monthly:</span> {monthlyGoal.title}
            </div>
          </div>
          <div className="ml-8 flex items-start gap-3">
            <ListTodo className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="text-base">
              <span className="text-muted-foreground">Weekly:</span> {weeklyGoal.title}
            </div>
          </div>
          <div className="ml-12 flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5" style={{ color: primaryConfig.color }} />
            <div className="text-base">
              <span className="text-muted-foreground">Task:</span>{" "}
              <span className="font-medium">{firstTask.title}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                ({firstTask.scheduledDate === today ? "Today" : "Tomorrow"},{" "}
                {firstTask.timePreference})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Other Goals */}
      {otherGoalsSet.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-medium text-muted-foreground">
            Additional Yearly Goals ({otherGoalsSet.length})
          </h3>
          {otherGoalsSet.map(([aspect, data]) => {
            const config = ASPECT_CONFIG[aspect as LifeAspect]
            const Icon = config.icon
            return (
              <div key={aspect} className="flex items-start gap-4 rounded-xl border border-border p-4">
                <Icon className="mt-0.5 h-6 w-6" style={{ color: config.color }} />
                <div>
                  <p className="text-base font-medium">{data.goal}</p>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-between gap-4 pt-4">
        <Button variant="outline" size="lg" onClick={onBack} disabled={isSaving}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button className="flex-1" size="lg" onClick={onFinish} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              {mode === "onboarding" ? "Go to Calendar" : "Create Goal"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
