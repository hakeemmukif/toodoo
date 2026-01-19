"use client"

import { Badge } from "@/components/ui/badge"
import { Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityBadgeProps {
  countsTowardGoal: boolean
  className?: string
  size?: "sm" | "default"
}

/**
 * Visual distinction between goal-linked and quick-logged activities
 * - Goal-linked: Shows "Counts" badge with target icon
 * - Quick-logged: Shows subtle "Logged" text
 */
export function ActivityBadge({ countsTowardGoal, className, size = "default" }: ActivityBadgeProps) {
  if (countsTowardGoal) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "gap-1",
          size === "sm" && "text-xs py-0 px-1.5",
          className
        )}
      >
        <Target className={cn("h-3 w-3", size === "sm" && "h-2.5 w-2.5")} />
        Counts
      </Badge>
    )
  }

  return (
    <span
      className={cn(
        "text-muted-foreground",
        size === "sm" ? "text-xs" : "text-sm",
        className
      )}
    >
      Logged
    </span>
  )
}
