/**
 * Question Generator
 *
 * Generates contextual clarification questions for missing slots.
 * Uses Ollama for intelligent question generation with rule-based fallback.
 */

import type {
  ParsedResult,
  SlotType,
  SlotQuestion,
  ClarificationResult,
  SlotAnalysis,
  LifeAspect,
} from '@/lib/types'
import { checkOllamaConnection, queryOllama } from '@/services/ollama'
import { getSlotLabel } from './slot-analyzer'
import { ASPECT_CONFIG } from '@/lib/constants'

interface QuestionGenerationRequest {
  originalText: string
  parsed: ParsedResult
  analysis: SlotAnalysis
}

// Aspect options for WHY (life aspect) selection
const ASPECT_OPTIONS = Object.entries(ASPECT_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}))

// Rule-based question templates by slot type
const RULE_BASED_TEMPLATES: Record<SlotType, {
  question: string
  placeholder: string
  contextVariants?: Record<string, string>
}> = {
  what: {
    question: "What specifically will you do?",
    placeholder: "e.g., Sparring session, Team meeting, Cook dinner",
    contextVariants: {
      fitness: "What's the training focus?",
      nutrition: "What meal or food activity?",
      career: "What work task specifically?",
      'side-projects': "What project activity?",
      chores: "What chore needs doing?",
      financial: "What financial task?",
    },
  },
  when: {
    question: "When will you do this?",
    placeholder: "e.g., Today at 7pm, Tomorrow morning, Next Monday",
    contextVariants: {
      hasLocation: "What time at {location}?",
    },
  },
  where: {
    question: "Where will this happen?",
    placeholder: "e.g., Home, Bunker gym, Office",
    contextVariants: {
      fitness: "Which gym or training location?",
      nutrition: "Where will you cook/eat?",
      career: "Office, home, or meeting venue?",
    },
  },
  who: {
    question: "Who's involved?",
    placeholder: "e.g., Solo, With trainer, Team meeting",
    contextVariants: {
      fitness: "Training solo or with someone?",
      career: "Who's in this meeting/task?",
      default: "Just you, or with others?",
    },
  },
  why: {
    question: "What area of life is this for?",
    placeholder: "Select a life aspect",
  },
  duration: {
    question: "How long will this take?",
    placeholder: "e.g., 30 minutes, 1 hour, 2 hours",
  },
}

/**
 * Generate clarification questions for missing slots
 */
export async function generateClarificationQuestions(
  request: QuestionGenerationRequest
): Promise<ClarificationResult> {
  const { analysis } = request

  // No questions needed if all slots filled
  if (analysis.missingRequired.length === 0) {
    return {
      questions: [],
      generationMethod: 'rule',
    }
  }

  // Try AI-powered generation first
  const isOllamaConnected = await checkOllamaConnection()

  if (isOllamaConnected) {
    try {
      const aiResult = await generateQuestionsWithOllama(request)
      if (aiResult && aiResult.questions.length > 0) {
        return aiResult
      }
    } catch (error) {
      console.warn('Ollama question generation failed, falling back to rules:', error)
    }
  }

  // Fallback to rule-based generation
  return generateRuleBasedQuestions(request)
}

/**
 * Generate questions using Ollama
 */
