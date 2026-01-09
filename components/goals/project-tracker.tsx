"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { ProjectGoal, Milestone, ChecklistItem } from "@/lib/types"
import { Package, Check, Circle, Play, ChevronDown, ChevronRight } from "lucide-react"

interface ProjectTrackerProps {
  project: ProjectGoal
  onMilestoneStatusChange?: (milestoneId: string, status: Milestone["status"]) => void
  onChecklistItemToggle?: (milestoneId: string, itemId: string, completed: boolean) => void
}

export function ProjectTracker({
  project,
  onMilestoneStatusChange,
  onChecklistItemToggle,
}: ProjectTrackerProps) {
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set())

  const sortedMilestones = [...project.milestones].sort((a, b) => a.order - b.order)
  const completedCount = sortedMilestones.filter((m) => m.status === "completed").length
  const progress = sortedMilestones.length > 0
    ? (completedCount / sortedMilestones.length) * 100
    : 0

  const toggleExpand = (id: string) => {
    const next = new Set(expandedMilestones)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpandedMilestones(next)
  }

  const getStatusIcon = (status: Milestone["status"]) => {
    switch (status) {
      case "completed":
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
            <Check className="h-4 w-4 text-white" />
          </div>
        )
      case "in_progress":
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
            <Play className="h-3 w-3 fill-white text-white" />
          </div>
        )
      default:
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
            <Circle className="h-3 w-3 text-muted-foreground" />
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-violet-600" />
          Project Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Milestones</p>
            <p className="text-xl font-bold">
              {completedCount} / {sortedMilestones.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="text-xl font-bold">{Math.round(progress)}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 bg-violet-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Milestone Timeline */}
        <div className="space-y-3">
          {sortedMilestones.map((milestone, index) => {
            const isExpanded = expandedMilestones.has(milestone.id)
            const hasChecklist = milestone.checklistItems && milestone.checklistItems.length > 0
            const checklistProgress = hasChecklist
              ? milestone.checklistItems!.filter((i) => i.completed).length
              : 0

            return (
              <div key={milestone.id} className="relative">
                {/* Connection line */}
                {index < sortedMilestones.length - 1 && (
                  <div
                    className="absolute left-3 top-8 h-full w-0.5 bg-border"
                    style={{ height: "calc(100% - 1rem)" }}
                  />
                )}

                <div
                  className={`rounded-lg border p-4 transition-colors ${
                    milestone.status === "in_progress"
                      ? "border-blue-500/50 bg-blue-500/5"
                      : milestone.status === "completed"
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(milestone.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{milestone.title}</p>
                        {onMilestoneStatusChange && milestone.status !== "completed" && (
                          <div className="flex gap-2">
                            {milestone.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onMilestoneStatusChange(milestone.id, "in_progress")}
                              >
                                Start
                              </Button>
                            )}
                            {milestone.status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() => onMilestoneStatusChange(milestone.id, "completed")}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {milestone.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {milestone.description}
                        </p>
                      )}

                      {milestone.dueDate && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Due: {new Date(milestone.dueDate).toLocaleDateString()}
                        </p>
                      )}

                      {milestone.completedAt && (
                        <p className="mt-1 text-xs text-green-600">
                          Completed {new Date(milestone.completedAt).toLocaleDateString()}
                        </p>
                      )}

                      {milestone.blockedBy && milestone.status !== "completed" && (
                        <p className="mt-2 text-xs text-orange-600">
                          Blocked: {milestone.blockedBy}
                        </p>
                      )}

                      {/* Checklist */}
                      {hasChecklist && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => toggleExpand(milestone.id)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span>
                              Checklist ({checklistProgress}/{milestone.checklistItems!.length})
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-2 pl-6">
                              {milestone.checklistItems!.map((item) => (
                                <div key={item.id} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={item.completed}
                                    onCheckedChange={(checked) =>
                                      onChecklistItemToggle?.(
                                        milestone.id,
                                        item.id,
                                        checked as boolean
                                      )
                                    }
                                    className="h-4 w-4"
                                  />
                                  <span
                                    className={`text-sm ${
                                      item.completed ? "text-muted-foreground line-through" : ""
                                    }`}
                                  >
                                    {item.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Next Action */}
        {project.nextAction && (
          <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
            <p className="text-sm font-medium">Next action:</p>
            <p className="mt-1 text-base">{project.nextAction}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
