"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useGoalsStore } from "@/stores/goals"
import { useToast } from "@/hooks/use-toast"
import { getWeekString } from "@/services/goal-linking"
import type { LifeAspect, GoalType, HabitGoal } from "@/lib/types"

interface QuickGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultAspect?: LifeAspect
}

export function QuickGoalModal({ open, onOpenChange, defaultAspect }: QuickGoalModalProps) {
  const [formAspect, setFormAspect] = useState<LifeAspect>(defaultAspect || "fitness")
  const [formTitle, setFormTitle] = useState("")
  const [formCriteria, setFormCriteria] = useState("")
  const [formGoalType, setFormGoalType] = useState<GoalType>("outcome")
  // Habit-specific fields
  const [formFrequency, setFormFrequency] = useState("4")
  const [formPeriod, setFormPeriod] = useState<"day" | "week" | "month">("week")
  const [formAction, setFormAction] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const yearlyGoals = useGoalsStore((state) => state.yearlyGoals)
  const addYearlyGoal = useGoalsStore((state) => state.addYearlyGoal)
  const addMonthlyGoal = useGoalsStore((state) => state.addMonthlyGoal)
  const addWeeklyGoal = useGoalsStore((state) => state.addWeeklyGoal)
  const { toast } = useToast()

  // Reset form when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setFormAspect(defaultAspect || "fitness")
      setFormTitle("")
      setFormCriteria("")
      setFormGoalType("outcome")
      setFormFrequency("4")
      setFormPeriod("week")
      setFormAction("")
    }
    onOpenChange(newOpen)
  }

  const handleCreate = async () => {
    if (!formTitle.trim() || !formCriteria.trim()) return

    setIsSubmitting(true)
    try {
      // Calculate next priority (max + 1, or 1 if no goals)
      const existingPriorities = yearlyGoals
        .filter((g) => g.status === "active")
        .map((g) => g.priority)
      const nextPriority = existingPriorities.length > 0
        ? Math.max(...existingPriorities) + 1
        : 1

      // Build habit config if goal type is habit
      let habitConfig: HabitGoal | undefined = undefined
      if (formGoalType === "habit") {
        const freq = parseInt(formFrequency) || 4
        const action = formAction.trim() || formTitle.split(" ")[0].toLowerCase()
        habitConfig = {
          target: freq,
          period: formPeriod,
          action: action,
          contextCue: "",
          implementation: "",
          flexibleSchedule: true,
          currentStreak: 0,
          longestStreak: 0,
        }
      }

      // Create yearly goal
      const yearlyId = await addYearlyGoal({
        aspect: formAspect,
        year: new Date().getFullYear(),
        title: formTitle.trim(),
        description: formCriteria.trim(),
        successCriteria: formCriteria.trim(),
        status: "active",
        priority: nextPriority,
        goalType: formGoalType,
        habit: habitConfig,
      })

      // For habit goals, also create monthly and weekly goals
      if (formGoalType === "habit" && habitConfig) {
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        const currentWeek = getWeekString(now)

        // Calculate monthly target (e.g., 4x/week = ~16-17 per month)
        let monthlyTarget = habitConfig.target
        if (habitConfig.period === "week") {
          monthlyTarget = habitConfig.target * 4 // approx 4 weeks/month
        } else if (habitConfig.period === "day") {
          monthlyTarget = habitConfig.target * 30 // approx 30 days/month
        }

        // Create monthly goal
        const monthlyId = await addMonthlyGoal({
          yearlyGoalId: yearlyId,
          aspect: formAspect,
          title: `${monthlyTarget} ${habitConfig.action} sessions`,
          successCriteria: `Complete ${monthlyTarget} ${habitConfig.action} sessions this month`,
          month: currentMonth,
          status: "active",
          priority: 1,
        })

        // Create weekly goal with frequency
        await addWeeklyGoal({
          monthlyGoalId: monthlyId,
          aspect: formAspect,
          title: `Complete ${habitConfig.target} ${habitConfig.action} sessions`,
          week: currentWeek,
          status: "active",
          frequency: {
            target: habitConfig.target,
            period: "week",
            action: habitConfig.action,
          },
        })

        toast({
          title: "Habit goal created",
          description: `"${formTitle}" with ${habitConfig.target}x/${formPeriod} target. Weekly goal ready for planning!`,
        })
      } else {
        toast({
          title: "Goal created",
          description: `"${formTitle}" added to ${ASPECT_CONFIG[formAspect].label}`,
        })
      }

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Failed to create goal",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Goal</DialogTitle>
          <DialogDescription>
            Create a simple goal without the full setup. You can always add details later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Life Aspect</Label>
            <Select value={formAspect} onValueChange={(v) => setFormAspect(v as LifeAspect)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASPECT_CONFIG).map(([aspect, config]) => {
                  const Icon = config.icon
                  return (
                    <SelectItem key={aspect} value={aspect}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: config.color }} />
                        {config.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Goal Title</Label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Success Criteria</Label>
            <Textarea
              value={formCriteria}
              onChange={(e) => setFormCriteria(e.target.value)}
              placeholder="How will you know when you've achieved this?"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Be specific. "Lose 5kg" is better than "Get fit"
            </p>
          </div>

          <div className="space-y-2">
            <Label>Goal Type</Label>
            <Select value={formGoalType} onValueChange={(v) => setFormGoalType(v as GoalType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outcome">
                  <div className="flex flex-col">
                    <span>Outcome</span>
                    <span className="text-xs text-muted-foreground">Measurable result (e.g., lose 5kg)</span>
                  </div>
                </SelectItem>
                <SelectItem value="habit">
                  <div className="flex flex-col">
                    <span>Habit</span>
                    <span className="text-xs text-muted-foreground">Regular practice (e.g., train 4x/week)</span>
                  </div>
                </SelectItem>
                <SelectItem value="project">
                  <div className="flex flex-col">
                    <span>Project</span>
                    <span className="text-xs text-muted-foreground">Has milestones (e.g., launch app)</span>
                  </div>
                </SelectItem>
                <SelectItem value="mastery">
                  <div className="flex flex-col">
                    <span>Mastery</span>
                    <span className="text-xs text-muted-foreground">Skill levels (e.g., learn piano)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Habit-specific fields */}
          {formGoalType === "habit" && (
            <div className="space-y-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
              <p className="text-xs font-medium text-blue-600">Habit Configuration</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">How often?</Label>
                  <Input
                    type="number"
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    min="1"
                    max="30"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Per</Label>
                  <Select value={formPeriod} onValueChange={(v) => setFormPeriod(v as "day" | "week" | "month")}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Action word (optional)</Label>
                <Input
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                  placeholder="e.g., train, cook, read"
                  className="h-8"
                />
                <p className="text-[10px] text-muted-foreground">
                  Used for session titles. Leave blank to auto-detect from goal title.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!formTitle.trim() || !formCriteria.trim() || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
