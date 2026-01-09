"use client"

import { Button } from "@/components/ui/button"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect, GoalType } from "@/lib/types"
import { ASPECT_DEFAULT_GOAL_TYPES } from "./types"
import { ArrowLeft, ArrowRight, Repeat, TrendingUp, Package, Target } from "lucide-react"

interface StepGoalTypeProps {
  aspect: LifeAspect
  selectedType: GoalType | null
  onSelect: (type: GoalType) => void
  onNext: () => void
  onBack: () => void
}

const GOAL_TYPE_CONFIG: Record<
  GoalType,
  {
    icon: typeof Repeat
    label: string
    description: string
    examples: string[]
  }
> = {
  habit: {
    icon: Repeat,
    label: "Habit",
    description: "Build consistent routines through repetition",
    examples: ["Train 4x/week", "Cook dinner 5x/week", "Journal daily"],
  },
  mastery: {
    icon: TrendingUp,
    label: "Mastery",
    description: "Develop skills through progressive learning",
    examples: ["Learn AWS certification", "Master a new technique", "Improve public speaking"],
  },
  project: {
    icon: Package,
    label: "Project",
    description: "Complete deliverables with clear milestones",
    examples: ["Launch side project", "Renovate office", "Write a book"],
  },
  outcome: {
    icon: Target,
    label: "Outcome",
    description: "Achieve measurable targets",
    examples: ["Save RM10k", "Lose 5kg", "Reach 1000 subscribers"],
  },
}

export function StepGoalType({
  aspect,
  selectedType,
  onSelect,
  onNext,
  onBack,
}: StepGoalTypeProps) {
  const aspectConfig = ASPECT_CONFIG[aspect]
  const suggestedType = ASPECT_DEFAULT_GOAL_TYPES[aspect]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          What kind of goal is this?
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Different goal types benefit from different approaches.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Goal area:</p>
        <p className="mt-1 text-lg font-medium" style={{ color: aspectConfig.color }}>
          {aspectConfig.label}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(GOAL_TYPE_CONFIG) as GoalType[]).map((type) => {
          const config = GOAL_TYPE_CONFIG[type]
          const Icon = config.icon
          const isSelected = selectedType === type
          const isSuggested = suggestedType === type

          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`relative flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              {isSuggested && (
                <span className="absolute right-3 top-3 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Suggested
                </span>
              )}
              <div className="flex items-center gap-3">
                <Icon
                  className="h-6 w-6"
                  style={{ color: isSelected ? aspectConfig.color : undefined }}
                />
                <span className="text-lg font-medium">{config.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{config.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {config.examples.slice(0, 2).map((example) => (
                  <span
                    key={example}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button size="lg" onClick={onNext} disabled={!selectedType}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
