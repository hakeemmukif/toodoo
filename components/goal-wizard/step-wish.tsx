"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect, GoalType } from "@/lib/types"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"

interface StepWishProps {
  aspect: LifeAspect
  goalType: GoalType
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

const WISH_PROMPTS: Record<GoalType, string[]> = {
  habit: [
    "What routine do you want to build?",
    "What would you do consistently if you could?",
    "What habit would transform your daily life?",
  ],
  mastery: [
    "What skill do you want to develop?",
    "What would you love to become great at?",
    "What capability do you want to build?",
  ],
  project: [
    "What do you want to create or complete?",
    "What deliverable would you be proud of?",
    "What project have you been putting off?",
  ],
  outcome: [
    "What measurable result do you want?",
    "What number would you celebrate reaching?",
    "What target would change things for you?",
  ],
}

const WISH_EXAMPLES: Record<LifeAspect, Record<GoalType, string>> = {
  fitness: {
    habit: "Train muay thai consistently",
    mastery: "Improve my technique and conditioning",
    project: "Complete a training program",
    outcome: "Reach my target weight",
  },
  nutrition: {
    habit: "Cook healthy meals at home",
    mastery: "Learn to cook new cuisines",
    project: "Plan and prep all meals for a month",
    outcome: "Reduce eating out to 2x/week",
  },
  career: {
    habit: "Dedicate time to deep work daily",
    mastery: "Become proficient in a new technology",
    project: "Complete a certification",
    outcome: "Get promoted this year",
  },
  financial: {
    habit: "Review finances weekly",
    mastery: "Learn investing fundamentals",
    project: "Set up automated savings system",
    outcome: "Save RM10,000 this year",
  },
  "side-projects": {
    habit: "Work on projects every weekend",
    mastery: "Build full-stack development skills",
    project: "Launch my side project",
    outcome: "Get 100 users for my app",
  },
  chores: {
    habit: "Keep the house tidy daily",
    mastery: "Organize home efficiently",
    project: "Declutter and organize entire home",
    outcome: "Reduce cleaning time by half",
  },
}

export function StepWish({
  aspect,
  goalType,
  value,
  onChange,
  onNext,
  onBack,
}: StepWishProps) {
  const config = ASPECT_CONFIG[aspect]
  const prompts = WISH_PROMPTS[goalType]
  const example = WISH_EXAMPLES[aspect][goalType]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          What do you really want?
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {prompts[Math.floor(Math.random() * prompts.length)]}
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="wish" className="text-base">
          Your wish
        </Label>
        <Textarea
          id="wish"
          className="min-h-[120px] resize-none text-base"
          placeholder={example}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Be specific about what you want, but don&apos;t worry about how yet.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          The clearer your wish, the better.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Instead of &quot;get fit,&quot; try &quot;{example}&quot;
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
