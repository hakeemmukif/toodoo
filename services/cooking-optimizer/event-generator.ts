import { generateId } from "@/db"
import type { PhaseEvent, PhaseEventType } from "@/lib/types"
import type { StaggeredItem } from "./stagger-calculator"

/**
 * Generate timeline events for a cooking phase
 * Events include: preheat, add items, shake reminders, remove items
 */
export function generatePhaseEvents(
  staggeredItems: StaggeredItem[],
  phaseTemperature: number
): PhaseEvent[] {
  const events: PhaseEvent[] = []

  // 1. Preheat event at the start
  events.push({
    id: generateId(),
    minuteOffset: 0,
    eventType: "preheat_start",
    instruction: `Preheat air fryer to ${phaseTemperature}C`,
    completed: false,
  })

  // 2. Add item events (when each item should go in)
  for (const item of staggeredItems) {
    events.push({
      id: generateId(),
      minuteOffset: item.startOffsetMinutes,
      eventType: "add_item",
      itemId: item.id,
      itemName: item.name,
      instruction: `Add ${item.name} to air fryer`,
      completed: false,
    })

    // 3. Shake reminder (halfway through cooking time, if enabled)
    if (item.shakeHalfway) {
      const shakeOffset = item.startOffsetMinutes + Math.floor(item.timeMinutes / 2)
      events.push({
        id: generateId(),
        minuteOffset: shakeOffset,
        eventType: "shake_reminder",
        itemId: item.id,
        itemName: item.name,
        instruction: `Shake/flip ${item.name}`,
        completed: false,
      })
    }

    // 4. Remove item event
    events.push({
      id: generateId(),
      minuteOffset: item.endOffsetMinutes,
      eventType: "remove_item",
      itemId: item.id,
      itemName: item.name,
      instruction: `Remove ${item.name} - it's done!`,
      completed: false,
    })
  }

  // Sort events by minute offset
  events.sort((a, b) => a.minuteOffset - b.minuteOffset)

  // 5. Add phase complete event at the very end
  const lastEventTime = Math.max(...events.map((e) => e.minuteOffset))
  events.push({
    id: generateId(),
    minuteOffset: lastEventTime,
    eventType: "phase_complete",
    instruction: "Phase complete! All items ready.",
    completed: false,
  })

  return events
}

/**
 * Merge events at the same minute offset into combined instructions
 * E.g., if two items need adding at the same time
 */
export function consolidateEvents(events: PhaseEvent[]): PhaseEvent[] {
  const byOffset = new Map<number, PhaseEvent[]>()

  for (const event of events) {
    const existing = byOffset.get(event.minuteOffset) || []
    existing.push(event)
    byOffset.set(event.minuteOffset, existing)
  }

  const consolidated: PhaseEvent[] = []

  for (const [offset, eventsAtOffset] of byOffset) {
    // Group by event type
    const byType = new Map<PhaseEventType, PhaseEvent[]>()
    for (const event of eventsAtOffset) {
      const existing = byType.get(event.eventType) || []
      existing.push(event)
      byType.set(event.eventType, existing)
    }

    for (const [eventType, typeEvents] of byType) {
      if (typeEvents.length === 1) {
        consolidated.push(typeEvents[0])
      } else {
        // Combine multiple events of same type at same time
        const names = typeEvents
          .filter((e) => e.itemName)
          .map((e) => e.itemName)
          .join(", ")

        let instruction: string
        switch (eventType) {
          case "add_item":
            instruction = `Add: ${names}`
            break
          case "remove_item":
            instruction = `Remove: ${names}`
            break
          case "shake_reminder":
            instruction = `Shake/flip: ${names}`
            break
          default:
            instruction = typeEvents[0].instruction
        }

        consolidated.push({
          id: generateId(),
          minuteOffset: offset,
          eventType,
          instruction,
          completed: false,
        })
      }
    }
  }

  return consolidated.sort((a, b) => a.minuteOffset - b.minuteOffset)
}

/**
 * Get human-readable description of an event
 */
export function getEventDescription(event: PhaseEvent): string {
  const time = formatTime(event.minuteOffset)
  return `${time} - ${event.instruction}`
}

function formatTime(minutes: number): string {
  const mins = Math.floor(minutes)
  const secs = Math.round((minutes - mins) * 60)
  if (secs === 0) {
    return `${mins}:00`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
