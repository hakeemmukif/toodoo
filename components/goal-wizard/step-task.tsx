"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ASPECT_CONFIG } from "@/lib/constants"
import { formatDate } from "@/db"
import type { LifeAspect, TimePreference } from "@/lib/types"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface StepTaskProps {
  aspect: LifeAspect
  weeklyGoalTitle: string
  value: {
    title: string
    scheduledDate: string
    timePreference: TimePreference
  }
  onChange: (value: { title: string; scheduledDate: string; timePreference: TimePreference }) => void
  onNext: () => void
  onBack: () => void
}

export function StepTask({
  aspect,
  weeklyGoalTitle,
  value,
  onChange,
  onNext,
  onBack,
}: StepTaskProps) {
  const config = ASPECT_CONFIG[aspect]
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const placeholders: Record<LifeAspect, string> = {
    fitness: "e.g., 30-minute workout",
    nutrition: "e.g., Cook dinner at home",
    career: "e.g., Complete the first step",
    financial: "e.g., Set up automatic savings transfer",
    "side-projects": "e.g., Set up the project repository",
    chores: "e.g., Clean the kitchen",
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Let's make it concrete. What's ONE task you can do?
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Pick something specific you can complete today or tomorrow.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">This week's focus:</p>
        <p className="mt-1 text-lg font-medium" style={{ color: config.color }}>
          {weeklyGoalTitle}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-title" className="text-base">Your first task</Label>
        <Input
          id="task-title"
          className="h-12 text-base"
          placeholder={placeholders[aspect]}
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-base">When?</Label>
          <RadioGroup
            value={value.scheduledDate}
            onValueChange={(v) => onChange({ ...value, scheduledDate: v })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value={formatDate(today)} id="today" className="h-5 w-5" />
              <Label htmlFor="today" className="text-base font-normal">
                Today
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value={formatDate(tomorrow)} id="tomorrow" className="h-5 w-5" />
              <Label htmlFor="tomorrow" className="text-base font-normal">
                Tomorrow
              </Label>
            </div>
          </RadioGroup>
        </div>
        <div className="space-y-3">
          <Label className="text-base">What time?</Label>
          <RadioGroup
            value={value.timePreference}
            onValueChange={(v) => onChange({ ...value, timePreference: v as TimePreference })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="morning" id="morning" className="h-5 w-5" />
              <Label htmlFor="morning" className="text-base font-normal">
                Morning
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="afternoon" id="afternoon" className="h-5 w-5" />
              <Label htmlFor="afternoon" className="text-base font-normal">
                Afternoon
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="evening" id="evening" className="h-5 w-5" />
              <Label htmlFor="evening" className="text-base font-normal">
                Evening
              </Label>
            </div>
          </RadioGroup>
        </div>
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
