"use client"

import { Lightbulb, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { CookingBatch, SessionItem } from "@/lib/types"

interface SuggestionsOverlayProps {
  suggestions: CookingBatch[]
  items: SessionItem[]
  onApply: (batches: CookingBatch[]) => void
  onDismiss: () => void
}

export function SuggestionsOverlay({
  suggestions,
  items,
  onApply,
  onDismiss,
}: SuggestionsOverlayProps) {
  if (suggestions.length === 0) return null

  // Build readable suggestion summary
  const getSuggestionSummary = () => {
    return suggestions.map((batch) => {
      const batchItems = items.filter((i) => batch.itemIds.includes(i.id))
      const names = batchItems.map((i) => i.name).join(", ")
      const temp = batch.targetTemperature ?? 180
      return { order: batch.order, names, temp, count: batchItems.length }
    })
  }

  const summary = getSuggestionSummary()

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <p className="font-medium text-sm">Suggested Batching</p>
              <p className="text-xs text-muted-foreground">
                Grouped by similar temperatures for optimal cooking
              </p>
            </div>

            {/* Suggestion preview */}
            <div className="space-y-1.5">
              {summary.map((batch) => (
                <div
                  key={batch.order}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="font-medium text-muted-foreground w-16">
                    Batch {batch.order}:
                  </span>
                  <span className="truncate flex-1">{batch.names}</span>
                  <span className="text-muted-foreground shrink-0">
                    ({batch.temp}C)
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={() => onApply(suggestions)}>
                Apply Suggestion
              </Button>
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Start Fresh
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
