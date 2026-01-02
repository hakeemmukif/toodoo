"use client"

import type { Task, CoachTone } from "@/lib/types"
import { getResistanceLevel, getResistanceMessage, getResistanceColor } from "@/services/resistance"
import { cn } from "@/lib/utils"
import { AlertCircle, TrendingUp, Shield } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ResistanceIndicatorProps {
  task: Task
  coachTone?: CoachTone
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function ResistanceIndicator({
  task,
  coachTone = "balanced",
  size = "md",
  showLabel = false,
  className,
}: ResistanceIndicatorProps) {
  const level = getResistanceLevel(task)
  const message = getResistanceMessage(task.deferCount, coachTone)
  const color = getResistanceColor(level)

  if (level === "none") return null

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-7 w-7",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  }

  const Icon = level === "high" ? AlertCircle : level === "medium" ? TrendingUp : Shield

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center justify-center rounded-full transition-colors",
              sizeClasses[size],
              className
            )}
            style={{
              backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
              color: color,
            }}
          >
            <Icon className={iconSizes[size]} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{level} Resistance</span>
            </div>
            <p className="text-muted-foreground">{message}</p>
            {task.deferCount > 0 && (
              <p className="text-muted-foreground">
                Deferred {task.deferCount} time{task.deferCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface ResistancePatternProps {
  tasks: Task[]
  className?: string
}

export function ResistancePattern({ tasks, className }: ResistancePatternProps) {
  const highResistance = tasks.filter((t) => getResistanceLevel(t) === "high")
  const mediumResistance = tasks.filter((t) => getResistanceLevel(t) === "medium")

  if (highResistance.length === 0 && mediumResistance.length === 0) return null

  return (
    <div className={cn("rounded-lg border border-border/60 bg-card p-4", className)}>
      <h4 className="mb-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Resistance Patterns
      </h4>
      <div className="space-y-2">
        {highResistance.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: getResistanceColor("high") }}
            />
            <span className="text-muted-foreground">
              {highResistance.length} task{highResistance.length > 1 ? "s" : ""} with high resistance
            </span>
          </div>
        )}
        {mediumResistance.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: getResistanceColor("medium") }}
            />
            <span className="text-muted-foreground">
              {mediumResistance.length} task{mediumResistance.length > 1 ? "s" : ""} with medium resistance
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
