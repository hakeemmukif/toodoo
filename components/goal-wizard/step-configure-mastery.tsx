"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ASPECT_CONFIG } from "@/lib/constants"
import { generateId } from "@/db"
import type { LifeAspect, MasteryGoal, SkillLevel } from "@/lib/types"
import { ArrowLeft, ArrowRight, TrendingUp, Plus, X, GripVertical } from "lucide-react"

interface StepConfigureMasteryProps {
  aspect: LifeAspect
  wish: string
  value: Partial<MasteryGoal> | null
  onChange: (value: Partial<MasteryGoal>) => void
  onNext: () => void
  onBack: () => void
}

const DEFAULT_LEVELS = [
  { title: "Beginner", criteria: "Just getting started, learning the basics" },
  { title: "Competent", criteria: "Can do the fundamentals independently" },
  { title: "Proficient", criteria: "Consistent quality, handling complexity" },
  { title: "Expert", criteria: "Teaching others, innovating approaches" },
]

export function StepConfigureMastery({
  aspect,
  wish,
  value,
  onChange,
  onNext,
  onBack,
}: StepConfigureMasteryProps) {
  const config = ASPECT_CONFIG[aspect]
  const [newLevel, setNewLevel] = useState({ title: "", criteria: "" })

  const masteryValue: Partial<MasteryGoal> = value || {
    skillLevels: DEFAULT_LEVELS.map((level, index) => ({
      id: generateId(),
      ...level,
      order: index,
      achieved: false,
    })),
    currentLevel: 0,
    resources: [],
    practiceLog: [],
  }

  const updateValue = (updates: Partial<MasteryGoal>) => {
    onChange({ ...masteryValue, ...updates })
  }

  const addLevel = () => {
    if (newLevel.title.trim()) {
      const levels = masteryValue.skillLevels || []
      updateValue({
        skillLevels: [
          ...levels,
          {
            id: generateId(),
            title: newLevel.title,
            criteria: newLevel.criteria,
            order: levels.length,
            achieved: false,
          },
        ],
      })
      setNewLevel({ title: "", criteria: "" })
    }
  }

  const removeLevel = (id: string) => {
    const levels = masteryValue.skillLevels || []
    updateValue({
      skillLevels: levels
        .filter((l) => l.id !== id)
        .map((l, index) => ({ ...l, order: index })),
    })
  }

  const updateLevel = (id: string, updates: Partial<SkillLevel>) => {
    const levels = masteryValue.skillLevels || []
    updateValue({
      skillLevels: levels.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })
  }

  const isValid = (masteryValue.skillLevels?.length || 0) >= 2

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <TrendingUp className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Define your skill levels
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          What does progression look like for this skill?
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Your wish:</p>
        <p className="mt-1 text-lg font-medium" style={{ color: config.color }}>
          {wish}
        </p>
      </div>

      <div className="space-y-6">
        {/* Existing levels */}
        <div className="space-y-3">
          <Label className="text-base">Skill progression levels</Label>
          <div className="space-y-3">
            {masteryValue.skillLevels?.map((level, index) => (
              <div
                key={level.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-background p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    className="font-medium"
                    placeholder="Level name"
                    value={level.title}
                    onChange={(e) => updateLevel(level.id, { title: e.target.value })}
                  />
                  <Input
                    className="text-sm"
                    placeholder="What does this level look like?"
                    value={level.criteria}
                    onChange={(e) => updateLevel(level.id, { criteria: e.target.value })}
                  />
                </div>
                {(masteryValue.skillLevels?.length || 0) > 2 && (
                  <button
                    type="button"
                    onClick={() => removeLevel(level.id)}
                    className="rounded p-1 hover:bg-muted"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add new level */}
        <div className="space-y-3">
          <Label className="text-base">Add another level (optional)</Label>
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Level name"
                value={newLevel.title}
                onChange={(e) => setNewLevel({ ...newLevel, title: e.target.value })}
              />
              <Input
                placeholder="What demonstrates this level?"
                value={newLevel.criteria}
                onChange={(e) => setNewLevel({ ...newLevel, criteria: e.target.value })}
              />
            </div>
            <Button
              variant="outline"
              onClick={addLevel}
              disabled={!newLevel.title.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current level */}
        <div className="space-y-2">
          <Label className="text-base">Where are you now?</Label>
          <div className="flex flex-wrap gap-2">
            {masteryValue.skillLevels?.map((level, index) => (
              <button
                key={level.id}
                type="button"
                onClick={() => updateValue({ currentLevel: index })}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  masteryValue.currentLevel === index
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {level.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          Why skill levels matter
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Clear progression markers help you see growth and stay motivated.
          Focus on moving to the next level, not jumping to expert.
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
