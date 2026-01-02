"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useReviewsStore } from "@/stores/reviews"
import { useTasksStore } from "@/stores/tasks"
import { useGoalsStore } from "@/stores/goals"
import { useTrainingStore } from "@/stores/training"
import { useMealsStore } from "@/stores/meals"
import { useJournalStore } from "@/stores/journal"
import { useAppStore } from "@/stores/app"
import { StreakDisplay } from "@/components/streak-display"
import { PrincipleTooltip, PrincipleCard } from "@/components/principle-tooltip"
import { getWeeklyPrompts } from "@/services/prompts"
import { calculateStreak } from "@/services/streaks"
import type { WeeklyReview } from "@/lib/types"
import {
  ClipboardCheck,
  Calendar,
  Target,
  TrendingUp,
  Award,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
} from "lucide-react"
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { cn } from "@/lib/utils"

export default function ReviewPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [wins, setWins] = useState("")
  const [challenges, setChallenges] = useState("")
  const [insights, setInsights] = useState("")
  const [nextWeekFocus, setNextWeekFocus] = useState("")
  const [saving, setSaving] = useState(false)

  const reviews = useReviewsStore((state) => state.reviews)
  const addReview = useReviewsStore((state) => state.addReview)
  const isReviewDue = useReviewsStore((state) => state.isReviewDue)
  const tasks = useTasksStore((state) => state.tasks)
  const weeklyGoals = useGoalsStore((state) => state.weeklyGoals)
  const sessions = useTrainingStore((state) => state.sessions)
  const meals = useMealsStore((state) => state.meals)
  const entries = useJournalStore((state) => state.entries)
  const settings = useAppStore((state) => state.settings)

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
  const weekNumber = Math.ceil(
    (new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )
  const weekKey = `${new Date().getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`

  // Check if already reviewed this week
  const existingReview = reviews.find((r) => r.weekOf === weekKey)

  // Calculate week stats
  const weekTasks = tasks.filter((t) => {
    const taskDate = new Date(t.scheduledDate)
    return taskDate >= weekStart && taskDate <= weekEnd
  })
  const completedTasks = weekTasks.filter((t) => t.status === "done")
  const taskCompletionRate = weekTasks.length > 0 ? (completedTasks.length / weekTasks.length) * 100 : 0

  const weekSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.date)
    return sessionDate >= weekStart && sessionDate <= weekEnd
  })

  const weekMeals = meals.filter((m) => {
    const mealDate = new Date(m.date)
    return mealDate >= weekStart && mealDate <= weekEnd
  })
  const cookedMeals = weekMeals.filter((m) => m.cooked)

  const weekEntries = entries.filter((e) => {
    const entryDate = new Date(e.timestamp)
    return entryDate >= weekStart && entryDate <= weekEnd
  })

  // Calculate streaks
  const trainingStreak = calculateStreak(sessions.map((s) => s.date))
  const cookingStreak = calculateStreak([...new Set(cookedMeals.map((m) => m.date))])
  const journalStreak = calculateStreak(
    entries.map((e) => new Date(e.timestamp).toISOString().split("T")[0])
  )

  const weeklyPrompts = getWeeklyPrompts()

  const steps = [
    { id: "overview", title: "Week Overview", icon: Calendar },
    { id: "wins", title: "Wins & Progress", icon: Award },
    { id: "challenges", title: "Challenges", icon: TrendingUp },
    { id: "insights", title: "Insights", icon: MessageSquare },
    { id: "next-week", title: "Next Week", icon: Target },
    { id: "complete", title: "Complete", icon: CheckCircle2 },
  ]

  const handleSave = async () => {
    setSaving(true)
    await addReview({
      weekOf: weekKey,
      completedAt: new Date(),
      wins: wins.split("\n").filter((w) => w.trim()),
      struggles: challenges.split("\n").filter((c) => c.trim()),
      resistancePatterns: [],
      stopDoingItems: [],
      nextWeekFocus,
      selfRating: 7,
      effortHonesty: insights,
      deepWorkHours: 0,
      shallowWorkHours: 0,
      nextWeekIntentions: nextWeekFocus.split("\n").filter((i) => i.trim()),
    })
    setSaving(false)
    setCurrentStep(5) // Go to complete step
  }

  if (existingReview) {
    return (
      <AppLayout>
        <div className="container max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Weekly Review</h1>
            <p className="text-muted-foreground">
              Week {weekKey} - Already completed
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Review Complete
              </CardTitle>
              <CardDescription>
                Completed on {format(new Date(existingReview.completedAt), "PPP")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Wins</Label>
                <p className="mt-1">{existingReview.wins.length > 0 ? existingReview.wins.join(", ") : "No wins recorded"}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Struggles</Label>
                <p className="mt-1">{existingReview.struggles.length > 0 ? existingReview.struggles.join(", ") : "No struggles recorded"}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Effort Honesty</Label>
                <p className="mt-1">{existingReview.effortHonesty || "No insights recorded"}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Next Week Focus</Label>
                <p className="mt-1">{existingReview.nextWeekFocus || "No focus set"}</p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-muted-foreground">
              Come back next week for your next review.
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly Review</h1>
          <p className="text-muted-foreground">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isComplete = index < currentStep

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    isActive && "bg-foreground text-background",
                    isComplete && "bg-green-500/20 text-green-600",
                    !isActive && !isComplete && "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground/50" />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Week Overview</CardTitle>
              <CardDescription>
                Let's look at what you accomplished this week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-border/60 p-4 text-center">
                  <p className="text-3xl font-serif">{completedTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </div>
                <div className="rounded-lg border border-border/60 p-4 text-center">
                  <p className="text-3xl font-serif">{weekSessions.length}</p>
                  <p className="text-xs text-muted-foreground">Workouts</p>
                </div>
                <div className="rounded-lg border border-border/60 p-4 text-center">
                  <p className="text-3xl font-serif">{cookedMeals.length}</p>
                  <p className="text-xs text-muted-foreground">Meals Cooked</p>
                </div>
                <div className="rounded-lg border border-border/60 p-4 text-center">
                  <p className="text-3xl font-serif">{weekEntries.length}</p>
                  <p className="text-xs text-muted-foreground">Journal Entries</p>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Task Completion Rate</span>
                  <span>{Math.round(taskCompletionRate)}%</span>
                </div>
                <Progress value={taskCompletionRate} />
              </div>

              {/* Streaks */}
              <div>
                <h4 className="mb-3 text-sm font-medium">Current Streaks</h4>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <StreakDisplay
                      streak={{ type: "training", ...trainingStreak }}
                      coachTone={settings?.coachTone || "balanced"}
                      size="md"
                    />
                    <span className="text-xs text-muted-foreground">Training</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <StreakDisplay
                      streak={{ type: "cooking", ...cookingStreak }}
                      coachTone={settings?.coachTone || "balanced"}
                      size="md"
                    />
                    <span className="text-xs text-muted-foreground">Cooking</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <StreakDisplay
                      streak={{ type: "journal", ...journalStreak }}
                      coachTone={settings?.coachTone || "balanced"}
                      size="md"
                    />
                    <span className="text-xs text-muted-foreground">Journal</span>
                  </div>
                </div>
              </div>

              <Button onClick={() => setCurrentStep(1)} className="w-full">
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Wins & Progress</CardTitle>
              <CardDescription>
                What went well this week? What are you proud of?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PrincipleCard principle="progress-not-perfection" />
              <Textarea
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="List your wins, big or small..."
                rows={6}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(2)} className="flex-1">
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Challenges</CardTitle>
              <CardDescription>
                What was difficult? What got in your way?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PrincipleCard principle="resistance-is-compass" />
              <Textarea
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="What challenges did you face?"
                rows={6}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(3)} className="flex-1">
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Insights</CardTitle>
              <CardDescription>
                What did you learn? What patterns do you notice?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm italic text-muted-foreground">
                  {weeklyPrompts[0]?.prompt || "What patterns emerged this week?"}
                </p>
              </div>
              <Textarea
                value={insights}
                onChange={(e) => setInsights(e.target.value)}
                placeholder="Share your insights and learnings..."
                rows={6}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(4)} className="flex-1">
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Next Week</CardTitle>
              <CardDescription>
                What's your main focus for the coming week?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PrincipleCard principle="one-thing" />
              <Textarea
                value={nextWeekFocus}
                onChange={(e) => setNextWeekFocus(e.target.value)}
                placeholder="What ONE thing will you focus on?"
                rows={6}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Complete Review"}
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Review Complete
              </CardTitle>
              <CardDescription>
                Great job reflecting on your week!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-green-500/10 p-4 text-center">
                <p className="text-green-600">
                  Your weekly review has been saved. You're building great reflection habits!
                </p>
              </div>
              <PrincipleTooltip principle="never-skip-twice">
                <p className="text-sm text-muted-foreground">
                  Weekly reviews help you stay aligned with your goals. Keep the streak going!
                </p>
              </PrincipleTooltip>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
