"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect } from "@/lib/types"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface StepMonthlyProps {
  aspect: LifeAspect
  yearlyGoalTitle: string
  value: { title: string }
  onChange: (value: { title: string }) => void
  onNext: () => void
  onBack: () => void
}

export function StepMonthly({
  aspect,
  yearlyGoalTitle,
  value,
  onChange,
  onNext,
  onBack,
}: StepMonthlyProps) {
  const config = ASPECT_CONFIG[aspect]
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" })

  const placeholders: Record<LifeAspect, string> = {
    fitness: "e.g., Complete 16 training sessions",
    nutrition: "e.g., Cook dinner at home 5 days/week",
    career: "e.g., Complete the first major milestone",
    financial: "e.g., Save RM2,000 this month",
    "side-projects": "e.g., Finish the core feature",
    chores: "e.g., Deep clean one room per week",
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Let's break it down. What's your focus for {monthName}?
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Think smaller. What's a realistic milestone for the next 30 days?
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Your yearly goal:</p>
        <p className="mt-1 text-lg font-medium" style={{ color: config.color }}>
          {yearlyGoalTitle}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthly-goal" className="text-base">This month's milestone</Label>
        <Input
          id="monthly-goal"
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
