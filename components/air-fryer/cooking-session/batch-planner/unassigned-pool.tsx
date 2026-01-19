"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { DraggableItem } from "./draggable-item"
import { cn } from "@/lib/utils"
import type { SessionItem } from "@/lib/types"

interface UnassignedPoolProps {
  items: SessionItem[]
}

export function UnassignedPool({ items }: UnassignedPoolProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "unassigned-pool",
    data: {
      type: "pool",
    },
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Unassigned Items
        </h3>
        <span className="text-xs text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "rounded-lg border-2 border-dashed p-3 transition-colors",
          isOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 bg-muted/20",
          items.length === 0 && "min-h-[80px]"
        )}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={horizontalListSortingStrategy}
        >
          {items.length === 0 ? (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              All items assigned to batches
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <div key={item.id} className="w-[200px] shrink-0">
                  <DraggableItem item={item} />
                </div>
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  )
}
