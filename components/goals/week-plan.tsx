"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTasksStore } from "@/stores/tasks"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect, WeeklyGoal, Task, TimePreference, HabitGoal } from "@/lib/types"
import { CalendarDays, Plus, Check, Circle, Shuffle } from "lucide-react"

type PlanningMode = "none" | "selecting" | "flexible"

interface WeekPlanProps {
  weeklyGoal: WeeklyGoal
  aspect: LifeAspect
  linkedTasks: Task[]
  defaultTaskTitle?: string
  targetOverride?: number // Allow parent to pass target if weeklyGoal.frequency is not set
  habitConfig?: HabitGoal // For suggested days and flexible mode
}

interface DaySlot {
  date: string
  dayName: string
  dayNum: number
  isToday: boolean
  isPast: boolean
  task: Task | null
}

/**
 * Get all days in a week from a week string (e.g., "2026-W02")
 */
function getWeekDays(weekString: string): DaySlot[] {
  const [yearStr, weekPart] = weekString.split("-W")
  const year = parseInt(yearStr)
  const week = parseInt(weekPart)

  // Find the first day of the year
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const firstMonday = new Date(jan4)
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1)

  // Go to the target week
  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7)

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const result: DaySlot[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    d.setHours(0, 0, 0, 0)

    result.push({
      date: d.toISOString().split("T")[0],
      dayName: days[i],
      dayNum: d.getDate(),
      isToday: d.getTime() === today.getTime(),
      isPast: d < today,
      task: null,
    })
  }

  return result
}

