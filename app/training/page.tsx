"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTrainingStore } from "@/stores/training"
import { formatDate } from "@/db"
import type { TrainingType, YearlyGoal } from "@/lib/types"
import { Dumbbell, Flame, Clock, TrendingUp, CalendarIcon, Trash2, Target } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

const trainingTypes: { value: TrainingType; label: string }[] = [
  { value: "muay-thai", label: "Muay Thai" },
  { value: "dj-practice", label: "DJ Practice" },
  { value: "cardio", label: "Cardio" },
  { value: "strength", label: "Strength" },
  { value: "flexibility", label: "Flexibility" },
  { value: "other", label: "Other" },
]

export default function TrainingPage() {
  const [type, setType] = useState<TrainingType>("muay-thai")
  const [duration, setDuration] = useState("90")
  const [intensity, setIntensity] = useState([7])
  const [notes, setNotes] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string>("")
  const [suggestedGoals, setSuggestedGoals] = useState<YearlyGoal[]>([])

  const sessions = useTrainingStore((state) => state.sessions)
  const addSession = useTrainingStore((state) => state.addSession)
  const deleteSession = useTrainingStore((state) => state.deleteSession)
  const calculateStreak = useTrainingStore((state) => state.calculateStreak)
  const getSessionsForWeek = useTrainingStore((state) => state.getSessionsForWeek)
  const getSuggestedGoalsForSession = useTrainingStore((state) => state.getSuggestedGoalsForSession)

  // Load suggested goals when training type changes
  useEffect(() => {
    getSuggestedGoalsForSession(type).then(setSuggestedGoals)
  }, [type, getSuggestedGoalsForSession])

  const { toast } = useToast()

  // Get this week's sessions
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekSessions = getSessionsForWeek(weekStart)

  // Calculate stats
  const totalSessions = weekSessions.length
  const totalMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0)
  const avgIntensity = weekSessions.length
    ? weekSessions.reduce((sum, s) => sum + s.intensity, 0) / weekSessions.length
    : 0

  // Training streak
  const streak = calculateStreak()

  // Intensity distribution
  const intensityData = [
    { range: "1-3", count: sessions.filter((s) => s.intensity <= 3).length },
    { range: "4-6", count: sessions.filter((s) => s.intensity >= 4 && s.intensity <= 6).length },
    { range: "7-8", count: sessions.filter((s) => s.intensity >= 7 && s.intensity <= 8).length },
    { range: "9-10", count: sessions.filter((s) => s.intensity >= 9).length },
  ]

  const handleSaveSession = async () => {
    if (!duration || parseInt(duration) <= 0) return

    await addSession({
      type,
      date: formatDate(selectedDate),
      duration: parseInt(duration),
      intensity: intensity[0],
      notes: notes || undefined,
      linkedGoalId: selectedGoalId || undefined,
    })

    // Reset form
    setDuration("90")
    setIntensity([7])
    setNotes("")
    setSelectedDate(new Date())
    setSelectedGoalId("")

    const goalName = suggestedGoals.find((g) => g.id === selectedGoalId)?.title
    toast({
      title: "Session logged",
      description: goalName
        ? `Linked to goal: ${goalName}`
        : "Your training session has been saved.",
    })
  }

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id)
    toast({
      title: "Session deleted",
      description: "The training session has been removed.",
    })
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training</h1>
          <p className="text-muted-foreground">Track your workouts and build consistency</p>
        </div>

        {/* Log Session Card */}
        <Card>
          <CardHeader>
            <CardTitle>Log Training Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Training Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as TrainingType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date)
                          setDatePickerOpen(false)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="90"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Intensity</Label>
                <span className="text-sm font-medium">{intensity[0]} / 10</span>
              </div>
              <Slider value={intensity} onValueChange={setIntensity} min={1} max={10} step={1} />
            </div>
            {suggestedGoals.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Link to Goal (optional)
                </Label>
                <Select value={selectedGoalId || "none"} onValueChange={(v) => setSelectedGoalId(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a goal to track progress" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No goal</SelectItem>
                    {suggestedGoals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did the session go?"
                rows={3}
              />
            </div>
            <Button className="w-full" onClick={handleSaveSession} disabled={!duration || parseInt(duration) <= 0}>
              Save Session
            </Button>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
                const date = new Date(weekStart)
                date.setDate(weekStart.getDate() + index)
                const dateStr = formatDate(date)
                const hasSession = weekSessions.some((s) => s.date === dateStr)
                const isToday = dateStr === formatDate(today)

                return (
                  <div
                    key={index}
                    className={`flex h-12 w-12 flex-col items-center justify-center rounded-lg border-2 ${
                      hasSession ? "border-orange-500 bg-orange-500/20" : isToday ? "border-primary" : "border-muted"
                    }`}
                  >
                    <div className="text-xs font-medium">{day}</div>
                    <div className="text-xs text-muted-foreground">{date.getDate()}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <Dumbbell className="h-8 w-8 text-orange-500" />
              <div className="text-center">
                <div className="text-2xl font-bold">{totalSessions}</div>
                <div className="text-xs text-muted-foreground">This Week</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="text-center">
                <div className="text-2xl font-bold">{totalMinutes}</div>
                <div className="text-xs text-muted-foreground">Total Minutes</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <Flame className="h-8 w-8 text-red-500" />
              <div className="text-center">
                <div className="text-2xl font-bold">{streak}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="text-center">
                <div className="text-2xl font-bold">{avgIntensity.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Avg Intensity</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Intensity Distribution */}
        {sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Intensity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={intensityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {sessions.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No training sessions"
            description="Log your first workout to start tracking your progress"
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.slice(0, 10).map((session) => {
                const typeLabel = trainingTypes.find((t) => t.value === session.type)?.label
                const date = new Date(session.date)
                const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

                return (
                  <div key={session.id} className="group flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
                        <Dumbbell className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="font-medium">{typeLabel}</div>
                        <div className="text-sm text-muted-foreground">
                          {session.duration}m - {dateStr}
                          {session.notes && <span className="ml-2 text-xs">({session.notes.slice(0, 30)}...)</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-orange-500" style={{ width: `${(session.intensity / 10) * 100}%` }} />
                        </div>
                        <span className="text-sm font-medium">{session.intensity}/10</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
