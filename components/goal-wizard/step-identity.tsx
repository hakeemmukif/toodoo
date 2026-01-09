"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect, GoalType } from "@/lib/types"
import { ArrowLeft, ArrowRight, User } from "lucide-react"

interface StepIdentityProps {
  aspect: LifeAspect
  goalType: GoalType
  wish: string
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

const IDENTITY_EXAMPLES: Record<LifeAspect, Record<GoalType, string>> = {
  fitness: {
    habit: "trains consistently, no matter what",
    mastery: "is always improving their technique",
    project: "finishes what they start",
    outcome: "takes care of their body",
  },
  nutrition: {
    habit: "fuels their body with good food",
    mastery: "enjoys cooking healthy meals",
    project: "plans ahead for success",
    outcome: "makes health a priority",
  },
  career: {
    habit: "does deep work every day",
    mastery: "is always learning and growing",
    project: "delivers quality work",
    outcome: "creates value and gets results",
  },
  financial: {
    habit: "manages money intentionally",
    mastery: "understands how money works",
    project: "builds systems for success",
    outcome: "builds wealth over time",
  },
  "side-projects": {
    habit: "makes time for creative work",
    mastery: "builds things that matter",
    project: "ships projects, not ideas",
    outcome: "creates things people use",
  },
  chores: {
    habit: "keeps their space organized",
    mastery: "runs an efficient household",
    project: "takes care of their environment",
    outcome: "maintains a comfortable home",
  },
}

export function StepIdentity({
  aspect,
  goalType,
  wish,
  value,
  onChange,
  onNext,
  onBack,
}: StepIdentityProps) {
  const config = ASPECT_CONFIG[aspect]
  const example = IDENTITY_EXAMPLES[aspect][goalType]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
          <User className="h-6 w-6 text-purple-600" />
        </div>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Who are you becoming?
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Goals come from identity. What type of person achieves this?
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Your wish:</p>
        <p className="mt-1 text-lg font-medium" style={{ color: config.color }}>
          {wish}
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="identity" className="text-base">
          I am becoming someone who...
        </Label>
        <Input
          id="identity"
          className="h-12 text-base"
          placeholder={example}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          e.g., &quot;{example}&quot;
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          Why identity matters
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          When your goal aligns with who you want to be, motivation comes naturally.
          Instead of &quot;I should do this,&quot; it becomes &quot;this is who I am.&quot;
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
