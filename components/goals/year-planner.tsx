"use client"

import { useState, useMemo } from "react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useGoalsStore } from "@/stores/goals"
import { useTasksStore } from "@/stores/tasks"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect, YearlyGoal, MonthlyGoal, WeeklyGoal, Task } from "@/lib/types"
import { Calendar, Sparkles, CheckCircle2, Circle, Minus } from "lucide-react"
import { getWeekString } from "@/services/goal-linking"

interface YearPlannerProps {
  yearlyGoal: YearlyGoal
  monthlyGoals: MonthlyGoal[]
  weeklyGoals: WeeklyGoal[]
  tasks: Task[]
}

interface WeekData {
  weekString: string
  weekNum: number
  monthIndex: number
  startDate: Date
  weeklyGoal: WeeklyGoal | null
  tasks: Task[]
  target: number
  completed: number
  status: "empty" | "planned" | "partial" | "complete" | "future"
}

interface MonthGroup {
  month: string
  monthName: string
  weeks: WeekData[]
  monthlyGoal: MonthlyGoal | null
}

/**
 * Generate all weeks for a year grouped by month
 */
function generateYearWeeks(year: number): { weekString: string; weekNum: number; monthIndex: number; startDate: Date }[] {
  const weeks: { weekString: string; weekNum: number; monthIndex: number; startDate: Date }[] = []

  // Start from January 1
  const startDate = new Date(year, 0, 1)

  // Find the first Monday of the year or the Monday before Jan 1
  const firstDayOfYear = startDate.getDay()
  const daysToMonday = firstDayOfYear === 0 ? -6 : 1 - firstDayOfYear
  const firstMonday = new Date(year, 0, 1 + daysToMonday)

  let currentDate = new Date(firstMonday)
  let weekNum = 1

  // Generate weeks until we're in the next year
  while (currentDate.getFullYear() <= year && weekNum <= 53) {
    // Only include weeks that have days in this year
    const weekEnd = new Date(currentDate)
    weekEnd.setDate(weekEnd.getDate() + 6)

    if (currentDate.getFullYear() === year || weekEnd.getFullYear() === year) {
      const monthIndex = currentDate.getMonth()
      weeks.push({
        weekString: `${year}-W${String(weekNum).padStart(2, "0")}`,
        weekNum,
        monthIndex,
        startDate: new Date(currentDate),
      })
    }

    currentDate.setDate(currentDate.getDate() + 7)
    weekNum++

    // Stop if we've gone too far into the next year
    if (currentDate.getFullYear() > year && weekNum > 1) break
  }

  return weeks
}

/**
 * Group weeks by month
 */
function groupWeeksByMonth(
  yearWeeks: { weekString: string; weekNum: number; monthIndex: number; startDate: Date }[],
  weeklyGoals: WeeklyGoal[],
  monthlyGoals: MonthlyGoal[],
  tasks: Task[],
  habitTarget: number,
  year: number
): MonthGroup[] {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentWeekString = getWeekString(today)

  // Create a map of weeks to goals and tasks
  const weekGoalMap = new Map<string, WeeklyGoal>()
  weeklyGoals.forEach((wg) => {
    weekGoalMap.set(wg.week, wg)
  })

  const weekTaskMap = new Map<string, Task[]>()
  tasks.forEach((t) => {
    if (t.weeklyGoalId) {
      const wg = weeklyGoals.find((w) => w.id === t.weeklyGoalId)
      if (wg) {
        const existing = weekTaskMap.get(wg.week) || []
        weekTaskMap.set(wg.week, [...existing, t])
      }
    }
  })

  // Group by month
  const monthGroups = new Map<number, WeekData[]>()

  yearWeeks.forEach(({ weekString, weekNum, monthIndex, startDate }) => {
    const weeklyGoal = weekGoalMap.get(weekString) || null
    const weekTasks = weekTaskMap.get(weekString) || []
    const target = weeklyGoal?.frequency?.target || habitTarget
    const completed = weekTasks.filter((t) => t.status === "done").length

    let status: WeekData["status"] = "empty"
    if (weekString > currentWeekString) {
      status = "future"
    } else if (weeklyGoal) {
      if (completed >= target) {
        status = "complete"
      } else if (completed > 0 || weekTasks.length > 0) {
        status = "partial"
      } else {
        status = "planned"
      }
    }

    const weekData: WeekData = {
      weekString,
      weekNum,
      monthIndex,
      startDate,
      weeklyGoal,
      tasks: weekTasks,
      target,
      completed,
      status,
    }

    if (!monthGroups.has(monthIndex)) {
      monthGroups.set(monthIndex, [])
    }
    monthGroups.get(monthIndex)!.push(weekData)
  })

  // Convert to array and add monthly goal info
  const result: MonthGroup[] = []
  for (let i = 0; i < 12; i++) {
    const monthStr = `${year}-${String(i + 1).padStart(2, "0")}`
    const monthlyGoal = monthlyGoals.find((mg) => mg.month === monthStr) || null

    result.push({
      month: monthStr,
      monthName: monthNames[i],
      weeks: monthGroups.get(i) || [],
      monthlyGoal,
    })
  }

  return result
}

