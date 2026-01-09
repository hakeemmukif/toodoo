"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { AspectBadge } from "@/components/aspect-badge"
import { ResistanceIndicator } from "@/components/resistance-indicator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Task } from "@/lib/types"
import { MoreHorizontal, Calendar as CalendarIcon, Trash2, SkipForward } from "lucide-react"
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
  const deleteTask = useTasksStore((state) => state.deleteTask)
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

  const handleDelete = async () => {
    await deleteTask(task.id)
  }

  const duration = task.durationEstimate || 30

  // Format time for display (e.g., "19:00" -> "7:00 PM")
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return minutes > 0
      ? `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`
      : `${displayHours} ${period}`
  }

  // Calculate end time from start time + duration
  const getEndTime = (startTime: string, durationMins: number): string => {
    const [hours, minutes] = startTime.split(":").map(Number)
    const totalMinutes = hours * 60 + minutes + durationMins
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`
  }

  // Show hard scheduled time if available, otherwise time preference
  const timeDisplay = task.hardScheduledTime
    ? `${formatTime(task.hardScheduledTime)} - ${formatTime(getEndTime(task.hardScheduledTime, duration))}`
    : task.timePreference.charAt(0).toUpperCase() + task.timePreference.slice(1)

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {task.status === "pending" && (
                <>
                  <DropdownMenuItem onClick={handleSkip}>
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip
                  </DropdownMenuItem>
                  <Popover open={deferOpen} onOpenChange={setDeferOpen}>
                    <PopoverTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Defer
                      </DropdownMenuItem>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end" side="left">
                      <Calendar
                        mode="single"
                        selected={new Date(task.scheduledDate)}
                        onSelect={handleDefer}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <AspectBadge aspect={task.aspect} />
          <span>-</span>
          <span>{duration}min</span>
          <span>-</span>
          <span>{timeDisplay}</span>
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
        {/* Implementation Intention - context cue display */}
        {task.contextCue && task.status === "pending" && (
          <p className="mt-1 text-xs text-muted-foreground/70 italic">
            {task.contextCue}
            {task.implementationPlan && `, I will ${task.implementationPlan}`}
          </p>
        )}
      </div>
    </div>
  )
}
