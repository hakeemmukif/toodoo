"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { AspectBadge } from "@/components/aspect-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useGoalsStore } from "@/stores/goals"
import { useTasksStore } from "@/stores/tasks"
import { useJournalStore } from "@/stores/journal"
import { useTrainingStore } from "@/stores/training"
import { useMealsStore } from "@/stores/meals"
import { useAppStore } from "@/stores/app"
import { calculateAspectProgress } from "@/services/progress"
import { checkOllamaConnection, queryOllama } from "@/services/ollama"
import type { LifeAspect } from "@/lib/types"
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, Sparkles, Dumbbell, Utensils, BookOpen } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface AspectMetric {
  aspect: LifeAspect
  goalProgress: number
  taskCompletion: number
  sentimentScore: number
  entryCount: number
  pendingTasks: number
  completedTasks: number
}

export default function AnalysisPage() {
  const [selectedAspect, setSelectedAspect] = useState<LifeAspect | "all">("all")
  const [analyzing, setAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [ollamaAvailable, setOllamaAvailable] = useState(false)
  const [aspectMetrics, setAspectMetrics] = useState<AspectMetric[]>([])

  const yearlyGoals = useGoalsStore((state) => state.yearlyGoals)
  const tasks = useTasksStore((state) => state.tasks)
  const journalEntries = useJournalStore((state) => state.entries)
  const trainingSessions = useTrainingStore((state) => state.sessions)
  const meals = useMealsStore((state) => state.meals)
  const settings = useAppStore((state) => state.settings)

  // Check Ollama availability
  useEffect(() => {
    const checkOllama = async () => {
      const available = await checkOllamaConnection()
      setOllamaAvailable(available)
    }
    if (settings) {
      checkOllama()
    }
  }, [settings])

  // Calculate metrics for each aspect
  useEffect(() => {
    const calculateMetrics = async () => {
      const aspects = selectedAspect === "all"
        ? (Object.keys(ASPECT_CONFIG) as LifeAspect[])
        : [selectedAspect]

      const metrics = await Promise.all(
        aspects.map(async (aspect) => {
          const aspectTasks = tasks.filter((t) => t.aspect === aspect)
          const aspectEntries = journalEntries.filter((e) =>
            e.detectedAspects.includes(aspect)
          )

          const goalProgress = await calculateAspectProgress(aspect)

          const completedTasks = aspectTasks.filter((t) => t.status === "done").length
          const taskCompletion = aspectTasks.length > 0
            ? (completedTasks / aspectTasks.length) * 100
            : 0

          const positiveSentiment = aspectEntries.length > 0
            ? (aspectEntries.filter((e) => e.sentimentScore > 0.2).length / aspectEntries.length) * 100
            : 0

          return {
            aspect,
            goalProgress: Math.round(goalProgress),
            taskCompletion: Math.round(taskCompletion),
            sentimentScore: Math.round(positiveSentiment),
            entryCount: aspectEntries.length,
            pendingTasks: aspectTasks.filter((t) => t.status === "pending").length,
            completedTasks,
          }
        })
      )

      setAspectMetrics(metrics)
    }

    calculateMetrics()
  }, [selectedAspect, tasks, journalEntries, yearlyGoals])

  // Drift alerts - goals with low progress
  const driftAlerts = yearlyGoals
    .filter((g) => g.status === "active")
    .filter((g) => {
      const metric = aspectMetrics.find((m) => m.aspect === g.aspect)
      return metric && metric.goalProgress < 15
    })
    .map((g) => ({
      goal: g,
      message: `Goal "${g.title}" may need more attention`,
    }))

  // Weekly activity data for chart
  const getWeeklyData = () => {
    const weeks: { week: string; tasks: number; training: number; meals: number }[] = []
    const now = new Date()

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (i * 7 + now.getDay()))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const weekLabel = `W${4 - i}`

      const weekTasks = tasks.filter((t) => {
        const taskDate = new Date(t.scheduledDate)
        return taskDate >= weekStart && taskDate <= weekEnd && t.status === "done"
      }).length

      const weekTraining = trainingSessions.filter((s) => {
        const sessionDate = new Date(s.date)
        return sessionDate >= weekStart && sessionDate <= weekEnd
      }).length

      const weekMeals = meals.filter((m) => {
        const mealDate = new Date(m.date)
        return mealDate >= weekStart && mealDate <= weekEnd && m.cooked
      }).length

      weeks.push({ week: weekLabel, tasks: weekTasks, training: weekTraining, meals: weekMeals })
    }

    return weeks
  }

  const weeklyData = getWeeklyData()

  // Overall stats
  const totalTasks = tasks.length
  const completedTasksTotal = tasks.filter((t) => t.status === "done").length
  const overallCompletion = totalTasks > 0 ? Math.round((completedTasksTotal / totalTasks) * 100) : 0

  const totalTraining = trainingSessions.length
  const totalTrainingMinutes = trainingSessions.reduce((sum, s) => sum + s.duration, 0)
  const avgTrainingIntensity = totalTraining > 0
    ? trainingSessions.reduce((sum, s) => sum + s.intensity, 0) / totalTraining
    : 0

  const cookedMeals = meals.filter((m) => m.cooked).length
  const cookingRatio = meals.length > 0 ? Math.round((cookedMeals / meals.length) * 100) : 0

  const avgSentiment = journalEntries.length > 0
    ? journalEntries.reduce((sum, e) => sum + e.sentimentScore, 0) / journalEntries.length
    : 0

  const handleAiAnalysis = async () => {
    setAnalyzing(true)
    setAiAnalysis(null)

    const prompt = `Analyze my life tracking data and provide insights:

Overall Stats:
- Task completion rate: ${overallCompletion}%
- Total training sessions: ${totalTraining} (${totalTrainingMinutes} minutes)
- Average training intensity: ${avgTrainingIntensity.toFixed(1)}/10
- Cooking ratio: ${cookingRatio}%
- Journal entries: ${journalEntries.length}
- Average sentiment: ${avgSentiment.toFixed(2)} (-1 to 1 scale)

Aspect Breakdown:
${aspectMetrics.map((m) => `- ${m.aspect}: ${m.goalProgress}% goal progress, ${m.taskCompletion}% task completion, ${m.entryCount} reflections`).join("\n")}

${driftAlerts.length > 0 ? `\nAreas needing attention:\n${driftAlerts.map((a) => `- ${a.message}`).join("\n")}` : ""}

Please provide:
1. Key strengths I'm showing
2. Areas that need more focus
3. Specific actionable recommendations
4. Patterns you notice in my data`

    try {
      const analysis = await queryOllama(prompt, settings?.ollamaModel || "mistral")
      setAiAnalysis(analysis)
    } catch {
      setAiAnalysis("Unable to connect to Ollama. Please check your settings.")
    }

    setAnalyzing(false)
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis</h1>
          <p className="text-muted-foreground">Insights and patterns across your life aspects</p>
        </div>

        {/* Overall Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{overallCompletion}%</div>
                  <div className="text-xs text-muted-foreground">Task Completion</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
                  <Dumbbell className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalTraining}</div>
                  <div className="text-xs text-muted-foreground">Training Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                  <Utensils className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{cookingRatio}%</div>
                  <div className="text-xs text-muted-foreground">Home Cooked</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{journalEntries.length}</div>
                  <div className="text-xs text-muted-foreground">Journal Entries</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="tasks" fill="#3b82f6" name="Completed Tasks" />
                <Bar dataKey="training" fill="#f97316" name="Training" />
                <Bar dataKey="meals" fill="#22c55e" name="Home Cooked" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Aspect Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedAspect === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedAspect("all")}
          >
            All
          </Button>
          {Object.entries(ASPECT_CONFIG).map(([aspect, config]) => {
            const Icon = config.icon
            return (
              <Button
                key={aspect}
                variant={selectedAspect === aspect ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAspect(aspect as LifeAspect)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {config.label}
              </Button>
            )
          })}
        </div>

        {/* Drift Alerts */}
        {driftAlerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Attention Needed
            </h2>
            {driftAlerts.map((alert) => (
              <Alert key={alert.goal.id} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  <AspectBadge aspect={alert.goal.aspect} />
                </AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Summary Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Aspect Analysis</h2>
          {aspectMetrics.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No data available yet. Start tracking your activities to see insights.
              </CardContent>
            </Card>
          ) : (
            aspectMetrics.map((metric) => (
              <Card key={metric.aspect}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AspectBadge aspect={metric.aspect} showIcon />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Goal Progress</span>
                        <span className="font-semibold">{metric.goalProgress}%</span>
                      </div>
                      <Progress value={metric.goalProgress} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Task Completion</span>
                        <span className="font-semibold">{metric.taskCompletion}%</span>
                      </div>
                      <Progress value={metric.taskCompletion} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Positive Sentiment</span>
                        <span className="font-semibold">{metric.sentimentScore}%</span>
                      </div>
                      <Progress value={metric.sentimentScore} className="h-2" />
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{metric.pendingTasks} pending tasks</span>
                    <span>{metric.completedTasks} completed</span>
                    <span>{metric.entryCount} journal entries</span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Insights</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {metric.taskCompletion > 70 && (
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Strong task completion rate
                        </li>
                      )}
                      {metric.taskCompletion < 40 && metric.pendingTasks > 0 && (
                        <li className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          Task completion needs improvement
                        </li>
                      )}
                      {metric.sentimentScore > 60 && (
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Positive momentum in reflections
                        </li>
                      )}
                      {metric.entryCount === 0 && (
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          Consider journaling about this area
                        </li>
                      )}
                      {metric.goalProgress > 50 && (
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          On track with goals
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* AI Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Deep Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {ollamaAvailable
                ? "Get AI-powered insights about your patterns, strengths, and areas for improvement."
                : "Connect to Ollama to get AI-powered insights. Configure the Ollama server URL in Settings."}
            </p>
            <Button onClick={handleAiAnalysis} disabled={analyzing || !ollamaAvailable}>
              {analyzing ? "Analyzing..." : "Run AI Analysis"}
            </Button>
            {aiAnalysis && (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  AI Insights
                </h4>
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">{aiAnalysis}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
