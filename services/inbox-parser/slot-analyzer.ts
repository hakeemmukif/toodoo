/**
 * Slot Analyzer
 *
 * Analyzes parsed inbox results to identify missing mandatory slots.
 * Determines if all required 5W1H information has been collected.
 */

import type { ParsedResult, SlotType, SlotStatus, SlotAnalysis } from '@/lib/types'

// Configuration for slot requirements
interface SlotRequirement {
  required: boolean
  minConfidence: number
  label: string
}

// All 5W1H slots are mandatory with 0.5 minimum confidence
const SLOT_REQUIREMENTS: Record<SlotType, SlotRequirement> = {
  what: { required: true, minConfidence: 0.5, label: 'Activity' },
  when: { required: true, minConfidence: 0.5, label: 'Time' },
  where: { required: true, minConfidence: 0.5, label: 'Location' },
  who: { required: true, minConfidence: 0.5, label: 'People' },
  why: { required: true, minConfidence: 0.5, label: 'Life Aspect' },
  duration: { required: false, minConfidence: 0.5, label: 'Duration' },
}

/**
 * Extract slot status from parsed result
 */
function getSlotStatus(parsed: ParsedResult, slot: SlotType): SlotStatus {
  const requirement = SLOT_REQUIREMENTS[slot]

  switch (slot) {
    case 'what': {
      const hasWhat = parsed.what !== null && parsed.what.confidence >= requirement.minConfidence
      return {
        slot: 'what',
        filled: hasWhat,
        confidence: parsed.what?.confidence ?? 0,
        value: parsed.what?.value,
        source: parsed.what?.source,
      }
    }

    case 'when': {
      // WHEN is filled if we have date OR time OR timePreference
      const hasDate = parsed.when?.date !== undefined && parsed.when.date.confidence >= requirement.minConfidence
      const hasTime = parsed.when?.time !== undefined && parsed.when.time.confidence >= requirement.minConfidence
      const hasTimePreference = parsed.when?.timePreference !== undefined && parsed.when.timePreference.confidence >= requirement.minConfidence
      const filled = hasDate || hasTime || hasTimePreference

      // Calculate best confidence from available time info
      const confidences = [
        parsed.when?.date?.confidence ?? 0,
        parsed.when?.time?.confidence ?? 0,
        parsed.when?.timePreference?.confidence ?? 0,
      ]
      const maxConfidence = Math.max(...confidences)

      // Build value string
      let value: string | undefined
      if (parsed.when?.date?.value) {
        value = parsed.when.date.value
        if (parsed.when?.time?.value) {
          value += ` at ${parsed.when.time.value}`
        } else if (parsed.when?.timePreference?.value) {
          value += ` (${parsed.when.timePreference.value})`
        }
      } else if (parsed.when?.time?.value) {
        value = `at ${parsed.when.time.value}`
      } else if (parsed.when?.timePreference?.value) {
        value = parsed.when.timePreference.value
      }

      return {
        slot: 'when',
        filled,
        confidence: maxConfidence,
        value,
        source: parsed.when?.date?.source ?? parsed.when?.time?.source ?? parsed.when?.timePreference?.source,
      }
    }

    case 'where': {
      const hasWhere = parsed.where !== null && parsed.where.confidence >= requirement.minConfidence
      return {
        slot: 'where',
        filled: hasWhere,
        confidence: parsed.where?.confidence ?? 0,
        value: parsed.where?.value,
        source: parsed.where?.source,
      }
    }

    case 'who': {
      const hasWho = parsed.who !== null && parsed.who.confidence >= requirement.minConfidence
      return {
        slot: 'who',
        filled: hasWho,
        confidence: parsed.who?.confidence ?? 0,
        value: parsed.who?.value,
        source: parsed.who?.source,
      }
    }

    case 'why': {
      // WHY maps to intent/aspect
      const hasWhy = parsed.intent !== null && parsed.intent.confidence >= requirement.minConfidence
      return {
        slot: 'why',
        filled: hasWhy,
        confidence: parsed.intent?.confidence ?? 0,
        value: parsed.intent?.value,
        source: parsed.intent?.source,
      }
    }

    case 'duration': {
      const hasDuration = parsed.duration !== null && parsed.duration.confidence >= requirement.minConfidence
      return {
        slot: 'duration',
        filled: hasDuration,
        confidence: parsed.duration?.confidence ?? 0,
        value: parsed.duration?.value,
        source: parsed.duration?.source,
      }
    }

    default:
      return {
        slot,
        filled: false,
        confidence: 0,
      }
  }
}

/**
 * Analyze parsed result for missing slots
 */
export function analyzeSlots(parsed: ParsedResult): SlotAnalysis {
  const slots: SlotStatus[] = []
  const missingRequired: SlotType[] = []

  // Analyze each slot
  for (const slotType of Object.keys(SLOT_REQUIREMENTS) as SlotType[]) {
    const status = getSlotStatus(parsed, slotType)
    slots.push(status)

    // Check if required slot is missing
    const requirement = SLOT_REQUIREMENTS[slotType]
    if (requirement.required && !status.filled) {
      missingRequired.push(slotType)
    }
  }

  // Calculate completeness (only for required slots)
  const requiredSlots = slots.filter(s => SLOT_REQUIREMENTS[s.slot].required)
  const filledRequired = requiredSlots.filter(s => s.filled).length
  const completeness = requiredSlots.length > 0 ? filledRequired / requiredSlots.length : 0

  // Can proceed only if all required slots are filled
  const canProceed = missingRequired.length === 0

  return {
    slots,
    missingRequired,
    completeness,
    canProceed,
  }
}

/**
 * Check if item can be created based on slot analysis
 */
export function canCreateItem(analysis: SlotAnalysis): boolean {
  return analysis.canProceed
}

/**
 * Get human-readable label for a slot type
 */
export function getSlotLabel(slot: SlotType): string {
  return SLOT_REQUIREMENTS[slot].label
}

/**
 * Check if a specific slot is required
 */
export function isSlotRequired(slot: SlotType): boolean {
  return SLOT_REQUIREMENTS[slot].required
}

/**
 * Get all slot types in order of importance
 */
export function getSlotPriority(): SlotType[] {
  return ['what', 'when', 'where', 'who', 'why', 'duration']
}

/**
 * Get summary of what's filled and missing
 */
export function getSlotSummary(analysis: SlotAnalysis): {
  filled: { slot: SlotType; value: string | number }[]
  missing: SlotType[]
} {
  const filled = analysis.slots
    .filter(s => s.filled && s.value !== undefined)
    .map(s => ({ slot: s.slot, value: s.value! }))

  return {
    filled,
    missing: analysis.missingRequired,
  }
}
