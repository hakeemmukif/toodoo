"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { HabitGoal } from "@/lib/types"
import { Repeat, Flame, Calendar } from "lucide-react"

interface HabitTrackerProps {
  habit: HabitGoal
  tasksCompletedThisPeriod: number
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function HabitTracker({ habit, tasksCompletedThisPeriod }: HabitTrackerProps) {
  const progress = Math.min((tasksCompletedThisPeriod / habit.target) * 100, 100)
  const periodLabel = habit.period === "day" ? "today" : habit.period === "week" ? "this week" : "this month"

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Repeat className="h-5 w-5 text-blue-600" />
          Habit Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frequency Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {habit.action} {periodLabel}
            </span>
            <span className="font-medium">
              {tasksCompletedThisPeriod} / {habit.target}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          {tasksCompletedThisPeriod >= habit.target && (
            <p className="text-center text-sm font-medium text-green-600">
              Target reached!
            </p>
          )}
        </div>

        {/* Streak Display */}
        <div className="flex gap-4">
          <div className="flex-1 rounded-lg border border-border p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{habit.currentStreak}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Current Streak</p>
          </div>
          <div className="flex-1 rounded-lg border border-border p-4 text-center">
            <span className="text-2xl font-bold">{habit.longestStreak}</span>
            <p className="mt-1 text-xs text-muted-foreground">Best Streak</p>
          </div>
        </div>

        {/* Suggested Days (if not flexible) */}
        {!habit.flexibleSchedule && habit.suggestedDays && habit.suggestedDays.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Suggested days</span>
            </div>
            <div className="flex gap-1">
              {DAYS.map((day, index) => {
                const isActive = habit.suggestedDays?.includes(index)
                return (
                  <div
                    key={day}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {day[0]}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Context Cue Reminder */}
        {habit.contextCue && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Your trigger:</p>
            <p className="mt-1 text-sm">
              {habit.contextCue}
              {habit.implementation && `, I will ${habit.implementation}`}
            </p>
          </div>
        )}

        {/* Never Miss Twice Reminder */}
        {habit.currentStreak === 0 && habit.longestStreak > 0 && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
            <p className="text-sm font-medium text-yellow-700">
              One skip is fine. Don&apos;t skip twice.
            </p>
            <p className="mt-1 text-xs text-yellow-600">
              Get back on track today to rebuild your streak.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