export function WeekPlan({ weeklyGoal, aspect, linkedTasks, defaultTaskTitle, targetOverride, habitConfig }: WeekPlanProps) {
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [formTitle, setFormTitle] = useState("")
  const [formTimePreference, setFormTimePreference] = useState<TimePreference>("evening")
  const [formTime, setFormTime] = useState<string>("") // Specific time (optional)
  const [formDuration, setFormDuration] = useState("60")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Planning mode state
  const [planningMode, setPlanningMode] = useState<PlanningMode>("none")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [isBulkScheduling, setIsBulkScheduling] = useState(false)

  const addTask = useTasksStore((s) => s.addTask)
  const aspectConfig = ASPECT_CONFIG[aspect]

  // Build week view with tasks mapped to days
  const weekDays = getWeekDays(weeklyGoal.week)

  // Map tasks to their scheduled dates (allow multiple tasks per day)
  const tasksByDate = new Map<string, Task[]>()
  linkedTasks.forEach((t) => {
    if (t.scheduledDate) {
      const existing = tasksByDate.get(t.scheduledDate) || []
      tasksByDate.set(t.scheduledDate, [...existing, t])
    }
  })

  // Attach tasks to days
  const daysWithTasks = weekDays.map((day) => ({
    ...day,
    tasks: tasksByDate.get(day.date) || [],
  }))

  // Calculate progress - use targetOverride if weeklyGoal.frequency is not set
  const target = targetOverride || weeklyGoal.frequency?.target || 4
  const scheduled = linkedTasks.length
  const completed = linkedTasks.filter((t) => t.status === "done").length
  const remaining = Math.max(0, target - scheduled)

  // Get action name for display
  const actionName = habitConfig?.action || weeklyGoal.frequency?.action || "session"

  // Suggest days for remaining sessions (prefer weekdays, spread out)
  const suggestedDays = daysWithTasks
    .filter((d) => d.tasks.length === 0 && !d.isPast)
    .slice(0, remaining)

  // Determine if we should show planning mode (only when NO tasks exist yet)
  const shouldShowPlanning = linkedTasks.length === 0 && remaining > 0 && planningMode !== "flexible"
  const isInPlanningMode = shouldShowPlanning || (planningMode === "selecting" && linkedTasks.length === 0)

  // Auto-enter planning mode when no tasks exist
  useEffect(() => {
    if (linkedTasks.length === 0 && remaining > 0 && planningMode === "none") {
      setPlanningMode("selecting")
    }
    // Exit planning mode if tasks were added
    if (linkedTasks.length > 0 && planningMode === "selecting") {
      setPlanningMode("none")
    }
  }, [linkedTasks.length, remaining, planningMode])

  // Pre-select suggested days if habit has preferred days
  useEffect(() => {
    if (planningMode === "selecting" && habitConfig?.suggestedDays && selectedDays.length === 0) {
      // Convert day-of-week numbers (0=Sun or 1=Mon) to actual dates
      const preSelectedDates: string[] = []
      daysWithTasks.forEach((day, index) => {
        // weekDays are Mon-Sun, so index 0 = Monday (1), index 6 = Sunday (0 or 7)
        const dayOfWeek = index === 6 ? 0 : index + 1 // Convert to JS day of week
        if (habitConfig.suggestedDays?.includes(dayOfWeek) && !day.isPast) {
          preSelectedDates.push(day.date)
        }
      })
      if (preSelectedDates.length > 0) {
        setSelectedDays(preSelectedDates.slice(0, target))
      }
    }
  }, [planningMode, habitConfig?.suggestedDays, daysWithTasks, selectedDays.length, target])

  // Toggle day selection
  const handleToggleDay = (date: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(date)) {
        return prev.filter((d) => d !== date)
      }
      // Don't allow selecting more than target
      if (prev.length >= target) {
        return prev
      }
      return [...prev, date]
    })
  }

  // Bulk schedule all selected days
  const handleBulkSchedule = async () => {
    if (selectedDays.length === 0) return

    setIsBulkScheduling(true)
    try {
      const taskTitle = defaultTaskTitle || `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} session`

      // Create tasks for all selected days
      for (const date of selectedDays) {
        await addTask({
          title: taskTitle,
          aspect,
          status: "pending",
          scheduledDate: date,
          timePreference: "evening",
          durationEstimate: 60,
          deferCount: 0,
          weeklyGoalId: weeklyGoal.id,
        })
      }

      // Reset state
      setSelectedDays([])
      setPlanningMode("none")
    } finally {
      setIsBulkScheduling(false)
    }
  }

  // Log a completed session (for flexible mode)
  const handleLogCompletedSession = async () => {
    const today = new Date().toISOString().split("T")[0]
    const taskTitle = defaultTaskTitle || `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} session`

    setIsSubmitting(true)
    try {
      await addTask({
        title: taskTitle,
        aspect,
        status: "done",
        scheduledDate: today,
        timePreference: "anytime",
        durationEstimate: 60,
        deferCount: 0,
        weeklyGoalId: weeklyGoal.id,
        completedAt: new Date(),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenAddTask = (date: string, isPastDate = false) => {
    setSelectedDate(date)
    setFormTitle(defaultTaskTitle || `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} session`)
    setFormTimePreference("evening")
    setFormTime("") // Reset time
    setFormDuration("60")
    setAddTaskOpen(true)
    // Store whether this is a retroactive log
    setIsRetroactiveLog(isPastDate)
  }

  // State for retroactive logging
  const [isRetroactiveLog, setIsRetroactiveLog] = useState(false)

  const handleAddTask = async () => {
    if (!formTitle.trim() || !selectedDate) return

    setIsSubmitting(true)
    try {
      // If logging retroactively, mark as done immediately
      const taskStatus = isRetroactiveLog ? "done" : "pending"
      const completedAt = isRetroactiveLog ? new Date(selectedDate + "T23:59:59") : undefined

      await addTask({
        title: formTitle.trim(),
        aspect,
        status: taskStatus,
        scheduledDate: selectedDate,
        timePreference: formTimePreference,
        hardScheduledTime: formTime || undefined, // Specific time if set
        durationEstimate: parseInt(formDuration) || 60,
        deferCount: 0,
        weeklyGoalId: weeklyGoal.id,
        completedAt,
      })

      setAddTaskOpen(false)
      setIsRetroactiveLog(false)
      setFormTime("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5" />
              This Week&apos;s Plan
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: aspectConfig.color }}>
                {completed}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-lg text-muted-foreground">{target}</span>
              <Badge
                variant={completed >= target ? "default" : "secondary"}
                className={completed >= target ? "bg-emerald-500" : ""}
              >
                {completed >= target ? "Goal Met!" : `${remaining} to go`}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (completed / target) * 100)}%`,
                  backgroundColor: aspectConfig.color,
                }}
              />
            </div>
          </div>

          {/* Planning Mode UI */}
          {isInPlanningMode && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Pick {target} days for your {actionName} sessions
              </p>

              {/* Day Selection Grid */}
              <div className="grid grid-cols-7 gap-2">
                {daysWithTasks.map((day) => {
                  const isSelected = selectedDays.includes(day.date)
                  const canSelect = !day.isPast && (isSelected || selectedDays.length < target)

                  return (
                    <button
                      key={day.date}
                      onClick={() => canSelect && handleToggleDay(day.date)}
                      disabled={day.isPast}
                      className={`
                        flex flex-col items-center rounded-lg p-3 text-center transition-all
                        ${day.isToday ? "ring-2 ring-offset-2 ring-primary" : ""}
                        ${day.isPast ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-muted/50"}
                        ${isSelected ? "bg-primary/10 border-2" : "border-2 border-transparent"}
                      `}
                      style={{
                        borderColor: isSelected ? aspectConfig.color : "transparent",
                        backgroundColor: isSelected ? `${aspectConfig.color}15` : undefined,
                      }}
                    >
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {day.dayName}
                      </span>
                      <span className={`text-sm font-semibold ${day.isToday ? "" : "text-muted-foreground"}`}>
                        {day.dayNum}
                      </span>
                      <div className="mt-1.5 h-5 w-5 flex items-center justify-center">
                        {isSelected && (
                          <Check className="h-4 w-4" style={{ color: aspectConfig.color }} />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Selection status */}
              <div className="text-center">
                {selectedDays.length === target ? (
                  <Badge className="bg-emerald-500">{target} days selected - ready to plan!</Badge>
                ) : (
                  <Badge variant="secondary">
                    {selectedDays.length} of {target} days selected
                  </Badge>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  onClick={handleBulkSchedule}
                  disabled={selectedDays.length === 0 || isBulkScheduling}
                  style={{ backgroundColor: selectedDays.length > 0 ? aspectConfig.color : undefined }}
                >
                  {isBulkScheduling ? "Scheduling..." : `Schedule ${selectedDays.length} Sessions`}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setPlanningMode("flexible")}
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Keep it Flexible
                </Button>
              </div>
            </div>
          )}

          {/* Flexible Mode UI */}
          {planningMode === "flexible" && linkedTasks.length === 0 && (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Complete {target} {actionName} sessions this week - whenever works for you
              </p>
              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={handleLogCompletedSession}
                  disabled={isSubmitting}
                  style={{ backgroundColor: aspectConfig.color }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Logging..." : "Log Completed Session"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPlanningMode("selecting")}
                >
                  Pick specific days instead
                </Button>
              </div>
            </div>
          )}

          {/* Normal Week Grid (when tasks exist or flexible mode with some tasks) */}
          {!isInPlanningMode && !(planningMode === "flexible" && linkedTasks.length === 0) && (
            <>
              <div className="grid grid-cols-7 gap-2">
                {daysWithTasks.map((day) => {
                  const hasTasks = day.tasks.length > 0
                  const completedCount = day.tasks.filter((t) => t.status === "done").length
                  const allCompleted = hasTasks && completedCount === day.tasks.length
                  const isSuggested = suggestedDays.some((s) => s.date === day.date)

                  return (
                    <div
                      key={day.date}
                      className={`
                        flex flex-col items-center rounded-lg p-2 text-center transition-all
                        ${day.isToday ? "ring-2 ring-offset-2 ring-primary" : ""}
                        ${hasTasks ? "bg-muted/50" : isSuggested ? "bg-muted/30 border-2 border-dashed border-muted-foreground/30" : ""}
                      `}
                    >
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {day.dayName}
                      </span>
                      <span className={`text-sm font-semibold ${day.isToday ? "" : "text-muted-foreground"}`}>
                        {day.dayNum}
                      </span>

                      {/* Status indicator */}
                      <div className="mt-1.5 h-6 w-6 flex items-center justify-center">
                        {allCompleted ? (
                          <Check
                            className="h-5 w-5"
                            style={{ color: aspectConfig.color }}
                          />
                        ) : hasTasks ? (
                          <div className="relative">
                            <Circle
                              className="h-4 w-4"
                              style={{ color: aspectConfig.color }}
                            />
                            {day.tasks.length > 1 && (
                              <span
                                className="absolute -top-1 -right-2 text-[9px] font-bold"
                                style={{ color: aspectConfig.color }}
                              >
                                {day.tasks.length}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAddTask(day.date, day.isPast)}
                            className={`
                              h-6 w-6 rounded-full flex items-center justify-center
                              transition-colors hover:bg-muted
                              ${day.isPast ? "text-muted-foreground/30 hover:text-muted-foreground" : ""}
                              ${isSuggested ? "text-muted-foreground" : "text-muted-foreground/50"}
                            `}
                            title={day.isPast ? `Log completed session for ${day.dayName}` : `Add session for ${day.dayName}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Quick action for suggested days */}
              {remaining > 0 && suggestedDays.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Suggested:</span>
                  {suggestedDays.map((day) => (
                    <Button
                      key={day.date}
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenAddTask(day.date)}
                      className="h-7 text-xs"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {day.dayName} {day.dayNum}
                    </Button>
                  ))}
                </div>
              )}

              {/* Flexible mode: show log button */}
              {planningMode === "flexible" && remaining > 0 && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={handleLogCompletedSession}
                    disabled={isSubmitting}
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Logging..." : "Log Completed Session"}
                  </Button>
                </div>
              )}

              {/* All planned message */}
              {scheduled >= target && completed < target && (
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  All {target} sessions scheduled. Complete them to hit your target!
                </p>
              )}

              {/* Goal achieved message */}
              {completed >= target && (
                <p className="mt-4 text-sm text-emerald-600 text-center font-medium">
                  You&apos;ve hit your target for this week!
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={(open) => {
        setAddTaskOpen(open)
        if (!open) setIsRetroactiveLog(false)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isRetroactiveLog ? "Log Completed Session" : "Schedule Session"}
            </DialogTitle>
            <DialogDescription>
              {isRetroactiveLog ? (
                <>Record a session you completed on {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}</>
              ) : (
                <>Add a session for {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Session Title</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="What will you do?"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Time Preference</Label>
              <Select
                value={formTimePreference}
                onValueChange={(v) => setFormTimePreference(v as TimePreference)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="anytime">Anytime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Specific Time (optional)</Label>
              <Input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for flexible scheduling
              </p>
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                min="15"
                max="240"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              disabled={!formTitle.trim() || isSubmitting}
            >
              {isSubmitting
                ? (isRetroactiveLog ? "Logging..." : "Adding...")
                : (isRetroactiveLog ? "Log as Completed" : "Add Session")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
