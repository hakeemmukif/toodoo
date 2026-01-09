"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect } from "@/lib/types"
import { ArrowLeft, ArrowRight, Zap, Plus, X } from "lucide-react"

interface StepPlanProps {
  aspect: LifeAspect
  obstacle: string
  value: string[]
  onChange: (value: string[]) => void
  onNext: () => void
  onBack: () => void
}

const PLAN_TEMPLATES: Record<string, string[]> = {
  procrastination: [
    "set a 5-minute timer and just start",
    "do the minimum version instead",
    "remove distractions first",
  ],
  "fear of failure": [
    "remind myself that learning is the goal",
    "focus on effort not outcome",
    "tell myself this is practice",
  ],
  "lack of energy": [
    "do a scaled-down version",
    "do just 10 minutes to build momentum",
    "schedule it for when I have more energy",
  ],
  "getting distracted": [
    "put my phone in another room",
    "use a website blocker",
    "set a specific start time",
  ],
  "feeling overwhelmed": [
    "break it into smaller steps",
    "focus only on the next action",
    "write down what's overwhelming me",
  ],
  perfectionism: [
    "set a 'good enough' threshold first",
    "give myself permission to iterate",
    "remind myself done > perfect",
  ],
  "self-doubt": [
    "look at past wins for evidence",
    "remind myself I've done hard things before",
    "focus on the process not the result",
  ],
  inconsistency: [
    "make it the same time every day",
    "link it to an existing habit",
    "track it visibly to build momentum",
  ],
}

export function StepPlan({
  aspect,
  obstacle,
  value,
  onChange,
  onNext,
  onBack,
}: StepPlanProps) {
  const config = ASPECT_CONFIG[aspect]
  const [newPlan, setNewPlan] = useState("")

  // Find relevant suggestions based on obstacle text
  const obstacleLower = obstacle.toLowerCase()
  const relevantTemplates = Object.entries(PLAN_TEMPLATES)
    .filter(([key]) => obstacleLower.includes(key))
    .flatMap(([, templates]) => templates)
    .slice(0, 3)

  const addPlan = () => {
    if (newPlan.trim()) {
      onChange([...value, `If ${obstacle}, then I will ${newPlan.trim()}`])
      setNewPlan("")
    }
  }

  const addSuggestion = (suggestion: string) => {
    onChange([...value, `If ${obstacle}, then I will ${suggestion}`])
  }

  const removePlan = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
          <Zap className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Create your if-then plan
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          When obstacles appear, what will you do? Specific plans triple success rates.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Your obstacle:</p>
        <p className="mt-1 text-lg font-medium" style={{ color: config.color }}>
          {obstacle}
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-base">
          If <span className="text-muted-foreground">{obstacle}</span>, then I will...
        </Label>
        <div className="flex gap-2">
          <Input
            className="h-12 flex-1 text-base"
            placeholder="take a specific action..."
            value={newPlan}
            onChange={(e) => setNewPlan(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPlan()}
          />
          <Button size="lg" onClick={addPlan} disabled={!newPlan.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {relevantTemplates.length > 0 && value.length === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Quick suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {relevantTemplates.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addSuggestion(suggestion)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base">Your plans</Label>
          <div className="space-y-2">
            {value.map((plan, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
              >
                <span className="text-sm">{plan}</span>
                <button
                  type="button"
                  onClick={() => removePlan(index)}
                  className="ml-2 rounded-full p-1 hover:bg-muted"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          Why if-then plans work
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pre-deciding your response means you don&apos;t have to think in the moment.
          Your brain recognizes the situation and automatically knows what to do.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button size="lg" onClick={onNext} disabled={value.length === 0}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
