"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { AspectBadge } from "@/components/aspect-badge"
import { ResistanceIndicator } from "@/components/resistance-indicator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Task } from "@/lib/types"
import { X, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTasksStore } from "@/stores/tasks"
import { useAppStore } from "@/stores/app"
import { formatDate } from "@/db"

interface TaskItemProps {
  task: Task
  showDate?: boolean
}

export function TaskItem({ task, showDate = false }: TaskItemProps) {
  const [deferOpen, setDeferOpen] = useState(false)
  const completeTask = useTasksStore((state) => state.completeTask)
  const skipTask = useTasksStore((state) => state.skipTask)
  const deferTask = useTasksStore((state) => state.deferTask)
  const updateTask = useTasksStore((state) => state.updateTask)
  const coachTone = useAppStore((state) => state.settings?.coachTone ?? "balanced")

  const handleComplete = async () => {
    if (task.status === "done") {
      // Uncomplete - set back to pending
      await updateTask(task.id, { status: "pending", completedAt: undefined })
    } else {
      await completeTask(task.id)
    }
  }

  const handleSkip = async () => {
    await skipTask(task.id)
  }

  const handleDefer = async (date: Date | undefined) => {
    if (date) {
      await deferTask(task.id, formatDate(date))
      setDeferOpen(false)
    }
  }

  const duration = task.durationEstimate || 30

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-lg border border-border/60 bg-card p-4 transition-all hover:border-border hover:shadow-sm",
        task.status === "done" && "opacity-50",
        task.status === "skipped" && "opacity-30",
      )}
    >
      <div className="pt-0.5">
        <Checkbox
          checked={task.status === "done"}
          onCheckedChange={handleComplete}
          className="rounded-full"
        />
      </div>

      <div className="flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className={cn("font-serif text-base leading-snug", task.status === "done" && "line-through opacity-60")}>
              {task.title}
            </h4>
            <ResistanceIndicator task={task} coachTone={coachTone} size="sm" />
          </div>
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleSkip}
              disabled={task.status !== "pending"}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Popover open={deferOpen} onOpenChange={setDeferOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={task.status !== "pending"}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={new Date(task.scheduledDate)}
                  onSelect={handleDefer}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <AspectBadge aspect={task.aspect} />
          <span>-</span>
          <span>{duration}min</span>
          <span>-</span>
          <span className="capitalize">{task.timePreference}</span>
          {showDate && (
            <>
              <span>-</span>
              <span>{task.scheduledDate}</span>
            </>
          )}
          {task.status === "skipped" && (
            <>
              <span>-</span>
              <span className="text-yellow-600">Skipped</span>
            </>
          )}
          {task.minimumVersion && task.status === "pending" && (
            <>
              <span>-</span>
              <span className="text-blue-600">Fallback: {task.minimumVersion}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