export function YearPlanner({ yearlyGoal, monthlyGoals, weeklyGoals, tasks }: YearPlannerProps) {
  const [bulkGenerateOpen, setBulkGenerateOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const addMonthlyGoal = useGoalsStore((s) => s.addMonthlyGoal)
  const addWeeklyGoal = useGoalsStore((s) => s.addWeeklyGoal)

  const aspectConfig = ASPECT_CONFIG[yearlyGoal.aspect]
  const habitTarget = yearlyGoal.habit?.target || 4
  const habitAction = yearlyGoal.habit?.action || "session"
  const year = yearlyGoal.year

  // Generate year structure
  const yearWeeks = useMemo(() => generateYearWeeks(year), [year])
  const monthGroups = useMemo(
    () => groupWeeksByMonth(yearWeeks, weeklyGoals, monthlyGoals, tasks, habitTarget, year),
    [yearWeeks, weeklyGoals, monthlyGoals, tasks, habitTarget, year]
  )

  // Calculate yearly stats
  const totalWeeks = yearWeeks.length
  const plannedWeeks = weeklyGoals.length
  const completedWeeks = monthGroups.flatMap((m) => m.weeks).filter((w) => w.status === "complete").length
  const totalSessions = tasks.filter((t) => t.status === "done").length
  const yearlyTarget = totalWeeks * habitTarget

  // Generate all remaining goals
  const handleBulkGenerate = async () => {
    setIsGenerating(true)
    try {
      const today = new Date()
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
      const currentWeek = getWeekString(today)

      // Generate for each month from current month onwards
      for (const monthGroup of monthGroups) {
        if (monthGroup.month < currentMonth) continue

        // Create monthly goal if doesn't exist
        let monthlyGoalId = monthGroup.monthlyGoal?.id
        if (!monthlyGoalId) {
          const monthlyTarget = habitTarget * 4 // ~4 weeks per month
          monthlyGoalId = await addMonthlyGoal({
            yearlyGoalId: yearlyGoal.id,
            aspect: yearlyGoal.aspect,
            title: `${monthlyTarget} ${habitAction} sessions`,
            successCriteria: `Complete ${monthlyTarget} ${habitAction} sessions`,
            month: monthGroup.month,
            status: "active",
            priority: 1,
          })
        }

        // Create weekly goals for each week in this month
        for (const week of monthGroup.weeks) {
          if (week.weekString < currentWeek) continue
          if (week.weeklyGoal) continue // Already has a goal

          await addWeeklyGoal({
            monthlyGoalId: monthlyGoalId,
            aspect: yearlyGoal.aspect,
            title: `${habitTarget} ${habitAction} sessions`,
            week: week.weekString,
            status: "active",
            frequency: {
              target: habitTarget,
              period: "week",
              action: habitAction,
            },
          })
        }
      }

      setBulkGenerateOpen(false)
    } finally {
      setIsGenerating(false)
    }
  }

  // Get status color
  const getStatusColor = (status: WeekData["status"]) => {
    switch (status) {
      case "complete":
        return aspectConfig.color
      case "partial":
        return `${aspectConfig.color}80` // 50% opacity
      case "planned":
        return `${aspectConfig.color}40` // 25% opacity
      case "future":
        return "var(--muted)"
      default:
        return "transparent"
    }
  }

  const getStatusBorder = (status: WeekData["status"]) => {
    switch (status) {
      case "complete":
      case "partial":
      case "planned":
        return `1px solid ${aspectConfig.color}`
      case "future":
        return "1px solid var(--border)"
      default:
        return "1px dashed var(--border)"
    }
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              {year} Year Plan
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" style={{ color: aspectConfig.color }} />
                  <span className="font-medium">{completedWeeks}</span>
                  <span className="text-muted-foreground">/ {totalWeeks} weeks</span>
                </div>
                <div className="text-muted-foreground">
                  {totalSessions} sessions done
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkGenerateOpen(true)}
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                Generate Plan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded"
                style={{ backgroundColor: aspectConfig.color }}
              />
              Complete
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded"
                style={{ backgroundColor: `${aspectConfig.color}80` }}
              />
              In Progress
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded"
                style={{ backgroundColor: `${aspectConfig.color}40` }}
              />
              Planned
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded border border-dashed border-border" />
              Not Planned
            </div>
          </div>

          {/* Year Grid */}
          <div className="space-y-2">
            {monthGroups.map((monthGroup) => (
              <div key={monthGroup.month} className="flex items-center gap-2">
                <div className="w-8 text-xs font-medium text-muted-foreground">
                  {monthGroup.monthName}
                </div>
                <div className="flex gap-1">
                  {monthGroup.weeks.map((week) => (
                    <Tooltip key={week.weekString}>
                      <TooltipTrigger asChild>
                        <button
                          className="h-5 w-5 rounded transition-all hover:scale-125 hover:ring-2 hover:ring-offset-1"
                          style={{
                            backgroundColor: getStatusColor(week.status),
                            border: getStatusBorder(week.status),
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <div className="font-medium">Week {week.weekNum}</div>
                        <div className="text-muted-foreground">
                          {week.startDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        {week.status !== "empty" && week.status !== "future" && (
                          <div className="mt-1">
                            {week.completed}/{week.target} {habitAction}s
                          </div>
                        )}
                        {week.status === "empty" && (
                          <div className="mt-1 text-amber-500">No plan yet</div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                {/* Monthly progress indicator */}
                {monthGroup.monthlyGoal && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {monthGroup.weeks.filter((w) => w.status === "complete").length}/
                    {monthGroup.weeks.length}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Yearly progress bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Yearly Progress</span>
              <span className="font-medium">
                {Math.round((totalSessions / yearlyTarget) * 100)}% of {yearlyTarget} sessions
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (totalSessions / yearlyTarget) * 100)}%`,
                  backgroundColor: aspectConfig.color,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Generate Dialog */}
      <Dialog open={bulkGenerateOpen} onOpenChange={setBulkGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Year Plan</DialogTitle>
            <DialogDescription>
              This will create monthly and weekly goals for the rest of {year}.
              Each week will have a target of {habitTarget} {habitAction} sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Monthly goals to create:</span>
              <Badge variant="secondary">
                {monthGroups.filter((m) => !m.monthlyGoal && m.month >= `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Weekly goals to create:</span>
              <Badge variant="secondary">
                {monthGroups
                  .flatMap((m) => m.weeks)
                  .filter((w) => !w.weeklyGoal && w.weekString >= getWeekString(new Date())).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Target per week:</span>
              <Badge>{habitTarget}x {habitAction}</Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkGenerate} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
