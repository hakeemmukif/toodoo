"use client"

import { Button } from "@/components/ui/button"
import { CalendarPreview } from "@/components/calendar-preview"
import { ASPECT_CONFIG } from "@/lib/constants"
import { formatDate } from "@/db"
import type { LifeAspect, TimePreference } from "@/lib/types"
import { ArrowLeft, ArrowRight, Calendar, Target } from "lucide-react"

interface StepPreviewProps {
  aspect: LifeAspect
  yearlyGoalTitle: string
  monthlyGoalTitle: string
  weeklyGoalTitle: string
  task: {
    title: string
    scheduledDate: string
    timePreference: TimePreference
  }
  onNext: () => void
  onBack: () => void
  // For add-goal mode, skip to summary
  nextLabel?: string
}

export function StepPreview({
  aspect,
  yearlyGoalTitle,
  monthlyGoalTitle,
  weeklyGoalTitle,
  task,
  onNext,
  onBack,
  nextLabel = "Add more goals",
}: StepPreviewProps) {
  const config = ASPECT_CONFIG[aspect]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mb-3 flex items-center justify-center gap-3">
          <Calendar className="h-8 w-8" />
          <h2 className="text-2xl font-semibold sm:text-3xl">Your goal is now on the calendar</h2>
        </div>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          This is how your goals become reality. Tasks appear on your calendar.
        </p>
      </div>

      <CalendarPreview
        task={{
          title: task.title,
          scheduledDate: task.scheduledDate,
          timePreference: task.timePreference,
          aspect: aspect,
        }}
      />

      <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
        <div className="flex items-start gap-3">
          <Target className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Yearly Goal</p>
            <p className="text-base">{yearlyGoalTitle}</p>
          </div>
        </div>
        <div className="ml-3 border-l-2 border-border pl-5">
          <p className="text-sm text-muted-foreground">Monthly</p>
          <p className="text-base">{monthlyGoalTitle}</p>
        </div>
        <div className="ml-6 border-l-2 border-border pl-5">
          <p className="text-sm text-muted-foreground">Weekly</p>
          <p className="text-base">{weeklyGoalTitle}</p>
        </div>
        <div className="ml-9 border-l-2 pl-5" style={{ borderColor: config.color }}>
          <p className="text-sm text-muted-foreground">Task</p>
          <p className="text-lg font-medium" style={{ color: config.color }}>
            {task.title}
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button size="lg" onClick={onNext}>
          {nextLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
