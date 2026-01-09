"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect, GoalType } from "@/lib/types"
import { ArrowLeft, ArrowRight, Eye } from "lucide-react"

interface StepOutcomeProps {
  aspect: LifeAspect
  goalType: GoalType
  wish: string
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

const VISUALIZATION_PROMPTS = [
  "Close your eyes. Imagine you've achieved this goal.",
  "Picture your life when this is done.",
  "What does success look like?",
]

const VISUALIZATION_QUESTIONS = [
  "How do you feel?",
  "What's different in your daily life?",
  "What can you do now that you couldn't before?",
  "Who notices the change?",
]

export function StepOutcome({
  aspect,
  goalType,
  wish,
  value,
  onChange,
  onNext,
  onBack,
}: StepOutcomeProps) {
  const config = ASPECT_CONFIG[aspect]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <Eye className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Imagine the best outcome
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {VISUALIZATION_PROMPTS[Math.floor(Math.random() * VISUALIZATION_PROMPTS.length)]}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Your wish:</p>
        <p className="mt-1 text-lg font-medium" style={{ color: config.color }}>
          {wish}
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="outcome" className="text-base">
          Describe the best possible outcome
        </Label>
        <Textarea
          id="outcome"
          className="min-h-[150px] resize-none text-base"
          placeholder="When I achieve this goal, I will feel... My life will be different because... I'll be able to..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Think about:
        </p>
        <ul className="space-y-1.5">
          {VISUALIZATION_QUESTIONS.map((question) => (
            <li key={question} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              {question}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-sm text-muted-foreground italic">
        Spend 30 seconds really visualizing this. The more vivid, the more motivating.
      </p>

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
