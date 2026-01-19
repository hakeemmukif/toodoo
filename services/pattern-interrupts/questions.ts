/**
 * Question bank for pattern interrupts.
 * These questions are designed to break autopilot behavior
 * and prompt reflection on alignment with vision.
 */

export const INTERRUPT_QUESTIONS = [
  "What am I avoiding right now by doing what I'm doing?",
  "Am I moving toward the life I hate or the life I want?",
  "What did I do today out of identity protection rather than genuine desire?",
  "If this moment repeated forever, would I be okay with it?",
  "What would future-me think about how I'm spending this hour?",
  "Is this the most important thing I could be doing right now?",
  "What's one thing I'm tolerating that I shouldn't be?",
  "What identity am I reinforcing with my current behavior?",
  "Would the person I'm becoming do what I'm about to do?",
  "Am I giving energy to what matters, or draining it on what doesn't?",
  "What's one thing that would make today feel successful?",
] as const

/**
 * Get a random question from the bank.
 * Optionally exclude recently used questions.
 */
export function getRandomQuestion(excludeQuestions?: string[]): string {
  const available = excludeQuestions
    ? INTERRUPT_QUESTIONS.filter((q) => !excludeQuestions.includes(q))
    : [...INTERRUPT_QUESTIONS]

  if (available.length === 0) {
    // If all excluded, return a random one anyway
    return INTERRUPT_QUESTIONS[Math.floor(Math.random() * INTERRUPT_QUESTIONS.length)]
  }

  return available[Math.floor(Math.random() * available.length)]
}

/**
 * Get multiple unique questions.
 */
export function getRandomQuestions(count: number): string[] {
  const shuffled = [...INTERRUPT_QUESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
