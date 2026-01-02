"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect } from "@/lib/types"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface StepYearlyProps {
  aspect: LifeAspect
  value: { title: string; criteria: string }
  onChange: (value: { title: string; criteria: string }) => void
  onNext: () => void
  onBack: () => void
}

export function StepYearly({ aspect, value, onChange, onNext, onBack }: StepYearlyProps) {
  const config = ASPECT_CONFIG[aspect]
  const Icon = config.icon

  const placeholders: Record<LifeAspect, { goal: string; criteria: string }> = {
    fitness: {
      goal: "e.g., Train 4x per week consistently",
      criteria: "e.g., Complete 200+ training sessions by year end",
    },
    nutrition: {
      goal: "e.g., Cook 80% of my meals at home",
      criteria: "e.g., Log at least 250 home-cooked meals",
    },
    career: {
      goal: "e.g., Get promoted to senior role",
      criteria: "e.g., Lead 2 major projects and complete certification",
    },
    financial: {
      goal: "e.g., Save 20% of income each month",
      criteria: "e.g., Build emergency fund of 6 months expenses",
    },
    "side-projects": {
      goal: "e.g., Launch my side project",
      criteria: "e.g., Ship MVP and get 100 users",
    },
    chores: {
      goal: "e.g., Keep home organized weekly",
      criteria: "e.g., Maintain weekly cleaning routine consistently",
    },
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Icon className="h-10 w-10" style={{ color: config.color }} />
        </div>
        <h2 className="text-2xl font-semibold sm:text-3xl">What's your {config.label} goal for this year?</h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">Think big. What would make this year a success?</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="yearly-goal" className="text-base">Your yearly goal</Label>
          <Input
            id="yearly-goal"
            className="h-12 text-base"
            placeholder={placeholders[aspect].goal}
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="criteria" className="text-base">How will you know you've achieved it?</Label>
          <Textarea
            id="criteria"
            className="text-base"
            placeholder={placeholders[aspect].criteria}
            rows={4}
            value={value.criteria}
            onChange={(e) => onChange({ ...value, criteria: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button size="lg" onClick={onNext} disabled={!value.title || !value.criteria}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
