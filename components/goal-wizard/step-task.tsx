"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ASPECT_CONFIG } from "@/lib/constants"
import { formatDate } from "@/db"
import type { LifeAspect, TimePreference } from "@/lib/types"
import { ArrowLeft, ArrowRight, ChevronDown, Zap } from "lucide-react"

interface StepTaskProps {
  aspect: LifeAspect
  weeklyGoalTitle: string
  value: {
    title: string
    scheduledDate: string
    timePreference: TimePreference
    contextCue?: string
    implementationPlan?: string
  }
  onChange: (value: { title: string; scheduledDate: string; timePreference: TimePreference; contextCue?: string; implementationPlan?: string }) => void
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
  const [showIntention, setShowIntention] = useState(false)
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

  const contextCueSuggestions: Record<LifeAspect, string> = {
    fitness: "When I finish work and get home",
    nutrition: "When it's 6pm and I'm in the kitchen",
    career: "When I sit at my desk in the morning",
    financial: "When I get my paycheck",
    "side-projects": "When it's Saturday morning",
    chores: "When I wake up on Sunday",
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

      {/* Implementation Intention (optional but powerful) */}
      <Collapsible open={showIntention} onOpenChange={setShowIntention}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-dashed border-border p-4 text-left hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Add a trigger (optional)</p>
                <p className="text-sm text-muted-foreground">
                  &quot;When X, I will Y&quot; triples success rates
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                showIntention ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="context-cue" className="text-base">
              When...
            </Label>
            <Input
              id="context-cue"
              className="h-12 text-base"
              placeholder={contextCueSuggestions[aspect]}
              value={value.contextCue || ""}
              onChange={(e) => onChange({ ...value, contextCue: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="implementation" className="text-base">
              I will...
            </Label>
            <Input
              id="implementation"
              className="h-12 text-base"
              placeholder={value.title || "do this task"}
              value={value.implementationPlan || ""}
              onChange={(e) => onChange({ ...value, implementationPlan: e.target.value })}
            />
          </div>
          {value.contextCue && value.implementationPlan && (
            <div className="rounded-lg bg-primary/5 p-4">
              <p className="text-sm font-medium">Your intention:</p>
              <p className="mt-1 text-sm text-muted-foreground">
                &quot;{value.contextCue}, I will {value.implementationPlan}&quot;
              </p>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

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
