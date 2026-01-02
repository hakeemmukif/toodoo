"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect } from "@/lib/types"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface StepOtherAspectsProps {
  primaryAspect: LifeAspect
  currentAspect: LifeAspect
  currentIndex: number
  totalCount: number
  value: { goal: string; criteria: string; skip: boolean }
  onChange: (value: { goal: string; criteria: string; skip: boolean }) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  isLast: boolean
}

export function StepOtherAspects({
  currentAspect,
  currentIndex,
  totalCount,
  value,
  onChange,
  onNext,
  onBack,
  onSkip,
  isLast,
}: StepOtherAspectsProps) {
  const config = ASPECT_CONFIG[currentAspect]
  const Icon = config.icon

  const placeholders: Record<LifeAspect, { goal: string; criteria: string }> = {
    fitness: { goal: "Train 4x per week", criteria: "Complete 200+ sessions" },
    nutrition: { goal: "Cook 80% of meals", criteria: "Log 250+ home-cooked meals" },
    career: { goal: "Get promoted", criteria: "Lead 2 major projects" },
    financial: { goal: "Save 20% of income", criteria: "Build 6-month emergency fund" },
    "side-projects": { goal: "Launch side project", criteria: "Ship MVP, get 100 users" },
    chores: { goal: "Weekly cleaning routine", criteria: "Maintain routine consistently" },
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Icon className="h-10 w-10" style={{ color: config.color }} />
        </div>
        <h2 className="text-2xl font-semibold sm:text-3xl">Set a {config.label} goal? (Optional)</h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {currentIndex + 1} of {totalCount} remaining areas. You can add yearly goals or skip.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="other-goal" className="text-base">Your {config.label.toLowerCase()} goal</Label>
          <Input
            id="other-goal"
            className="h-12 text-base"
            placeholder={`e.g., ${placeholders[currentAspect].goal}`}
            value={value.goal}
            onChange={(e) => onChange({ ...value, goal: e.target.value })}
          />
        </div>
        {value.goal && (
          <div className="space-y-2">
            <Label htmlFor="other-criteria" className="text-base">Success criteria</Label>
            <Textarea
              id="other-criteria"
              className="text-base"
              placeholder={`e.g., ${placeholders[currentAspect].criteria}`}
              rows={3}
              value={value.criteria}
              onChange={(e) => onChange({ ...value, criteria: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3 pt-4">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={onSkip}>
            Skip
          </Button>
          <Button
            size="lg"
            onClick={onNext}
            disabled={value.goal.trim() !== "" && !value.criteria.trim()}
          >
            {isLast ? "Review" : "Next"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
