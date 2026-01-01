"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { AspectBadge } from "@/components/aspect-badge"
import { Progress } from "@/components/ui/progress"
import type { Goal } from "@/lib/types"
import { cn } from "@/lib/utils"

interface GoalCardProps {
  goal: Goal
  children?: Goal[]
  level?: number
}

export function GoalCard({ goal, children = [], level = 0 }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = children.length > 0

  return (
    <div className={cn("space-y-2", level > 0 && "ml-6")}>
      <div className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-2">
              {hasChildren && (
                <button onClick={() => setExpanded(!expanded)} className="mt-1 text-muted-foreground">
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold leading-tight text-pretty">{goal.title}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <AspectBadge aspect={goal.aspect} />
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">{goal.level}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-pretty">{goal.successCriteria}</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
          </div>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="space-y-2">
          {children.map((child) => (
            <GoalCard key={child.id} goal={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
