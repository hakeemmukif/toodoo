"use client"

import type { GoalMatch } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Link2Off, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface GoalSelectorProps {
  currentGoal: GoalMatch | null
  alternatives: GoalMatch[]
  onSelect: (goal: GoalMatch | null) => void
  className?: string
}

export function GoalSelector({
  currentGoal,
  alternatives,
  onSelect,
  className,
}: GoalSelectorProps) {
  // Don't show dropdown if no alternatives
  const hasAlternatives = alternatives.length > 0

  if (!hasAlternatives && !currentGoal) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 px-2", className)}
          disabled={!hasAlternatives}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Current selection (if any) */}
        {currentGoal && (
          <DropdownMenuItem
            onClick={() => onSelect(currentGoal)}
            className="flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{currentGoal.goalTitle}</p>
              {currentGoal.frequencyProgress && (
                <p className="text-xs text-muted-foreground">
                  {currentGoal.frequencyProgress.current}/{currentGoal.frequencyProgress.target} this {currentGoal.frequencyProgress.period}
                </p>
              )}
            </div>
            <Check className="ml-2 h-4 w-4 shrink-0" />
          </DropdownMenuItem>
        )}

        {/* Alternatives */}
        {hasAlternatives && currentGoal && <DropdownMenuSeparator />}
        {alternatives.map((goal) => (
          <DropdownMenuItem
            key={goal.goalId}
            onClick={() => onSelect(goal)}
            className="flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm">{goal.goalTitle}</p>
              {goal.frequencyProgress && (
                <p className="text-xs text-muted-foreground">
                  {goal.frequencyProgress.current}/{goal.frequencyProgress.target} this {goal.frequencyProgress.period}
                </p>
              )}
            </div>
            <span className="ml-2 text-xs text-muted-foreground">
              {Math.round(goal.matchConfidence * 100)}%
            </span>
          </DropdownMenuItem>
        ))}

        {/* Option to remove goal link */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onSelect(null)}
          className="text-muted-foreground"
        >
          <Link2Off className="mr-2 h-4 w-4" />
          No goal link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
