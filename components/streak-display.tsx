"use client"

import type { StreakData, CoachTone } from "@/lib/types"
import { getStreakMessage, getStreakColor, isStreakAtRisk } from "@/services/streaks"
import { cn } from "@/lib/utils"
import { Flame, AlertTriangle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface StreakDisplayProps {
  streak: StreakData
  coachTone?: CoachTone
  size?: "sm" | "md" | "lg"
  showMessage?: boolean
  className?: string
}

export function StreakDisplay({
  streak,
  coachTone = "balanced",
  size = "md",
  showMessage = true,
  className,
}: StreakDisplayProps) {
  const color = getStreakColor(streak.current, streak.daysSinceDoubleMiss)
  const message = getStreakMessage(streak, coachTone)
  const atRisk = isStreakAtRisk(streak)

  const sizeClasses = {
    sm: "h-6 px-2 text-xs gap-1",
    md: "h-8 px-3 text-sm gap-1.5",
    lg: "h-10 px-4 text-base gap-2",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center rounded-full font-mono font-medium transition-colors",
              sizeClasses[size],
              className
            )}
            style={{
              backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
              color: color,
            }}
          >
            {atRisk ? (
              <AlertTriangle className={cn(iconSizes[size], "animate-pulse")} />
            ) : (
              <Flame className={iconSizes[size]} />
            )}
            <span>{streak.current}</span>
            {streak.current > 0 && size !== "sm" && (
              <span className="opacity-70">days</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <div className="space-y-1 text-xs">
            {showMessage && <p>{message}</p>}
            {streak.longest > streak.current && (
              <p className="text-muted-foreground">
                Best: {streak.longest} days
              </p>
            )}
            {atRisk && (
              <p className="text-yellow-600">
                At risk - don't skip today!
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface StreakGroupProps {
  streaks: {
    type: StreakData["type"]
    label: string
    streak: StreakData
  }[]
  coachTone?: CoachTone
  className?: string
}

export function StreakGroup({ streaks, coachTone = "balanced", className }: StreakGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {streaks.map(({ type, label, streak }) => (
        <div key={type} className="flex flex-col items-center gap-1">
          <StreakDisplay streak={streak} coachTone={coachTone} size="sm" />
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}
