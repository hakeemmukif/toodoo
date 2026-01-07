"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useTasksStore } from "@/stores/tasks"
import { useTrainingStore } from "@/stores/training"
import { useMealsStore } from "@/stores/meals"
import { useJournalStore } from "@/stores/journal"
import { formatDate } from "@/db"
import { ChevronLeft, ChevronRight, Dumbbell, Utensils, BookOpen, ListTodo } from "lucide-react"

// Format time for display (e.g., "19:00" -> "7pm")
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number)
  const period = hours >= 12 ? "pm" : "am"
  const displayHours = hours % 12 || 12
  return minutes > 0
    ? `${displayHours}:${String(minutes).padStart(2, "0")}${period}`
    : `${displayHours}${period}`
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"week" | "month">("week")

  const tasks = useTasksStore((state) => state.tasks)
  const trainingSessions = useTrainingStore((state) => state.sessions)
  const meals = useMealsStore((state) => state.meals)
  const journalEntries = useJournalStore((state) => state.entries)

  // Helper to get days in current view
  const getDaysInView = () => {
    if (view === "week") {
      // Show 7 days starting from currentDate (today by default)
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentDate)
        date.setDate(currentDate.getDate() + i)
        return date
      })
    } else {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - startDate.getDay())
      const endDate = new Date(lastDay)
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))
      const days = []
      const current = new Date(startDate)
      while (current <= endDate) {
        days.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }
      return days
    }
  }

  const days = getDaysInView()
  const today = formatDate(new Date())

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate)
    if (view === "week") {
      newDate.setDate(newDate.getDate() + direction * 7)
    } else {
      newDate.setMonth(newDate.getMonth() + direction)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get data for a specific date
  const getDateData = (dateStr: string) => {
    const dayTasks = tasks.filter((t) => t.scheduledDate === dateStr)
    const daySessions = trainingSessions.filter((s) => s.date === dateStr)
    const dayMeals = meals.filter((m) => m.date === dateStr)
    const dayJournals = journalEntries.filter(
      (j) => new Date(j.timestamp).toISOString().split("T")[0] === dateStr
    )

    return { dayTasks, daySessions, dayMeals, dayJournals }
  }

  return (
    <AppLayout>
      <div className="container max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">View your schedule and activity history</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>
              Week
            </Button>
            <Button variant={view === "month" ? "default" : "outline"} size="sm" onClick={() => setView("month")}>
              Month
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <ListTodo className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4 text-orange-500" />
            <span className="text-muted-foreground">Training</span>
          </div>
          <div className="flex items-center gap-1">
            <Utensils className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">Meals</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Journal</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={view === "week" ? "space-y-2" : "grid grid-cols-7 gap-2"}>
          {view === "month" && (
            <>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </>
          )}
          {days.map((date) => {
            const dateStr = formatDate(date)
            const { dayTasks, daySessions, dayMeals, dayJournals } = getDateData(dateStr)
            const isToday = dateStr === today
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()

            const pendingTasks = dayTasks.filter((t) => t.status === "pending")
            const completedTasks = dayTasks.filter((t) => t.status === "done")

            if (view === "week") {
              return (
                <Card key={dateStr} className={isToday ? "border-primary" : ""}>
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {date.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div className={`text-2xl font-bold ${isToday ? "text-primary" : ""}`}>{date.getDate()}</div>
                      </div>
                      <div className="flex gap-2">
                        {daySessions.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-orange-500">
                            <Dumbbell className="h-3 w-3" />
                            {daySessions.length}
                          </div>
                        )}
                        {dayMeals.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-500">
                            <Utensils className="h-3 w-3" />
                            {dayMeals.length}
                          </div>
                        )}
                        {dayJournals.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-blue-500">
                            <BookOpen className="h-3 w-3" />
                            {dayJournals.length}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {pendingTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded border-l-4 bg-muted/50 p-2 text-xs"
                          style={{ borderLeftColor: ASPECT_CONFIG[task.aspect].color }}
                        >
                          <div className="font-medium">{task.title}</div>
                          <div className="text-muted-foreground">
                            {task.hardScheduledTime
                              ? formatTime(task.hardScheduledTime)
                              : task.timePreference} - {task.durationEstimate || 30}m
                          </div>
                        </div>
                      ))}
                      {completedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded border-l-4 bg-muted/30 p-2 text-xs opacity-60"
                          style={{ borderLeftColor: ASPECT_CONFIG[task.aspect].color }}
                        >
                          <div className="font-medium line-through">{task.title}</div>
                        </div>
                      ))}
                      {daySessions.map((session) => (
                        <div
                          key={session.id}
                          className="rounded border-l-4 border-l-orange-500 bg-orange-500/10 p-2 text-xs"
                        >
                          <div className="font-medium capitalize">{session.type.replace("-", " ")}</div>
                          <div className="text-muted-foreground">{session.duration}m - Intensity: {session.intensity}/10</div>
                        </div>
                      ))}
                    </div>
                    {dayTasks.length === 0 && daySessions.length === 0 && (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        No scheduled activities
                      </div>
                    )}
                  </div>
                </Card>
              )
            } else {
              const totalItems = dayTasks.length + daySessions.length
              const hasActivity = totalItems > 0 || dayMeals.length > 0 || dayJournals.length > 0

              return (
                <Card
                  key={dateStr}
                  className={`min-h-[100px] p-2 ${isToday ? "border-primary" : ""} ${!isCurrentMonth ? "opacity-50" : ""}`}
                >
                  <div className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{date.getDate()}</div>
                  <div className="mt-1 space-y-1">
                    {dayTasks.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className={`truncate rounded px-1 py-0.5 text-xs ${task.status === "done" ? "line-through opacity-60" : ""}`}
                        style={{ backgroundColor: `${ASPECT_CONFIG[task.aspect].color}20` }}
                      >
                        {task.title}
                      </div>
                    ))}
                    {hasActivity && (
                      <div className="flex gap-1 pt-1">
                        {daySessions.length > 0 && (
                          <Dumbbell className="h-3 w-3 text-orange-500" />
                        )}
                        {dayMeals.length > 0 && (
                          <Utensils className="h-3 w-3 text-green-500" />
                        )}
                        {dayJournals.length > 0 && (
                          <BookOpen className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                    )}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{dayTasks.length - 2} more</div>
                    )}
                  </div>
                </Card>
              )
            }
          })}
        </div>
      </div>
    </AppLayout>
  )
}
