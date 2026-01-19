"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Thermometer, Clock, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SessionItem } from "@/lib/types"

interface DraggableItemProps {
  item: SessionItem
  isOverlay?: boolean
}

export function DraggableItem({ item, isOverlay }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: "item",
      item,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // When used as overlay (ghost following cursor)
  if (isOverlay) {
    return (
      <div className="rounded-lg border bg-card p-3 shadow-xl ring-2 ring-primary/50 rotate-2 scale-105">
        <ItemContent item={item} />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-card p-3 transition-all",
        isDragging && "opacity-30 ring-2 ring-dashed ring-primary/50",
        !isDragging && "hover:border-primary/50 hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <ItemContent item={item} />
      </div>
    </div>
  )
}

function ItemContent({ item }: { item: SessionItem }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm truncate">{item.name}</p>
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Thermometer className="h-3 w-3" />
          {item.temperature}C
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {item.timeMinutes}m
        </span>
        {item.shakeHalfway && (
          <span className="flex items-center gap-1" title="Shake halfway">
            <RotateCcw className="h-3 w-3" />
          </span>
        )}
      </div>
    </div>
  )
}
