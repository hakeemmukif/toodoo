"use client"

import type { TimeConflict } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime12hr } from "@/services/conflict-detector"

interface ConflictWarningProps {
  conflicts: TimeConflict[]
  suggestedTimes: string[]
  onSelectTime: (time: string) => void
  onCustomTime: () => void
  className?: string
}

export function ConflictWarning({
  conflicts,
  suggestedTimes,
  onSelectTime,
  onCustomTime,
  className,
}: ConflictWarningProps) {
  const primaryConflict = conflicts[0]
  const isHardConflict =
    primaryConflict?.conflictType === "exact" ||
    primaryConflict?.conflictType === "overlap"

  // Adjacent conflicts are soft warnings
  if (!isHardConflict && primaryConflict?.conflictType === "adjacent") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-50/50 p-3 dark:bg-yellow-950/20",
          className
        )}
      >
        <Clock className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="text-yellow-700 dark:text-yellow-400">
            Close to "{primaryConflict.conflictingTaskTitle}" at{" "}
            {formatTime12hr(primaryConflict.conflictStart)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <Card
      className={cn("border-destructive/50 bg-destructive/5", className)}
    >
      <CardContent className="space-y-4 p-4">
        {/* Warning Header */}
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Time Conflict</p>
            <p className="text-sm text-muted-foreground">
              "{primaryConflict.conflictingTaskTitle}" is{" "}
              {primaryConflict.conflictType === "exact"
                ? "also scheduled"
                : "scheduled"}{" "}
              at {formatTime12hr(primaryConflict.conflictStart)}
              {primaryConflict.conflictType === "overlap" && (
                <> - {formatTime12hr(primaryConflict.conflictEnd)}</>
              )}
            </p>
          </div>
        </div>

        {/* Time Selection Chips */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Pick a different time:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedTimes.slice(0, 5).map((time) => (
              <Button
                key={time}
                variant="outline"
                size="sm"
                onClick={() => onSelectTime(time)}
                className="h-9 px-3"
              >
                <Clock className="mr-1.5 h-3 w-3" />
                {formatTime12hr(time)}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={onCustomTime}
              className="h-9 px-3 text-muted-foreground"
            >
              Custom...
            </Button>
          </div>
        </div>

        {/* Multiple conflicts warning */}
        {conflicts.length > 1 && (
          <p className="text-xs text-muted-foreground">
            +{conflicts.length - 1} more conflict
            {conflicts.length > 2 ? "s" : ""} on this day
          </p>
        )}
      </CardContent>
    </Card>
  )
}
