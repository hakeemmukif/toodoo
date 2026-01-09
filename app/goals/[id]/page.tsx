"use client"

import { useState, useEffect, use, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AspectBadge } from "@/components/aspect-badge"
import { TaskItem } from "@/components/task-item"
import { EmptyState } from "@/components/empty-state"
import { WOOPSummary } from "@/components/goals/woop-summary"
import { HabitTracker } from "@/components/goals/habit-tracker"
import { WeekPlan } from "@/components/goals/week-plan"
import { YearPlanner } from "@/components/goals/year-planner"
import { MasteryTracker } from "@/components/goals/mastery-tracker"
import { ProjectTracker } from "@/components/goals/project-tracker"
import { OutcomeTracker } from "@/components/goals/outcome-tracker"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useGoalsStore } from "@/stores/goals"
import { useTasksStore } from "@/stores/tasks"
import { ASPECT_CONFIG } from "@/lib/constants"
import { calculateYearlyProgress, calculateMonthlyProgress, calculateWeeklyProgress } from "@/services/progress"
import { getWeekString } from "@/services/goal-linking"
import type { YearlyGoal, MonthlyGoal, WeeklyGoal, Task, GoalType, TimePreference } from "@/lib/types"
import {
  ArrowLeft,
  Edit,
  Repeat,
  TrendingUp,
  Package,
  Target,
  ListTodo,
  Plus,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  GitBranch,
} from "lucide-react"

const GOAL_TYPE_CONFIG: Record<GoalType, { icon: typeof Repeat; label: string; color: string }> = {
  habit: { icon: Repeat, label: "Habit", color: "bg-blue-500" },
  mastery: { icon: TrendingUp, label: "Mastery", color: "bg-emerald-500" },
  project: { icon: Package, label: "Project", color: "bg-violet-500" },
  outcome: { icon: Target, label: "Outcome", color: "bg-rose-500" },
}

interface MonthlyGoalWithProgress extends MonthlyGoal {
  progress: number
  weeklyGoals: WeeklyGoalWithProgress[]
}

