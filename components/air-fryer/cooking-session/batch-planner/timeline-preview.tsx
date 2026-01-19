"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { getAverageTemperature, getLongestCookTime } from "@/services/cooking-optimizer/temperature-hints"
import type { CookingBatch, SessionItem } from "@/lib/types"

interface TimelinePreviewProps {
  batches: CookingBatch[]
  items: SessionItem[]
}

const REST_BETWEEN_BATCHES = 2 // Minutes

export function TimelinePreview({ batches, items }: TimelinePreviewProps) {
  const timeline = useMemo(() => {
    const sortedBatches = [...batches].sort((a, b) => a.order - b.order)
    let totalMinutes = 0

    const phases = sortedBatches.map((batch, index) => {
      const batchItems = items.filter((i) => batch.itemIds.includes(i.id))
      const duration = getLongestCookTime(batchItems)
      const temp = getAverageTemperature(batchItems)
      const restAfter = index < sortedBatches.length - 1 ? REST_BETWEEN_BATCHES : 0

      const phase = {
        batchId: batch.id,
        order: batch.order,
        duration,
        temperature: temp,
        itemCount: batchItems.length,
        restAfter,
      }

      totalMinutes += duration + restAfter
      return phase
    })

    return { phases, totalMinutes }
  }, [batches, items])

  if (timeline.phases.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        Add items to batches to see timeline
      </div>
    )
  }

  const maxDuration = Math.max(...timeline.phases.map((p) => p.duration), 1)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Timeline Preview
        </h3>
        <span className="text-sm font-medium">
          Total: {timeline.totalMinutes}m
        </span>
      </div>

      {/* Timeline bars */}
      <div className="space-y-2">
        {timeline.phases.map((phase, index) => (
          <div key={phase.batchId} className="flex items-center gap-3">
            {/* Batch label */}
            <div className="w-12 shrink-0 text-xs text-muted-foreground">
              B{phase.order}
            </div>

            {/* Bar */}
            <div className="flex-1 h-6 bg-muted/50 rounded overflow-hidden">
              <div
                className={cn(
                  "h-full flex items-center px-2 text-xs font-medium text-white transition-all duration-300",
                  phase.itemCount === 0
                    ? "bg-muted-foreground/30"
                    : index % 2 === 0
                    ? "bg-primary"
                    : "bg-primary/70"
                )}
                style={{
                  width: phase.duration > 0
                    ? `${(phase.duration / maxDuration) * 100}%`
                    : "0%",
                }}
              >
                {phase.itemCount > 0 && (
                  <span className="truncate">
                    {phase.temperature}C {phase.duration}m
                  </span>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="w-10 shrink-0 text-xs text-right text-muted-foreground">
              {phase.duration}m
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <span>{timeline.phases.length} batch{timeline.phases.length !== 1 ? "es" : ""}</span>
        <span>{timeline.phases.filter((p) => p.itemCount > 0).length} active</span>
      </div>
    </div>
  )
}
