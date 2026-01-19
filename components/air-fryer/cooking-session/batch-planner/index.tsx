"use client"

import { useState, useCallback, useEffect } from "react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BatchLane } from "./batch-lane"
import { UnassignedPool } from "./unassigned-pool"
import { TimelinePreview } from "./timeline-preview"
import { SuggestionsOverlay } from "./suggestions-overlay"
import { DraggableItem } from "./draggable-item"
import { useCookingSessionStore } from "@/stores/cooking-session"
import type { SessionItem, CookingBatch } from "@/lib/types"

export function BatchPlanner() {
  const {
    currentSession,
    createBatch,
    deleteBatch,
    moveItemBetweenBatches,
    reorderItemsInBatch,
    autoSuggestBatches,
    applyBatchSuggestion,
    getUnassignedItems,
    optimizeSession,
  } = useCookingSessionStore()

  const [activeItem, setActiveItem] = useState<SessionItem | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [suggestions, setSuggestions] = useState<CookingBatch[]>([])

  // Generate suggestions on mount if no batches exist
  useEffect(() => {
    if (
      currentSession &&
      currentSession.items.length > 0 &&
      currentSession.batches.length === 0 &&
      showSuggestions
    ) {
      const suggested = autoSuggestBatches()
      setSuggestions(suggested)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autoSuggestBatches is stable from Zustand store
  }, [currentSession?.items.length, currentSession?.batches.length, showSuggestions])

  // Cleanup active drag state on unmount
  useEffect(() => {
    return () => setActiveItem(null)
  }, [])

  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const item = currentSession?.items.find((i) => i.id === active.id)
    if (item) {
      setActiveItem(item)
      // Haptic feedback on mobile (wrapped in try-catch for iOS Safari)
      try {
        navigator.vibrate?.(10)
      } catch {
        // Silent fail - haptic is optional
      }
    }
  }, [currentSession?.items])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over || !currentSession) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const activeItem = currentSession.items.find((i) => i.id === activeId)

    if (!activeItem) return

    // Haptic feedback on drop (wrapped in try-catch for iOS Safari)
    try {
      navigator.vibrate?.([5, 50, 10])
    } catch {
      // Silent fail - haptic is optional
    }

    // Determine source and target
    const sourceBatchId = activeItem.batchId ?? null

    // Dropping on unassigned pool
    if (overId === "unassigned-pool" || over.data.current?.type === "pool") {
      if (sourceBatchId) {
        moveItemBetweenBatches(activeId, sourceBatchId, null)
      }
      return
    }

    // Dropping on a batch
    if (overId.startsWith("batch-") || over.data.current?.type === "batch") {
      const targetBatchId = over.data.current?.batchId ?? overId.replace("batch-", "")
      if (targetBatchId !== sourceBatchId) {
        moveItemBetweenBatches(activeId, sourceBatchId, targetBatchId)
      }
      return
    }

    // Dropping on another item (reordering within batch)
    const overItem = currentSession.items.find((i) => i.id === overId)
    if (overItem && overItem.batchId) {
      const targetBatchId = overItem.batchId

      if (sourceBatchId === targetBatchId) {
        // Reorder within same batch
        const batch = currentSession.batches.find((b) => b.id === targetBatchId)
        if (batch) {
          const oldIndex = batch.itemIds.indexOf(activeId)
          const newIndex = batch.itemIds.indexOf(overId)
          if (oldIndex !== newIndex) {
            reorderItemsInBatch(targetBatchId, oldIndex, newIndex)
          }
        }
      } else {
        // Move to different batch
        const targetBatch = currentSession.batches.find((b) => b.id === targetBatchId)
        const targetIndex = targetBatch?.itemIds.indexOf(overId) ?? undefined
        moveItemBetweenBatches(activeId, sourceBatchId, targetBatchId, targetIndex)
      }
    }
  }, [currentSession, moveItemBetweenBatches, reorderItemsInBatch])

  const handleApplySuggestion = useCallback((batches: CookingBatch[]) => {
    applyBatchSuggestion(batches)
    setShowSuggestions(false)
    setSuggestions([])
  }, [applyBatchSuggestion])

  const handleDismissSuggestion = useCallback(() => {
    setShowSuggestions(false)
    setSuggestions([])
  }, [])

  const handleAddBatch = useCallback(() => {
    createBatch()
    setShowSuggestions(false)
    setSuggestions([])
  }, [createBatch])

  if (!currentSession) return null

  const unassignedItems = getUnassignedItems()
  const sortedBatches = [...currentSession.batches].sort((a, b) => a.order - b.order)
  const canOptimize = sortedBatches.length > 0 &&
    sortedBatches.some((b) => b.itemIds.length > 0)

  return (
    <div className="space-y-4">
      {/* Suggestions overlay */}
      {showSuggestions && suggestions.length > 0 && (
        <SuggestionsOverlay
          suggestions={suggestions}
          items={currentSession.items}
          onApply={handleApplySuggestion}
          onDismiss={handleDismissSuggestion}
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Unassigned Pool */}
        {unassignedItems.length > 0 && (
          <UnassignedPool items={unassignedItems} />
        )}

        {/* Batch Lanes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Batches
            </h3>
            <Button variant="outline" size="sm" onClick={handleAddBatch}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Batch
            </Button>
          </div>

          {sortedBatches.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Create batches to organize your cooking
                </p>
                <Button onClick={handleAddBatch}>
                  <Plus className="mr-1 h-4 w-4" />
                  Create First Batch
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {sortedBatches.map((batch) => {
                const batchItems = currentSession.items.filter(
                  (i) => i.batchId === batch.id
                )
                return (
                  <BatchLane
                    key={batch.id}
                    batch={batch}
                    items={batchItems}
                    onDelete={deleteBatch}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem && <DraggableItem item={activeItem} isOverlay />}
        </DragOverlay>
      </DndContext>

      {/* Timeline Preview */}
      {sortedBatches.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <TimelinePreview
              batches={sortedBatches}
              items={currentSession.items}
            />
          </CardContent>
        </Card>
      )}

      {/* Optimize Button */}
      {canOptimize && (
        <div className="flex justify-end pt-2">
          <Button onClick={optimizeSession}>
            Optimize & Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
