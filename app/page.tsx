"use client"

import { AppLayout } from "@/components/app-layout"
import { TaskItem } from "@/components/task-item"
import { ProgressRing } from "@/components/progress-ring"
import { SentimentDot } from "@/components/sentiment-dot"
import { OllamaStatusIndicator } from "@/components/inbox/ollama-status"
import { BehavioralNudges, IdentityCard } from "@/components/behavioral-nudges"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useTasksStore } from "@/stores/tasks"
import { useGoalsStore } from "@/stores/goals"
import { useJournalStore } from "@/stores/journal"
import { useTrainingStore } from "@/stores/training"
import { useMealsStore } from "@/stores/meals"
import type { LifeAspect, TimePreference } from "@/lib/types"
import { Flame } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { calculateAspectProgress } from "@/services/progress"
import { getSentimentLabel } from "@/services/analysis"

export default function DashboardPage() {
  const [aspectProgress, setAspectProgress] = useState<
    { aspect: LifeAspect; progress: number }[]
  >([])

  const tasks = useTasksStore((state) => state.tasks)
  const yearlyGoals = useGoalsStore((state) => state.yearlyGoals)
  const journalEntries = useJournalStore((state) => state.entries)
  const trainingSessions = useTrainingStore((state) => state.sessions)
  const meals = useMealsStore((state) => state.meals)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  // Use local timezone for "today" to match how formatDate stores dates
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  // Filter today's pending tasks (memoized for performance with large task lists)
  const todayTasks = useMemo(
    () => tasks.filter((task) => task.scheduledDate === today && task.status === "pending"),
    [tasks, today]
  )

  // Group tasks by time preference (memoized)
  const tasksByTime = useMemo(() => ({
    morning: todayTasks.filter((t) => t.timePreference === "morning"),
    afternoon: todayTasks.filter((t) => t.timePreference === "afternoon"),
    evening: todayTasks.filter((t) => t.timePreference === "evening"),
    anytime: todayTasks.filter((t) => t.timePreference === "anytime"),
  } as Record<TimePreference, typeof todayTasks>), [todayTasks])

  // Calculate aspect progress
  useEffect(() => {
    async function loadProgress() {
      const progress = await Promise.all(
        Object.keys(ASPECT_CONFIG).map(async (aspect) => ({
          aspect: aspect as LifeAspect,
          progress: await calculateAspectProgress(aspect as LifeAspect),
        }))
      )
      setAspectProgress(progress)
    }
    loadProgress()
  }, [yearlyGoals])

  // Calculate streaks - use local timezone to match stored dates
  const formatLocalDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

  const calculateStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0
    const uniqueDates = [...new Set(dates)].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )

    let streak = 0
    const todayDate = new Date()

    for (let i = 0; i < Math.min(uniqueDates.length, 365); i++) {
      const expectedDate = new Date(todayDate)
      expectedDate.setDate(todayDate.getDate() - streak)
      const expectedStr = formatLocalDate(expectedDate)
      const prevExpectedDate = new Date(todayDate)
      prevExpectedDate.setDate(todayDate.getDate() - streak - 1)
      const prevExpectedStr = formatLocalDate(prevExpectedDate)

      if (uniqueDates[i] === expectedStr || (streak === 0 && uniqueDates[i] === prevExpectedStr)) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const trainingStreak = calculateStreak(trainingSessions.map((s) => s.date))
  const cookedMeals = meals.filter((m) => m.cooked)
  const cookingStreak = calculateStreak([...new Set(cookedMeals.map((m) => m.date))])
  const journalStreak = calculateStreak(
    journalEntries.map((e) => formatLocalDate(new Date(e.timestamp)))
  )

  // Most recent journal entry
  const recentJournal = journalEntries[0]

  return (
    <AppLayout>
      <div className="container max-w-6xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{greeting}</h1>
            <p className="text-muted-foreground">{dateStr}</p>
          </div>
          <OllamaStatusIndicator variant="indicator" showReconnect={false} />
        </div>

        {/* Identity & Behavioral Nudges */}
        <div className="grid gap-4 md:grid-cols-2">
          <IdentityCard />
          <BehavioralNudges maxNudges={2} />
        </div>

        {/* Today's Tasks */}
        <Card className="animate-stagger animate-fade-in-up">
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(["morning", "afternoon", "evening", "anytime"] as TimePreference[]).map((time) => {
              const timeTasks = tasksByTime[time]
              if (timeTasks.length === 0) return null
              return (
                <div key={time}>
                  <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">{time}</h3>
                  <div className="space-y-3">
                    {timeTasks.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )
            })}
            {todayTasks.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">No tasks scheduled for today</p>
            )}
          </CardContent>
        </Card>

        {/* Goal Progress */}
        <Card className="animate-stagger animate-fade-in-up animation-delay-100">
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {aspectProgress.map((item, index) => {
                const config = ASPECT_CONFIG[item.aspect]
                const Icon = config.icon
                return (
                  <div
                    key={item.aspect}
                    className="flex min-w-[120px] flex-col items-center gap-3 rounded-lg border border-border p-4 transition-all duration-200 hover:border-border/80 hover:shadow-sm hover:-translate-y-0.5"
                    style={{ animationDelay: `${150 + index * 50}ms` }}
                  >
                    <ProgressRing
                      progress={item.progress}
                      color={config.color}
                      label={`${config.label} progress`}
                    />
                    <div className="flex flex-col items-center gap-1">
                      <Icon className="h-4 w-4" style={{ color: config.color }} aria-hidden="true" />
                      <span className="text-xs font-medium text-center">{config.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Journal */}
        {recentJournal && (
          <Card className="animate-stagger animate-fade-in-up animation-delay-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Journal</span>
                <SentimentDot sentiment={getSentimentLabel(recentJournal.sentimentScore)} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {recentJournal.content}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(recentJournal.timestamp).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <Card className="animate-stagger animate-fade-in-up animation-delay-300">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 transition-all duration-200 hover:border-orange-500/30 hover:shadow-sm">
                <Flame className="h-6 w-6 text-orange-500" aria-hidden="true" />
                <div className="text-center">
                  <div className="text-2xl font-bold">{trainingStreak}</div>
                  <div className="text-xs text-muted-foreground">Training Days</div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 transition-all duration-200 hover:border-green-500/30 hover:shadow-sm">
                <Flame className="h-6 w-6 text-green-500" aria-hidden="true" />
                <div className="text-center">
                  <div className="text-2xl font-bold">{cookingStreak}</div>
                  <div className="text-xs text-muted-foreground">Cooking Streak</div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 transition-all duration-200 hover:border-blue-500/30 hover:shadow-sm">
                <Flame className="h-6 w-6 text-blue-500" aria-hidden="true" />
                <div className="text-center">
                  <div className="text-2xl font-bold">{journalStreak}</div>
                  <div className="text-xs text-muted-foreground">Journal Streak</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
