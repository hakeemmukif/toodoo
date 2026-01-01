"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { GoalCard } from "@/components/goal-card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useGoalsStore } from "@/stores/goals"
import type { LifeAspect, GoalStatus, YearlyGoal, MonthlyGoal, WeeklyGoal } from "@/lib/types"
import { Target, Plus } from "lucide-react"
import { calculateYearlyProgress, calculateMonthlyProgress, calculateWeeklyProgress } from "@/services/progress"

type GoalLevel = "yearly" | "monthly" | "weekly"

interface GoalWithProgress {
  goal: YearlyGoal | MonthlyGoal | WeeklyGoal
  level: GoalLevel
  progress: number
  children: GoalWithProgress[]
}

export default function GoalsPage() {
  const [selectedAspect, setSelectedAspect] = useState<LifeAspect | "all">("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [goalsWithProgress, setGoalsWithProgress] = useState<GoalWithProgress[]>([])

  // Form state
  const [formLevel, setFormLevel] = useState<GoalLevel>("yearly")
  const [formAspect, setFormAspect] = useState<LifeAspect>("fitness")
  const [formTitle, setFormTitle] = useState("")
  const [formCriteria, setFormCriteria] = useState("")
  const [formParentId, setFormParentId] = useState<string>("")

  const yearlyGoals = useGoalsStore((state) => state.yearlyGoals)
  const monthlyGoals = useGoalsStore((state) => state.monthlyGoals)
  const weeklyGoals = useGoalsStore((state) => state.weeklyGoals)
  const addYearlyGoal = useGoalsStore((state) => state.addYearlyGoal)
  const addMonthlyGoal = useGoalsStore((state) => state.addMonthlyGoal)
  const addWeeklyGoal = useGoalsStore((state) => state.addWeeklyGoal)

  // Build hierarchical goals with progress
  useEffect(() => {
    async function buildGoalsWithProgress() {
      const filteredYearly =
        selectedAspect === "all"
          ? yearlyGoals.filter((g) => g.status === "active")
          : yearlyGoals.filter((g) => g.aspect === selectedAspect && g.status === "active")

      const result: GoalWithProgress[] = await Promise.all(
        filteredYearly.map(async (yg) => {
          const progress = await calculateYearlyProgress(yg.id)
          const monthlyChildren = monthlyGoals.filter(
            (mg) => mg.yearlyGoalId === yg.id && mg.status === "active"
          )

          const children: GoalWithProgress[] = await Promise.all(
            monthlyChildren.map(async (mg) => {
              const mgProgress = await calculateMonthlyProgress(mg.id)
              const weeklyChildren = weeklyGoals.filter(
                (wg) => wg.monthlyGoalId === mg.id && wg.status === "active"
              )

              const weeklyWithProgress: GoalWithProgress[] = await Promise.all(
                weeklyChildren.map(async (wg) => ({
                  goal: wg,
                  level: "weekly" as GoalLevel,
                  progress: await calculateWeeklyProgress(wg.id),
                  children: [],
                }))
              )

              return {
                goal: mg,
                level: "monthly" as GoalLevel,
                progress: mgProgress,
                children: weeklyWithProgress,
              }
            })
          )

          return {
            goal: yg,
            level: "yearly" as GoalLevel,
            progress,
            children,
          }
        })
      )

      setGoalsWithProgress(result)
    }

    buildGoalsWithProgress()
  }, [selectedAspect, yearlyGoals, monthlyGoals, weeklyGoals])

  const handleAddGoal = async () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = `${year}-${(now.getMonth() + 1).toString().padStart(2, "0")}`
    const weekNum = Math.ceil((now.getDate() + new Date(year, now.getMonth(), 1).getDay()) / 7)
    const week = `${year}-W${weekNum.toString().padStart(2, "0")}`

    switch (formLevel) {
      case "yearly":
        await addYearlyGoal({
          aspect: formAspect,
          title: formTitle,
          successCriteria: formCriteria,
          year,
          status: "active",
        })
        break
      case "monthly":
        await addMonthlyGoal({
          aspect: formAspect,
          title: formTitle,
          successCriteria: formCriteria,
          month,
          yearlyGoalId: formParentId || undefined,
          status: "active",
        })
        break
      case "weekly":
        await addWeeklyGoal({
          aspect: formAspect,
          title: formTitle,
          week,
          monthlyGoalId: formParentId || undefined,
          status: "active",
        })
        break
    }

    // Reset form
    setFormTitle("")
    setFormCriteria("")
    setFormParentId("")
    setDialogOpen(false)
  }

  // Get potential parent goals
  const potentialParents =
    formLevel === "monthly"
      ? yearlyGoals.filter((g) => g.status === "active")
      : formLevel === "weekly"
        ? monthlyGoals.filter((g) => g.status === "active")
        : []

  return (
    <AppLayout>
      <div className="container max-w-6xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
            <p className="text-muted-foreground">Track your progress across all life aspects</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Goal</DialogTitle>
                <DialogDescription>Create a new goal to track your progress.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Select value={formLevel} onValueChange={(v) => setFormLevel(v as GoalLevel)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Aspect</Label>
                    <Select value={formAspect} onValueChange={(v) => setFormAspect(v as LifeAspect)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ASPECT_CONFIG).map(([aspect, config]) => (
                          <SelectItem key={aspect} value={aspect}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {potentialParents.length > 0 && (
                  <div className="space-y-2">
                    <Label>Parent Goal (optional)</Label>
                    <Select value={formParentId} onValueChange={setFormParentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent goal..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No parent</SelectItem>
                        {potentialParents.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="What do you want to achieve?"
                  />
                </div>
                {formLevel !== "weekly" && (
                  <div className="space-y-2">
                    <Label>Success Criteria</Label>
                    <Textarea
                      value={formCriteria}
                      onChange={(e) => setFormCriteria(e.target.value)}
                      placeholder="How will you know you've achieved it?"
                      rows={3}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddGoal} disabled={!formTitle}>
                  Add Goal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Aspect Filter */}
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

        {/* Goals List */}
        {goalsWithProgress.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Create your first goal to start tracking your progress"
            actionLabel="Add Goal"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            {goalsWithProgress.map(({ goal, progress, children }) => (
              <GoalCard
                key={goal.id}
                goal={{
                  id: goal.id,
                  title: goal.title,
                  aspect: goal.aspect,
                  level: "yearly",
                  successCriteria: (goal as YearlyGoal).successCriteria,
                  startDate: "",
                  endDate: "",
                  progress,
                }}
                children={children.flatMap((c) => [
                  {
                    id: c.goal.id,
                    title: c.goal.title,
                    aspect: c.goal.aspect,
                    level: "monthly" as const,
                    successCriteria: (c.goal as MonthlyGoal).successCriteria || "",
                    startDate: "",
                    endDate: "",
                    progress: c.progress,
                  },
                  ...c.children.map((wc) => ({
                    id: wc.goal.id,
                    title: wc.goal.title,
                    aspect: wc.goal.aspect,
                    level: "weekly" as const,
                    successCriteria: "",
                    startDate: "",
                    endDate: "",
                    progress: wc.progress,
                  })),
                ])}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
