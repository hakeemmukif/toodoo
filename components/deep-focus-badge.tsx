"use client"

import type { DeepFocusAnalysis, BlockDepth } from "@/lib/types"
import { getDeepFocusSummary, getDepthColor } from "@/services/deep-focus"
import { cn } from "@/lib/utils"
import { Brain, Coffee, Battery } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"

interface DeepFocusBadgeProps {
  analysis: DeepFocusAnalysis
  dailyTarget?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function DeepFocusBadge({
  analysis,
  dailyTarget = 4,
  size = "md",
  className,
}: DeepFocusBadgeProps) {
  const summary = getDeepFocusSummary(analysis)
  const progress = Math.min(100, (analysis.todayDeep / dailyTarget) * 100)
  const deepColor = getDepthColor("deep")

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
              analysis.targetMet ? "bg-green-500/10 text-green-600" : "",
              className
            )}
            style={
              !analysis.targetMet
                ? {
                    backgroundColor: `color-mix(in oklch, ${deepColor} 15%, transparent)`,
                    color: deepColor,
                  }
                : undefined
            }
          >
            <Brain className={iconSizes[size]} />
            <span>{analysis.todayDeep}h</span>
            {size !== "sm" && (
              <span className="opacity-70">/ {dailyTarget}h</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-[200px]">
          <div className="space-y-2 text-xs">
            <p className="font-medium">{summary}</p>
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between text-muted-foreground">
              <span>Deep: {analysis.todayDeep}h</span>
              <span>Shallow: {analysis.todayShallow}h</span>
            </div>
            {analysis.alerts.length > 0 && (
              <p className="text-yellow-600">{analysis.alerts[0]}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface DepthIndicatorProps {
  depth: BlockDepth
  size?: "sm" | "md"
  className?: string
}

export function DepthIndicator({ depth, size = "md", className }: DepthIndicatorProps) {
  const color = getDepthColor(depth)
  const Icon = depth === "deep" ? Brain : depth === "shallow" ? Coffee : Battery

  const labels: Record<BlockDepth, string> = {
    deep: "Deep Work",
    shallow: "Shallow Work",
    recovery: "Recovery",
  }

  const sizeClasses = {
    sm: "h-5 px-1.5 text-[10px] gap-1",
    md: "h-6 px-2 text-xs gap-1.5",
  }

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded font-medium",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
        color: color,
      }}
    >
      <Icon className={iconSizes[size]} />
      <span>{labels[depth]}</span>
    </div>
  )
}

interface DeepFocusStatsProps {
  analysis: DeepFocusAnalysis
  className?: string
}

export function DeepFocusStats({ analysis, className }: DeepFocusStatsProps) {
  return (
    <div className={cn("rounded-lg border border-border/60 bg-card p-4", className)}>
      <h4 className="mb-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Focus Stats
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-serif">{analysis.todayDeep}h</p>
          <p className="text-xs text-muted-foreground">Today's deep work</p>
        </div>
        <div>
          <p className="text-2xl font-serif">{analysis.weeklyDeep}h</p>
          <p className="text-xs text-muted-foreground">This week</p>
        </div>
        <div>
          <p className="text-2xl font-serif">{Math.round(analysis.ratio * 100)}%</p>
          <p className="text-xs text-muted-foreground">Deep ratio</p>
        </div>
        <div>
          <p className="text-2xl font-serif">{analysis.fragmentationScore}</p>
          <p className="text-xs text-muted-foreground">Fragmentation</p>
        </div>
      </div>
      {analysis.alerts.length > 0 && (
        <div className="mt-4 space-y-1">
          {analysis.alerts.map((alert, i) => (
            <p key={i} className="text-xs text-yellow-600">
              {alert}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
