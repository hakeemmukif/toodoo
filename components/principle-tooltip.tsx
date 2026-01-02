"use client"

import type { ReactNode } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

type PrincipleKey =
  | "never-skip-twice"
  | "resistance-is-compass"
  | "deep-work-first"
  | "minimum-viable-version"
  | "progress-not-perfection"
  | "start-small"
  | "one-thing"
  | "defer-with-intention"

const PRINCIPLES: Record<
  PrincipleKey,
  { title: string; description: string }
> = {
  "never-skip-twice": {
    title: "Never Skip Twice",
    description:
      "Missing once is human. Missing twice breaks momentum. A single miss doesn't break a streak - a double miss does.",
  },
  "resistance-is-compass": {
    title: "Resistance is Your Compass",
    description:
      "The tasks you resist most often point to what matters most. Track resistance to understand yourself better.",
  },
  "deep-work-first": {
    title: "Deep Work First",
    description:
      "Prioritize cognitively demanding work before shallow tasks. Protect your focus time ruthlessly.",
  },
  "minimum-viable-version": {
    title: "Minimum Viable Version",
    description:
      "Define the smallest version of a task that still counts. On hard days, do the minimum. Consistency beats intensity.",
  },
  "progress-not-perfection": {
    title: "Progress, Not Perfection",
    description:
      "Small improvements compound over time. Focus on getting slightly better, not achieving perfection.",
  },
  "start-small": {
    title: "Start Small",
    description:
      "If a task takes less than two minutes, do it now. For bigger tasks, start with just two minutes.",
  },
  "one-thing": {
    title: "The One Thing",
    description:
      "What's the ONE thing you can do such that by doing it everything else will be easier or unnecessary?",
  },
  "defer-with-intention": {
    title: "Defer With Intention",
    description:
      "Deferring a task is fine - but notice how often you defer the same task. Repeated deferrals signal resistance.",
  },
}

interface PrincipleTooltipProps {
  principle: PrincipleKey
  children?: ReactNode
  showIcon?: boolean
  className?: string
}

export function PrincipleTooltip({
  principle,
  children,
  showIcon = true,
  className,
}: PrincipleTooltipProps) {
  const info = PRINCIPLES[principle]

  if (!info) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1 cursor-help", className)}>
            {children}
            {showIcon && (
              <Info className="h-3 w-3 text-muted-foreground" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px]">
          <div className="space-y-1.5">
            <p className="font-medium">{info.title}</p>
            <p className="text-xs text-muted-foreground">{info.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface PrincipleCardProps {
  principle: PrincipleKey
  className?: string
}

export function PrincipleCard({ principle, className }: PrincipleCardProps) {
  const info = PRINCIPLES[principle]

  if (!info) return null

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card p-4",
        className
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Info className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium">{info.title}</h4>
      </div>
      <p className="text-sm text-muted-foreground">{info.description}</p>
    </div>
  )
}

export function getPrincipleKeys(): PrincipleKey[] {
  return Object.keys(PRINCIPLES) as PrincipleKey[]
}
