"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect } from "@/lib/types"
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react"

interface StepObstacleProps {
  aspect: LifeAspect
  wish: string
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

const COMMON_OBSTACLES = [
  "Procrastination",
  "Fear of failure",
  "Lack of energy",
  "Getting distracted",
  "Feeling overwhelmed",
  "Perfectionism",
  "Self-doubt",
  "Inconsistency",
]

export function StepObstacle({
  aspect,
  wish,
  value,
  onChange,
  onNext,
  onBack,
}: StepObstacleProps) {
  const config = ASPECT_CONFIG[aspect]
  const [showSuggestions, setShowSuggestions] = useState(false)

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
        </div>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          What might get in your way?
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Think about the main obstacle <em>within you</em> that could prevent success.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Your wish:</p>
        <p className="mt-1 text-lg font-medium" style={{ color: config.color }}>
          {wish}
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="obstacle" className="text-base">
          Your main inner obstacle
        </Label>
        <Textarea
          id="obstacle"
          className="min-h-[100px] resize-none text-base"
          placeholder="When I think about this goal, what usually stops me is..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={() => setShowSuggestions(!showSuggestions)}
        >
          {showSuggestions ? "Hide suggestions" : "Need ideas? See common obstacles"}
        </button>
      </div>

      {showSuggestions && (
        <div className="flex flex-wrap gap-2">
          {COMMON_OBSTACLES.map((obstacle) => (
            <button
              key={obstacle}
              type="button"
              onClick={() => onChange(value ? `${value}, ${obstacle.toLowerCase()}` : obstacle)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              {obstacle}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          Why internal obstacles?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          External obstacles (time, money, others) are real, but internal ones
          (procrastination, fear, doubt) are usually the actual blockers.
          Being honest about these helps you plan for them.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button size="lg" onClick={onNext} disabled={!value.trim()}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
