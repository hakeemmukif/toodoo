"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DraggableItem } from "./draggable-item"
import { TemperatureIndicator } from "./temperature-indicator"
import { calculateTemperatureHint } from "@/services/cooking-optimizer/temperature-hints"
import { cn } from "@/lib/utils"
import type { CookingBatch, SessionItem } from "@/lib/types"

interface BatchLaneProps {
  batch: CookingBatch
  items: SessionItem[]
  onDelete: (batchId: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}

export function BatchLane({ batch, items, onDelete, dragHandleProps }: BatchLaneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `batch-${batch.id}`,
    data: {
      type: "batch",
      batchId: batch.id,
    },
  })

  const hint = calculateTemperatureHint(items)
  const totalTime = items.length > 0
    ? Math.max(...items.map((i) => i.timeMinutes))
    : 0

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 border-dashed p-3 transition-colors",
        isOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 bg-muted/30",
        items.length === 0 && "min-h-[100px]"
      )}
    >
      {/* Batch Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {dragHandleProps && (
            <button
              {...dragHandleProps}
              className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
              aria-label="Drag to reorder batch"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <span className="font-medium text-sm">Batch {batch.order}</span>
          {batch.userNotes && (
            <span className="text-xs text-muted-foreground">
              ({batch.userNotes})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <>
              <TemperatureIndicator hint={hint} compact />
              <span className="text-xs text-muted-foreground">
                {totalTime}m
              </span>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(batch.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Items */}
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              Drop items here
            </div>
          ) : (
            items.map((item) => (
              <DraggableItem key={item.id} item={item} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}