interface WeeklyGoalWithProgress extends WeeklyGoal {
  progress: number
}

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [goal, setGoal] = useState<YearlyGoal | null>(null)
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([])
  const [progress, setProgress] = useState(0)
  const [tasksCompletedThisPeriod, setTasksCompletedThisPeriod] = useState(0)
  const [hierarchy, setHierarchy] = useState<MonthlyGoalWithProgress[]>([])
  const [currentWeekGoal, setCurrentWeekGoal] = useState<WeeklyGoal | null>(null)
  const [currentWeekTasks, setCurrentWeekTasks] = useState<Task[]>([])

  // Dialog state
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formTimePreference, setFormTimePreference] = useState<TimePreference>("morning")
  const [formTime, setFormTime] = useState<string>("") // Specific time (optional)
  const [formDuration, setFormDuration] = useState("30")
  const [formWeeklyGoalId, setFormWeeklyGoalId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Collapsible states
  const [pendingOpen, setPendingOpen] = useState(true)
  const [completedOpen, setCompletedOpen] = useState(false)
  const [skippedOpen, setSkippedOpen] = useState(false)
  const [hierarchyOpen, setHierarchyOpen] = useState(true)

  const yearlyGoals = useGoalsStore((s) => s.yearlyGoals)
  const monthlyGoals = useGoalsStore((s) => s.monthlyGoals)
  const weeklyGoals = useGoalsStore((s) => s.weeklyGoals)
  const updateYearlyGoal = useGoalsStore((s) => s.updateYearlyGoal)
  const updateMasteryLevel = useGoalsStore((s) => s.updateMasteryLevel)
  const updateMilestoneStatus = useGoalsStore((s) => s.updateMilestoneStatus)
  const updateOutcomeValue = useGoalsStore((s) => s.updateOutcomeValue)

  const tasks = useTasksStore((s) => s.tasks)
  const addTask = useTasksStore((s) => s.addTask)

  // Group tasks by status
  const { pendingTasks, completedTasks, skippedTasks } = useMemo(() => {
    const pending = linkedTasks.filter((t) => t.status === "pending")
    const completed = linkedTasks.filter((t) => t.status === "done")
    const skipped = linkedTasks.filter((t) => t.status === "skipped" || t.status === "deferred")
    return { pendingTasks: pending, completedTasks: completed, skippedTasks: skipped }
  }, [linkedTasks])

  // Get all weekly goals for the dropdown
  const availableWeeklyGoals = useMemo(() => {
    if (!goal) return []
    // Get monthly goals for this yearly goal
    const relatedMonthly = monthlyGoals.filter((mg) => mg.yearlyGoalId === goal.id)
    const monthlyIds = relatedMonthly.map((m) => m.id)
    // Get weekly goals for those monthly goals
    return weeklyGoals.filter((wg) => wg.monthlyGoalId && monthlyIds.includes(wg.monthlyGoalId))
  }, [goal, monthlyGoals, weeklyGoals])

  // Load goal data
  useEffect(() => {
    const foundGoal = yearlyGoals.find((g) => g.id === id)
    if (foundGoal) {
      setGoal(foundGoal)

      // Calculate progress
      calculateYearlyProgress(foundGoal.id).then(setProgress)

      // Build hierarchy: monthly goals with their weekly goals
      const relatedMonthly = monthlyGoals.filter((mg) => mg.yearlyGoalId === foundGoal.id && mg.status === "active")

      Promise.all(
        relatedMonthly.map(async (mg) => {
          const mgProgress = await calculateMonthlyProgress(mg.id)
          const relatedWeekly = weeklyGoals.filter((wg) => wg.monthlyGoalId === mg.id && wg.status === "active")

          const weeklyWithProgress = await Promise.all(
            relatedWeekly.map(async (wg) => ({
              ...wg,
              progress: await calculateWeeklyProgress(wg.id),
            }))
          )

          return {
            ...mg,
            progress: mgProgress,
            weeklyGoals: weeklyWithProgress,
          }
        })
      ).then(setHierarchy)

      // Get linked weekly goals
      const monthlyIdList = monthlyGoals
        .filter((mg) => mg.yearlyGoalId === foundGoal.id)
        .map((mg) => mg.id)

      const linkedWeeklyGoals = weeklyGoals.filter(
        (wg) => wg.monthlyGoalId && monthlyIdList.includes(wg.monthlyGoalId)
      )
      const linkedWeeklyIds = linkedWeeklyGoals.map((wg) => wg.id)

      // Find current week's weekly goal
      const currentWeek = getWeekString(new Date())
      const thisWeekGoal = linkedWeeklyGoals.find(
        (wg) => wg.week === currentWeek && wg.status === "active"
      )
      setCurrentWeekGoal(thisWeekGoal || null)

      // Get tasks for current week's goal
      if (thisWeekGoal) {
        const weekTasks = tasks.filter((t) => t.weeklyGoalId === thisWeekGoal.id)
        setCurrentWeekTasks(weekTasks)
      } else {
        setCurrentWeekTasks([])
      }

      // Get ALL tasks linked to those weekly goals or with matching aspect (no cap!)
      const relatedTasks = tasks.filter(
        (t) =>
          (t.weeklyGoalId && linkedWeeklyIds.includes(t.weeklyGoalId)) ||
          (t.aspect === foundGoal.aspect && !t.weeklyGoalId)
      )
      setLinkedTasks(relatedTasks) // Show ALL tasks

      // Count completed tasks this period (for habit tracking)
      if (foundGoal.habit) {
        const now = new Date()
        const periodStart = new Date()

        switch (foundGoal.habit.period) {
          case "day":
            periodStart.setHours(0, 0, 0, 0)
            break
          case "week":
            periodStart.setDate(now.getDate() - now.getDay())
            periodStart.setHours(0, 0, 0, 0)
            break
          case "month":
            periodStart.setDate(1)
            periodStart.setHours(0, 0, 0, 0)
            break
        }

        const completedThisPeriod = relatedTasks.filter(
          (t) =>
            t.status === "done" &&
            t.completedAt &&
            new Date(t.completedAt) >= periodStart
        ).length

        setTasksCompletedThisPeriod(completedThisPeriod)
      }
    }
  }, [id, yearlyGoals, monthlyGoals, weeklyGoals, tasks])

  const handleAddTask = async () => {
    if (!formTitle.trim() || !goal) return

    setIsSubmitting(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      await addTask({
        title: formTitle.trim(),
        aspect: goal.aspect,
        status: "pending",
        scheduledDate: today,
        timePreference: formTimePreference,
        hardScheduledTime: formTime || undefined,
        durationEstimate: parseInt(formDuration) || 30,
        deferCount: 0,
        weeklyGoalId: formWeeklyGoalId || undefined,
      })

      // Reset form
      setFormTitle("")
      setFormTimePreference("morning")
      setFormTime("")
      setFormDuration("30")
      setFormWeeklyGoalId("")
      setAddTaskOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!goal) {
    return (
      <AppLayout>
        <div className="container max-w-4xl p-4">
          <p className="text-center text-muted-foreground">Goal not found</p>
        </div>
      </AppLayout>
    )
  }

  const aspectConfig = ASPECT_CONFIG[goal.aspect]
  const goalType = goal.goalType || "project"
  const typeConfig = GOAL_TYPE_CONFIG[goalType]
  const TypeIcon = typeConfig.icon

  const handleMilestoneStatusChange = async (milestoneId: string, status: "pending" | "in_progress" | "completed") => {
    await updateMilestoneStatus(goal.id, milestoneId, status)
  }

  const handleLevelUp = async (levelId: string) => {
    await updateMasteryLevel(goal.id, levelId, true)
  }

  const handleUpdateOutcomeValue = async (newValue: number) => {
    await updateOutcomeValue(goal.id, newValue)
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <AspectBadge aspect={goal.aspect} />
              <Badge className={`${typeConfig.color} text-white`}>
                <TypeIcon className="mr-1 h-3 w-3" />
                {typeConfig.label}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {goal.title}
            </h1>
            {goal.identityStatement && (
              <p className="text-muted-foreground italic">
                &quot;I am becoming someone who {goal.identityStatement}&quot;
              </p>
            )}
          </div>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Ring */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-3xl font-bold">{Math.round(progress)}%</p>
              </div>
              <div
                className="relative h-20 w-20"
                style={{
                  background: `conic-gradient(${aspectConfig.color} ${progress}%, var(--muted) ${progress}%)`,
                  borderRadius: "50%",
                }}
              >
                <div className="absolute inset-2 rounded-full bg-background" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WOOP Summary (if available) */}
        {goal.woop && (
          <WOOPSummary
            woop={goal.woop}
            ifThenPlans={goal.ifThenPlans}
            identityStatement={goal.identityStatement}
          />
        )}

        {/* Type-Specific Tracker */}
        {goalType === "habit" && goal.habit && (
          <HabitTracker
            habit={goal.habit}
            tasksCompletedThisPeriod={tasksCompletedThisPeriod}
          />
        )}

        {/* Year Planner for habit goals */}
        {goalType === "habit" && goal.habit && (
          <YearPlanner
            yearlyGoal={goal}
            monthlyGoals={monthlyGoals.filter((mg) => mg.yearlyGoalId === goal.id)}
            weeklyGoals={weeklyGoals.filter((wg) => {
              const relatedMonthly = monthlyGoals.find((mg) => mg.id === wg.monthlyGoalId)
              return relatedMonthly?.yearlyGoalId === goal.id
            })}
            tasks={linkedTasks}
          />
        )}

        {/* Week Plan for habit goals with current week's goal */}
        {goalType === "habit" && currentWeekGoal && (
          <WeekPlan
            weeklyGoal={currentWeekGoal}
            aspect={goal.aspect}
            linkedTasks={currentWeekTasks}
            defaultTaskTitle={goal.habit?.action ? `${goal.habit.action} session` : undefined}
            targetOverride={goal.habit?.target}
            habitConfig={goal.habit}
          />
        )}

        {goalType === "mastery" && goal.mastery && (
          <MasteryTracker
            mastery={goal.mastery}
            onLevelUp={handleLevelUp}
          />
        )}

        {goalType === "project" && goal.project && (
          <ProjectTracker
            project={goal.project}
            onMilestoneStatusChange={handleMilestoneStatusChange}
          />
        )}

        {goalType === "outcome" && goal.outcome && (
          <OutcomeTracker
            outcome={goal.outcome}
            onUpdateValue={handleUpdateOutcomeValue}
          />
        )}

        {/* Goal Hierarchy */}
        {hierarchy.length > 0 && (
          <Card>
            <Collapsible open={hierarchyOpen} onOpenChange={setHierarchyOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer pb-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <GitBranch className="h-5 w-5" />
                      Goal Breakdown
                      <Badge variant="secondary" className="ml-2">
                        {hierarchy.length} monthly
                      </Badge>
                    </CardTitle>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${hierarchyOpen ? "" : "-rotate-90"}`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {hierarchy.map((monthly) => (
                    <div key={monthly.id} className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: aspectConfig.color }}
                          />
                          <span className="font-medium">{monthly.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {monthly.month}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-muted">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${monthly.progress}%`,
                                backgroundColor: aspectConfig.color,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">
                            {Math.round(monthly.progress)}%
                          </span>
                        </div>
                      </div>
                      {monthly.weeklyGoals.length > 0 && (
                        <div className="ml-6 space-y-1.5 border-l-2 border-muted pl-4">
                          {monthly.weeklyGoals.map((weekly) => (
                            <div
                              key={weekly.id}
                              className="flex items-center justify-between py-1"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {weekly.title}
                                </span>
                                <Badge variant="outline" className="text-[10px]">
                                  {weekly.week}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-1 w-12 rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${weekly.progress}%`,
                                      backgroundColor: aspectConfig.color,
                                      opacity: 0.7,
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] text-muted-foreground w-6">
                                  {Math.round(weekly.progress)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Linked Tasks - Grouped by Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListTodo className="h-5 w-5" />
                Linked Tasks
                <Badge variant="secondary" className="ml-2">
                  {linkedTasks.length} total
                </Badge>
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setAddTaskOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkedTasks.length > 0 ? (
              <>
                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                  <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2 text-left transition-colors hover:bg-amber-500/20">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="font-medium">Pending</span>
                        <Badge variant="outline">{pendingTasks.length}</Badge>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${pendingOpen ? "" : "-rotate-90"}`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {pendingTasks.map((task) => (
                        <TaskItem key={task.id} task={task} showDate />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-left transition-colors hover:bg-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">Completed</span>
                        <Badge variant="outline">{completedTasks.length}</Badge>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${completedOpen ? "" : "-rotate-90"}`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {completedTasks.map((task) => (
                        <TaskItem key={task.id} task={task} showDate />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Skipped/Deferred Tasks */}
                {skippedTasks.length > 0 && (
                  <Collapsible open={skippedOpen} onOpenChange={setSkippedOpen}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-muted px-3 py-2 text-left transition-colors hover:bg-muted/80">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Skipped / Deferred</span>
                        <Badge variant="outline">{skippedTasks.length}</Badge>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${skippedOpen ? "" : "-rotate-90"}`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {skippedTasks.map((task) => (
                        <TaskItem key={task.id} task={task} showDate />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </>
            ) : (
              <EmptyState
                icon={ListTodo}
                title="No tasks yet"
                description="Create tasks to work toward this goal"
                actionLabel="Add Task"
                onAction={() => setAddTaskOpen(true)}
              />
            )}
          </CardContent>
        </Card>

        {/* Success Criteria */}
        {goal.successCriteria && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Success Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{goal.successCriteria}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Task for {goal.title}</DialogTitle>
            <DialogDescription>
              Create a task linked to this goal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="What do you need to do?"
                autoFocus
              />
            </div>

            {availableWeeklyGoals.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Weekly Goal (optional)</Label>
                <Select value={formWeeklyGoalId} onValueChange={setFormWeeklyGoalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No weekly goal linked" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No weekly goal linked</SelectItem>
                    {availableWeeklyGoals.map((wg) => (
                      <SelectItem key={wg.id} value={wg.id}>
                        {wg.title} ({wg.week})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
              <Label>Estimated Duration (minutes)</Label>
              <Input
                type="number"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                min="5"
                max="480"
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
              {isSubmitting ? "Adding..." : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
