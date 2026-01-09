"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useTasksStore } from "@/stores/tasks"
import { useGoalsStore } from "@/stores/goals"
import { generateBehavioralNudges } from "@/services/resistance"
import { AlertCircle, Flame, User, Zap, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BehavioralNudgesProps {
  maxNudges?: number
  className?: string
}

const NUDGE_ICONS: Record<string, typeof AlertCircle> = {
  resistance: AlertCircle,
  streak_broken: Flame,
  identity: User,
  default: Zap,
}

const NUDGE_COLORS: Record<string, string> = {
  resistance: "bg-red-500/10 text-red-700 border-red-500/30",
  streak_broken: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  identity: "bg-purple-500/10 text-purple-700 border-purple-500/30",
  default: "bg-blue-500/10 text-blue-700 border-blue-500/30",
}

export function BehavioralNudges({ maxNudges = 3, className }: BehavioralNudgesProps) {
  const tasks = useTasksStore((s) => s.tasks)
  const yearlyGoals = useGoalsStore((s) => s.yearlyGoals)

  const nudges = useMemo(() => {
    const pendingTasks = tasks.filter((t) => t.status === "pending")
    const activeGoals = yearlyGoals.filter((g) => g.status === "active")
    return generateBehavioralNudges(pendingTasks, activeGoals).slice(0, maxNudges)
  }, [tasks, yearlyGoals, maxNudges])

  if (nudges.length === 0) return null

  return (
    <div className={cn("space-y-3", className)}>
      {nudges.map((nudge, index) => {
        const Icon = NUDGE_ICONS[nudge.type] || NUDGE_ICONS.default
        const colorClass = NUDGE_COLORS[nudge.type] || NUDGE_COLORS.default

        return (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3",
              colorClass
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm">{nudge.message}</p>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Identity Card - Shows a random identity statement for motivation
 */
interface IdentityCardProps {
  className?: string
}

export function IdentityCard({ className }: IdentityCardProps) {
  const yearlyGoals = useGoalsStore((s) => s.yearlyGoals)

  const identityGoal = useMemo(() => {
    const goalsWithIdentity = yearlyGoals.filter(
      (g) => g.identityStatement && g.status === "active"
    )
    if (goalsWithIdentity.length === 0) return null
    return goalsWithIdentity[Math.floor(Math.random() * goalsWithIdentity.length)]
  }, [yearlyGoals])

  if (!identityGoal) return null

  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Today&apos;s Identity</p>
            <p className="mt-1 text-sm font-medium">
              I am someone who {identityGoal.identityStatement}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Streak Alert - Shows when habit streak needs protection
 */
interface StreakAlertProps {
  goalId: string
  className?: string
}

export function StreakAlert({ goalId, className }: StreakAlertProps) {
  const goal = useGoalsStore((s) => s.yearlyGoals.find((g) => g.id === goalId))

  if (!goal || goal.goalType !== "habit" || !goal.habit) return null

  const { currentStreak, longestStreak } = goal.habit

  // Show alert if streak is at risk (was active, now broken)
  const streakAtRisk = currentStreak === 0 && longestStreak > 3

  // Show encouragement if on a good streak
  const onGoodStreak = currentStreak >= 7

  if (!streakAtRisk && !onGoodStreak) return null

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3",
        streakAtRisk
          ? "border-orange-500/30 bg-orange-500/10"
          : "border-green-500/30 bg-green-500/10",
        className
      )}
    >
      <Flame className={cn(
        "h-5 w-5",
        streakAtRisk ? "text-orange-600" : "text-green-600"
      )} />
      <div>
        {streakAtRisk ? (
          <>
            <p className="text-sm font-medium text-orange-700">Streak at risk</p>
            <p className="text-xs text-orange-600">
              One skip is fine. Don&apos;t skip twice. Get back on track today.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-green-700">
              {currentStreak} day streak!
            </p>
            <p className="text-xs text-green-600">
              Keep the momentum going.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * WOOP Reminder - Shows when facing high resistance
 */
interface WOOPReminderProps {
  goalId: string
  className?: string
}

export function WOOPReminder({ goalId, className }: WOOPReminderProps) {
  const goal = useGoalsStore((s) => s.yearlyGoals.find((g) => g.id === goalId))

  if (!goal?.woop) return null

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardContent className="py-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Your Plan</p>
          </div>

          {goal.woop.obstacle && (
            <div className="rounded-lg bg-orange-500/10 p-2">
              <p className="text-xs text-orange-700">
                <span className="font-medium">If </span>
                {goal.woop.obstacle}
              </p>
            </div>
          )}

          {goal.woop.plan && (
            <div className="rounded-lg bg-green-500/10 p-2">
              <p className="text-xs text-green-700">
                <span className="font-medium">Then </span>
                {goal.woop.plan}
              </p>
            </div>
          )}

          {goal.ifThenPlans && goal.ifThenPlans.length > 0 && (
            <div className="space-y-1">
              {goal.ifThenPlans.slice(0, 2).map((plan, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {plan}
                </p>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
