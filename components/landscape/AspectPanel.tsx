"use client"

import { useMemo } from "react"
import { ArrowLeft, Plus, ChevronRight, Flame, CheckCircle2, Circle } from "lucide-react"
import type { LifeAspect, Task } from "@/lib/types"
import type { PeakData } from "./types"
import { ASPECT_CONFIG } from "@/lib/constants"
import { ASPECT_HEX, FOCUS_CONFIG } from "./constants"
import { useTasksStore } from "@/stores/tasks"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AspectPanelProps {
  aspect: LifeAspect
  peakData: PeakData
  onClose: () => void
  onAddTask?: () => void
  onViewAll?: () => void
  className?: string
}

/**
 * Left panel showing details for a focused life aspect.
 * Displays progress, streak, pending tasks, and quick actions.
 * Slides in when a peak is clicked in the 3D landscape.
 */
export function AspectPanel({
  aspect,
  peakData,
  onClose,
  onAddTask,
  onViewAll,
  className,
}: AspectPanelProps) {
  const config = ASPECT_CONFIG[aspect]
  const hexColor = ASPECT_HEX[aspect]
  const Icon = config.icon

  // Get pending tasks for this aspect
  const getTasksByAspect = useTasksStore((s) => s.getTasksByAspect)
  const pendingTasks = useMemo(() => {
    return getTasksByAspect(aspect)
      .filter((t) => t.status === "pending")
      .slice(0, 5) // Show max 5 tasks
  }, [aspect, getTasksByAspect])

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card/95 backdrop-blur-md border-r border-border",
        "animate-in slide-in-from-left duration-300",
        className
      )}
      style={{ width: FOCUS_CONFIG.panelWidth }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to overview</span>
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${hexColor}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: hexColor }} />
          </div>
          <div>
            <h2 className="font-semibold text-foreground font-serif text-lg">
              {config.label}
            </h2>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-4 border-b border-border">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{peakData.progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${peakData.progress}%`,
                backgroundColor: hexColor,
              }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flame className="w-4 h-4" style={{ color: hexColor }} />
            <span>Current streak</span>
          </div>
          <span className="font-medium text-foreground">
            {peakData.streak} {peakData.streak === 1 ? "day" : "days"}
          </span>
        </div>

        {/* Task count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pending tasks</span>
          <span className="font-medium text-foreground">{peakData.taskCount}</span>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">Upcoming Tasks</h3>
          {pendingTasks.length > 0 && (
            <button
              onClick={onViewAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {pendingTasks.length === 0 ? (
          <div className="text-center py-8">
            <Circle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No pending tasks</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Add a task to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskItem key={task.id} task={task} accentColor={hexColor} />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          onClick={onAddTask}
          className="w-full"
          style={{ backgroundColor: hexColor }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  )
}

interface TaskItemProps {
  task: Task
  accentColor: string
}

function TaskItem({ task, accentColor }: TaskItemProps) {
  const isCompleted = task.status === "done"

  return (
    <div
      className={cn(
        "p-3 rounded-lg border border-border bg-background/50",
        "hover:bg-background/80 transition-colors cursor-pointer"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4" style={{ color: accentColor }} />
          ) : (
            <Circle className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>
          {task.scheduledDate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTaskDate(task.scheduledDate)}
              {task.hardScheduledTime && ` at ${task.hardScheduledTime}`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTaskDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (dateStr === today.toISOString().split("T")[0]) {
    return "Today"
  }
  if (dateStr === tomorrow.toISOString().split("T")[0]) {
    return "Tomorrow"
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}
