"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect, HabitGoal } from "@/lib/types"
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react"

interface StepConfigureHabitProps {
  aspect: LifeAspect
  wish: string
  value: Partial<HabitGoal> | null
  onChange: (value: Partial<HabitGoal>) => void
  onNext: () => void
  onBack: () => void
}

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
]

const ACTION_SUGGESTIONS: Record<LifeAspect, string[]> = {
  fitness: ["train", "workout", "exercise", "run", "stretch"],
  nutrition: ["cook", "meal prep", "eat healthy", "try new recipe"],
  career: ["deep work", "learn", "study", "practice", "review"],
  financial: ["save", "review", "track", "invest"],
  "side-projects": ["code", "build", "design", "write", "work on project"],
  chores: ["clean", "organize", "declutter", "maintain", "tidy"],
}

export function StepConfigureHabit({
  aspect,
  wish,
  value,
  onChange,
  onNext,
  onBack,
}: StepConfigureHabitProps) {
  const config = ASPECT_CONFIG[aspect]
  const suggestions = ACTION_SUGGESTIONS[aspect]

  const habitValue: Partial<HabitGoal> = value || {
    target: 3,
    period: "week",
    action: "",
    contextCue: "",
    implementation: "",
    flexibleSchedule: true,
    suggestedDays: [],
    currentStreak: 0,
    longestStreak: 0,
  }

  const updateValue = (updates: Partial<HabitGoal>) => {
    onChange({ ...habitValue, ...updates })
  }

  const toggleDay = (day: number) => {
    const currentDays = habitValue.suggestedDays || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort()
    updateValue({ suggestedDays: newDays })
  }

  const isValid =
    habitValue.target &&
    habitValue.target > 0 &&
    habitValue.action

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Set up your habit
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          How often do you want to do this?
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Your wish:</p>
        <p className="mt-1 text-lg font-medium" style={{ color: config.color }}>
          {wish}
        </p>
      </div>

      <div className="space-y-6">
        {/* Action */}
        <div className="space-y-3">
          <Label className="text-base">What's the action?</Label>
          <Input
            className="h-12 text-base"
            placeholder="e.g., train, cook, study"
            value={habitValue.action || ""}
            onChange={(e) => updateValue({ action: e.target.value })}
          />
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => updateValue({ action: suggestion })}
                className="rounded-full border border-border px-3 py-1 text-sm hover:bg-muted"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-base">How many times?</Label>
            <Input
              type="number"
              className="h-12 text-base"
              min={1}
              max={7}
              value={habitValue.target || 3}
              onChange={(e) => updateValue({ target: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base">Per...</Label>
            <Select
              value={habitValue.period || "week"}
              onValueChange={(v) => updateValue({ period: v as "day" | "week" | "month" })}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Flexible schedule toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <p className="font-medium">Flexible schedule</p>
            <p className="text-sm text-muted-foreground">
              Allow any days, or set specific days?
            </p>
          </div>
          <Switch
            checked={habitValue.flexibleSchedule ?? true}
            onCheckedChange={(checked) => updateValue({ flexibleSchedule: checked })}
          />
        </div>

        {/* Day selection (if not flexible) */}
        {!habitValue.flexibleSchedule && (
          <div className="space-y-3">
            <Label className="text-base">Suggested days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(({ value: day, label }) => {
                const isSelected = habitValue.suggestedDays?.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Context cue and implementation */}
        <div className="space-y-3">
          <Label className="text-base">When will you do it?</Label>
          <Input
            className="h-12 text-base"
            placeholder="When I finish work..."
            value={habitValue.contextCue || ""}
            onChange={(e) => updateValue({ contextCue: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">
            Link this to an existing routine or time for better consistency.
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button size="lg" onClick={onNext} disabled={!isValid}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