async function generateQuestionsWithOllama(
  request: QuestionGenerationRequest
): Promise<ClarificationResult | null> {
  const { originalText, parsed, analysis } = request

  // Build context of what's already extracted
  const extractedContext = buildExtractedContext(parsed, analysis)
  const missingSlots = analysis.missingRequired.map(s => getSlotLabel(s)).join(', ')

  const prompt = `You are helping a user create a task from natural language input.

USER INPUT: "${originalText}"

ALREADY EXTRACTED:
${extractedContext || "Nothing extracted yet"}

MISSING REQUIRED INFORMATION: ${missingSlots}

Generate 1 short, natural question for each missing field. Questions should:
1. Be contextual - reference what's already known
2. Be conversational - not formal or robotic
3. Include a helpful example in parentheses
4. Be specific to the activity type if known

Respond in this exact JSON format:
{
  "questions": [
    {
      "slot": "what|when|where|who|why|duration",
      "question": "Your question here",
      "placeholder": "example answer"
    }
  ],
  "context": "Brief reasoning about the questions"
}

Only include questions for: ${analysis.missingRequired.join(', ')}`

  try {
    const response = await queryOllama(prompt)

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return null
    }

    const data = JSON.parse(jsonMatch[0])

    if (!data.questions || !Array.isArray(data.questions)) {
      return null
    }

    // Transform AI response to SlotQuestion format
    const questions: SlotQuestion[] = data.questions
      .filter((q: { slot?: string }) => analysis.missingRequired.includes(q.slot as SlotType))
      .map((q: { slot: SlotType; question: string; placeholder?: string }) => ({
        slot: q.slot,
        question: q.question,
        placeholder: q.placeholder || RULE_BASED_TEMPLATES[q.slot]?.placeholder,
        inputType: getInputTypeForSlot(q.slot),
        options: q.slot === 'why' ? ASPECT_OPTIONS : undefined,
        required: true,
        context: data.context,
      }))

    return {
      questions,
      generationMethod: 'ai',
      context: data.context,
    }
  } catch (error) {
    console.error('Failed to parse Ollama response:', error)
    return null
  }
}

/**
 * Generate questions using rule-based templates
 */
function generateRuleBasedQuestions(
  request: QuestionGenerationRequest
): ClarificationResult {
  const { parsed, analysis } = request
  const questions: SlotQuestion[] = []

  // Get detected aspect for context-aware questions
  // Only use aspect if confidence is high enough (not in missing slots)
  const aspectIsFilled = !analysis.missingRequired.includes('why')
  const detectedAspect = aspectIsFilled ? parsed.intent?.value : undefined
  const detectedLocation = parsed.where?.value

  for (const slot of analysis.missingRequired) {
    const template = RULE_BASED_TEMPLATES[slot]
    if (!template) continue

    let question = template.question
    let placeholder = template.placeholder

    // Apply context variants if available
    if (template.contextVariants) {
      // Check for location-aware time question
      if (slot === 'when' && detectedLocation && template.contextVariants.hasLocation) {
        question = template.contextVariants.hasLocation.replace('{location}', detectedLocation)
      }
      // Check for aspect-specific variants
      else if (detectedAspect && template.contextVariants[detectedAspect]) {
        question = template.contextVariants[detectedAspect]
      }
      // Check for default variant
      else if (template.contextVariants.default) {
        question = template.contextVariants.default
      }
    }

    questions.push({
      slot,
      question,
      placeholder,
      inputType: getInputTypeForSlot(slot),
      options: slot === 'why' ? ASPECT_OPTIONS : undefined,
      required: true,
    })
  }

  return {
    questions,
    generationMethod: 'rule',
  }
}

/**
 * Get appropriate input type for slot
 */
function getInputTypeForSlot(slot: SlotType): 'text' | 'select' | 'datetime' | 'number' {
  switch (slot) {
    case 'why':
      return 'select'
    case 'when':
      return 'datetime'
    case 'duration':
      return 'number'
    default:
      return 'text'
  }
}

/**
 * Build context string of already extracted information
 */
function buildExtractedContext(parsed: ParsedResult, analysis: SlotAnalysis): string {
  const lines: string[] = []

  for (const status of analysis.slots) {
    if (status.filled && status.value !== undefined) {
      const label = getSlotLabel(status.slot)
      let displayValue = String(status.value)

      // Format aspect to human-readable
      if (status.slot === 'why' && ASPECT_CONFIG[status.value as LifeAspect]) {
        displayValue = ASPECT_CONFIG[status.value as LifeAspect].label
      }

      lines.push(`- ${label}: ${displayValue}`)
    }
  }

  return lines.join('\n')
}

/**
 * Generate a single follow-up question for a specific slot
 */
export async function generateFollowUpQuestion(
  slot: SlotType,
  context: {
    originalText: string
    previousAnswer?: string
    parsed: ParsedResult
  }
): Promise<SlotQuestion | null> {
  const template = RULE_BASED_TEMPLATES[slot]
  if (!template) return null

  return {
    slot,
    question: template.question,
    placeholder: template.placeholder,
    inputType: getInputTypeForSlot(slot),
    options: slot === 'why' ? ASPECT_OPTIONS : undefined,
    required: true,
  }
}
