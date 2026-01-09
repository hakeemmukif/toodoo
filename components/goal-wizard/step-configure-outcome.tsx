"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect, OutcomeGoal } from "@/lib/types"
import { ArrowLeft, ArrowRight, Target } from "lucide-react"

interface StepConfigureOutcomeProps {
  aspect: LifeAspect
  wish: string
  value: Partial<OutcomeGoal> | null
  onChange: (value: Partial<OutcomeGoal>) => void
  onNext: () => void
  onBack: () => void
}

const UNIT_SUGGESTIONS: Record<LifeAspect, { unit: string; example: number }[]> = {
  fitness: [
    { unit: "kg", example: 70 },
    { unit: "sessions", example: 100 },
    { unit: "km", example: 500 },
    { unit: "minutes", example: 1000 },
  ],
  nutrition: [
    { unit: "meals", example: 100 },
    { unit: "days", example: 30 },
    { unit: "recipes", example: 20 },
  ],
  career: [
    { unit: "certifications", example: 3 },
    { unit: "projects", example: 5 },
    { unit: "hours", example: 100 },
  ],
  financial: [
    { unit: "RM", example: 10000 },
    { unit: "%", example: 20 },
    { unit: "months", example: 6 },
  ],
  "side-projects": [
    { unit: "users", example: 100 },
    { unit: "features", example: 10 },
    { unit: "commits", example: 200 },
  ],
  chores: [
    { unit: "rooms", example: 5 },
    { unit: "items", example: 100 },
    { unit: "hours/week", example: 2 },
  ],
}

export function StepConfigureOutcome({
  aspect,
  wish,
  value,
  onChange,
  onNext,
  onBack,
}: StepConfigureOutcomeProps) {
  const config = ASPECT_CONFIG[aspect]
  const suggestions = UNIT_SUGGESTIONS[aspect]

  const outcomeValue: Partial<OutcomeGoal> = value || {
    targetValue: 0,
    currentValue: 0,
    unit: "",
    checkpoints: [],
  }

  const updateValue = (updates: Partial<OutcomeGoal>) => {
    onChange({ ...outcomeValue, ...updates })
  }

  const selectSuggestion = (suggestion: { unit: string; example: number }) => {
    updateValue({
      unit: suggestion.unit,
      targetValue: suggestion.example,
    })
  }

  const isValid =
    outcomeValue.targetValue &&
    outcomeValue.targetValue > 0 &&
    outcomeValue.unit

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
          <Target className="h-6 w-6 text-rose-600" />
        </div>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Set your target
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          What number would mean success?
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Your wish:</p>
        <p className="mt-1 text-lg font-medium" style={{ color: config.color }}>
          {wish}
        </p>
      </div>

      <div className="space-y-6">
        {/* Quick suggestions */}
        <div className="space-y-3">
          <Label className="text-base">Common targets</Label>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.unit}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  outcomeValue.unit === suggestion.unit
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted"
                }`}
              >
                {suggestion.example} {suggestion.unit}
              </button>
            ))}
          </div>
        </div>

        {/* Target value */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-base">Target</Label>
            <Input
              type="number"
              className="h-12 text-base"
              placeholder="100"
              value={outcomeValue.targetValue || ""}
              onChange={(e) => updateValue({ targetValue: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base">Unit</Label>
            <Input
              className="h-12 text-base"
              placeholder="RM, kg, %, etc."
              value={outcomeValue.unit || ""}
              onChange={(e) => updateValue({ unit: e.target.value })}
            />
          </div>
        </div>

        {/* Current value */}
        <div className="space-y-2">
          <Label className="text-base">Where are you now?</Label>
          <Input
            type="number"
            className="h-12 text-base"
            placeholder="Current value"
            value={outcomeValue.currentValue || ""}
            onChange={(e) => updateValue({ currentValue: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* Progress preview */}
        {outcomeValue.targetValue && outcomeValue.targetValue > 0 && (
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {outcomeValue.currentValue || 0} / {outcomeValue.targetValue} {outcomeValue.unit}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(
                    ((outcomeValue.currentValue || 0) / outcomeValue.targetValue) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {Math.round(((outcomeValue.currentValue || 0) / outcomeValue.targetValue) * 100)}% complete
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          About outcome goals
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Outcome goals are powerful but can feel distant. Focus on the habits
          and actions that lead to this outcome - we&apos;ll help you track both.
        </p>
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
