"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ASPECT_CONFIG } from "@/lib/constants"
import { generateId } from "@/db"
import type { LifeAspect, ProjectGoal, Milestone } from "@/lib/types"
import { ArrowLeft, ArrowRight, Package, Plus, X, GripVertical } from "lucide-react"

interface StepConfigureProjectProps {
  aspect: LifeAspect
  wish: string
  value: Partial<ProjectGoal> | null
  onChange: (value: Partial<ProjectGoal>) => void
  onNext: () => void
  onBack: () => void
}

export function StepConfigureProject({
  aspect,
  wish,
  value,
  onChange,
  onNext,
  onBack,
}: StepConfigureProjectProps) {
  const config = ASPECT_CONFIG[aspect]
  const [newMilestone, setNewMilestone] = useState("")

  const projectValue: Partial<ProjectGoal> = value || {
    milestones: [],
    nextAction: "",
  }

  const updateValue = (updates: Partial<ProjectGoal>) => {
    onChange({ ...projectValue, ...updates })
  }

  const addMilestone = () => {
    if (newMilestone.trim()) {
      const milestones = projectValue.milestones || []
      updateValue({
        milestones: [
          ...milestones,
          {
            id: generateId(),
            title: newMilestone.trim(),
            order: milestones.length,
            status: "pending",
          },
        ],
      })
      setNewMilestone("")
    }
  }

  const removeMilestone = (id: string) => {
    const milestones = projectValue.milestones || []
    updateValue({
      milestones: milestones
        .filter((m) => m.id !== id)
        .map((m, index) => ({ ...m, order: index })),
    })
  }

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    const milestones = projectValue.milestones || []
    updateValue({
      milestones: milestones.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })
  }

  const isValid = (projectValue.milestones?.length || 0) >= 1

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
          <Package className="h-6 w-6 text-violet-600" />
        </div>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Break it into milestones
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          What are the major steps to complete this project?
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Your wish:</p>
        <p className="mt-1 text-lg font-medium" style={{ color: config.color }}>
          {wish}
        </p>
      </div>

      <div className="space-y-6">
        {/* Add milestone input */}
        <div className="space-y-3">
          <Label className="text-base">Add milestones</Label>
          <div className="flex gap-2">
            <Input
              className="h-12 flex-1 text-base"
              placeholder="What's a major step toward completion?"
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMilestone()}
            />
            <Button size="lg" onClick={addMilestone} disabled={!newMilestone.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Start with the first major step. You can add more as you go.
          </p>
        </div>

        {/* Milestones list */}
        {(projectValue.milestones?.length || 0) > 0 && (
          <div className="space-y-3">
            <Label className="text-base">Your milestones</Label>
            <div className="space-y-2">
              {projectValue.milestones?.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <Input
                    className="flex-1"
                    value={milestone.title}
                    onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestone(milestone.id)}
                    className="rounded p-1 hover:bg-muted"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next action */}
        <div className="space-y-3">
          <Label className="text-base">What&apos;s the very next action?</Label>
          <Input
            className="h-12 text-base"
            placeholder="The smallest concrete step to start..."
            value={projectValue.nextAction || ""}
            onChange={(e) => updateValue({ nextAction: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">
            What&apos;s one tiny thing you can do to move forward?
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          Start small
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          You don&apos;t need to plan everything now. List 2-4 major milestones
          to start. The next action keeps you moving forward.
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
