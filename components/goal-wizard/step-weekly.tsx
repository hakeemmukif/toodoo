"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect } from "@/lib/types"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface StepWeeklyProps {
  aspect: LifeAspect
  yearlyGoalTitle: string
  monthlyGoalTitle: string
  value: { title: string }
  onChange: (value: { title: string }) => void
  onNext: () => void
  onBack: () => void
}

export function StepWeekly({
  aspect,
  yearlyGoalTitle,
  monthlyGoalTitle,
  value,
  onChange,
  onNext,
  onBack,
}: StepWeeklyProps) {
  const config = ASPECT_CONFIG[aspect]

  const placeholders: Record<LifeAspect, string> = {
    fitness: "e.g., Complete 4 training sessions",
    nutrition: "e.g., Meal prep on Sunday",
    career: "e.g., Finish the first deliverable",
    financial: "e.g., Review and categorize expenses",
    "side-projects": "e.g., Complete the authentication flow",
    chores: "e.g., Clean kitchen and bathroom",
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Now let's zoom in. What's your focus for this week?
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          What would make this week a success for your {config.label.toLowerCase()} goal?
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-5">
        <div>
          <p className="text-sm text-muted-foreground">Yearly</p>
          <p className="mt-1 text-base">{yearlyGoalTitle}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">This month</p>
          <p className="mt-1 text-lg font-medium" style={{ color: config.color }}>
            {monthlyGoalTitle}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="weekly-goal" className="text-base">This week's focus</Label>
        <Input
          id="weekly-goal"
          className="h-12 text-base"
          placeholder={placeholders[aspect]}
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button size="lg" onClick={onNext} disabled={!value.title}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
