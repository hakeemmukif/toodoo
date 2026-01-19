import type { ExcavationPrompt, ExcavationTheme } from '@/lib/types'

// Map day of week (0 = Sunday) to excavation theme
export const DAY_TO_THEME: Record<number, ExcavationTheme> = {
  0: 'synthesis',    // Sunday: What pattern do you notice?
  1: 'direction',    // Monday: What's the ONE thing this week?
  2: 'anti-vision',  // Tuesday: What behavior would future-you regret?
  3: 'identity',     // Wednesday: What did you do that the old you wouldn't?
  4: 'resistance',   // Thursday: What are you avoiding?
  5: 'vision',       // Friday: How do you want to feel by Sunday?
  6: 'constraints',  // Saturday: Did you break your own rules?
}

export const THEME_LABELS: Record<ExcavationTheme, string> = {
  direction: 'Direction',
  'anti-vision': 'Anti-Vision',
  identity: 'Identity',
  resistance: 'Resistance',
  vision: 'Vision',
  constraints: 'Constraints',
  synthesis: 'Synthesis',
}

// Prompts organized by theme - each day has 3-5 questions (2-3 min total)
export const EXCAVATION_PROMPTS: Record<ExcavationTheme, ExcavationPrompt[]> = {
  // Monday: Direction - Setting intention for the week
  direction: [
    {
      id: 'dir-1',
      theme: 'direction',
      order: 1,
      question: "What's the ONE thing that would make this week successful?",
      placeholder: "The single most important outcome...",
      isRequired: true,
      minLength: 10,
    },
    {
      id: 'dir-2',
      theme: 'direction',
      order: 2,
      question: "What's likely to get in the way? How will you handle it?",
      placeholder: "Anticipate the obstacle...",
      isRequired: true,
    },
    {
      id: 'dir-3',
      theme: 'direction',
      order: 3,
      question: "What will you say no to this week to protect your focus?",
      placeholder: "The things you'll decline...",
      isRequired: false,
    },
  ],

  // Tuesday: Anti-Vision - Confronting the life to avoid
  'anti-vision': [
    {
      id: 'av-1',
      theme: 'anti-vision',
      order: 1,
      question: "What did you do yesterday that your future self would regret?",
      placeholder: "Be honest with yourself...",
      isRequired: true,
    },
    {
      id: 'av-2',
      theme: 'anti-vision',
      order: 2,
      question: "If you repeated yesterday's behavior for 10 years, where would you end up?",
      placeholder: "Project forward...",
      isRequired: true,
      minLength: 20,
    },
    {
      id: 'av-3',
      theme: 'anti-vision',
      order: 3,
      question: "What's one small change that would move you away from that future?",
      placeholder: "A concrete action...",
      isRequired: true,
    },
  ],

  // Wednesday: Identity - Reinforcing the person you're becoming
  identity: [
    {
      id: 'id-1',
      theme: 'identity',
      order: 1,
      question: "What did you do recently that the old you wouldn't have done?",
      placeholder: "Evidence of change...",
      isRequired: true,
    },
    {
      id: 'id-2',
      theme: 'identity',
      order: 2,
      question: "What identity are you reinforcing with your daily choices?",
      placeholder: "The person your actions are creating...",
      isRequired: true,
    },
    {
      id: 'id-3',
      theme: 'identity',
      order: 3,
      question: "Complete: 'I am becoming someone who...'",
      placeholder: "I am becoming someone who...",
      isRequired: true,
      minLength: 10,
    },
  ],

  // Thursday: Resistance - Surfacing what you're avoiding
  resistance: [
    {
      id: 'res-1',
      theme: 'resistance',
      order: 1,
      question: "What have you been avoiding this week?",
      placeholder: "The task, conversation, or decision...",
      isRequired: true,
    },
    {
      id: 'res-2',
      theme: 'resistance',
      order: 2,
      question: "What are you afraid will happen if you do it?",
      placeholder: "The underlying fear...",
      isRequired: true,
    },
    {
      id: 'res-3',
      theme: 'resistance',
      order: 3,
      question: "What's the smallest version of this you could do today?",
      placeholder: "A 5-minute version...",
      isRequired: true,
    },
  ],

  // Friday: Vision - Connecting to the life you're building
  vision: [
    {
      id: 'vis-1',
      theme: 'vision',
      order: 1,
      question: "How do you want to feel by Sunday night?",
      placeholder: "The emotional state you're aiming for...",
      isRequired: true,
    },
    {
      id: 'vis-2',
      theme: 'vision',
      order: 2,
      question: "What would make you proud of how you spent this weekend?",
      placeholder: "What matters to you...",
      isRequired: true,
    },
    {
      id: 'vis-3',
      theme: 'vision',
      order: 3,
      question: "What's one thing you could do this weekend that future-you would thank you for?",
      placeholder: "An investment in your future...",
      isRequired: false,
    },
  ],

  // Saturday: Constraints - Checking your rules
  constraints: [
    {
      id: 'con-1',
      theme: 'constraints',
      order: 1,
      question: "Did you break any of your own rules this week? Which ones?",
      placeholder: "Be specific...",
      isRequired: true,
    },
    {
      id: 'con-2',
      theme: 'constraints',
      order: 2,
      question: "What boundary do you need to reinforce?",
      placeholder: "The line you need to hold...",
      isRequired: true,
    },
    {
      id: 'con-3',
      theme: 'constraints',
      order: 3,
      question: "What's one rule you want to add or strengthen?",
      placeholder: "A new constraint or boundary...",
      isRequired: false,
    },
  ],

  // Sunday: Synthesis - Seeing patterns and preparing for next week
  synthesis: [
    {
      id: 'syn-1',
      theme: 'synthesis',
      order: 1,
      question: "What pattern do you notice in your week?",
      placeholder: "Recurring themes or behaviors...",
      isRequired: true,
    },
    {
      id: 'syn-2',
      theme: 'synthesis',
      order: 2,
      question: "What worked well that you want to repeat?",
      placeholder: "Keep doing...",
      isRequired: true,
    },
    {
      id: 'syn-3',
      theme: 'synthesis',
      order: 3,
      question: "What's one insight from this week you don't want to forget?",
      placeholder: "The key takeaway...",
      isRequired: true,
      minLength: 10,
    },
  ],
}

/**
 * Get the excavation theme for a given date
 */
export function getThemeForDate(date: Date): ExcavationTheme {
  const dayOfWeek = date.getDay()
  return DAY_TO_THEME[dayOfWeek]
}

/**
 * Get prompts for a given theme
 */
export function getPromptsForTheme(theme: ExcavationTheme): ExcavationPrompt[] {
  return EXCAVATION_PROMPTS[theme]
}

/**
 * Get prompts for today
 */
export function getTodaysPrompts(): ExcavationPrompt[] {
  const theme = getThemeForDate(new Date())
  return getPromptsForTheme(theme)
}

/**
 * Get the total number of prompts for a theme
 */
export function getTotalPromptsForTheme(theme: ExcavationTheme): number {
  return EXCAVATION_PROMPTS[theme].length
}

/**
 * Get the label for a theme (for UI display)
 */
export function getThemeLabel(theme: ExcavationTheme): string {
  return THEME_LABELS[theme]
}
