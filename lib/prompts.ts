import type { JournalPrompt, PromptCategory } from "./types"

// Journal prompts - categories are internal only, never shown to user
export const JOURNAL_PROMPTS: JournalPrompt[] = [
  // === ENERGY/SLEEP (Morning) ===
  {
    id: "energy-1",
    category: "energy",
    prompt: "How did you sleep? How's your energy today?",
    frequency: "daily",
  },
  {
    id: "energy-2",
    category: "energy",
    prompt: "Energy check: 1-5, what's affecting it?",
    frequency: "daily",
  },

  // === RESISTANCE (Daily) ===
  {
    id: "resistance-1",
    category: "resistance",
    prompt: "What did I avoid today?",
    frequency: "daily",
  },
  {
    id: "resistance-2",
    category: "resistance",
    prompt: "Where did I half-ass it when I could've gone all in?",
    frequency: "daily",
  },
  {
    id: "resistance-3",
    category: "resistance",
    prompt: "What was I avoiding, and did I face it?",
    frequency: "daily",
  },

  // === CONSISTENCY (Daily) ===
  {
    id: "consistency-1",
    category: "consistency",
    prompt: "What's one thing I could make slightly easier tomorrow?",
    frequency: "daily",
  },
  {
    id: "consistency-2",
    category: "consistency",
    prompt: "Did I show up today, even if imperfectly?",
    frequency: "daily",
  },
  {
    id: "consistency-3",
    category: "consistency",
    prompt: "What environment change would help me?",
    frequency: "daily",
  },
  {
    id: "consistency-4",
    category: "consistency",
    prompt: "Who am I becoming through today's actions?",
    frequency: "daily",
  },

  // === FOCUS (Daily) ===
  {
    id: "focus-1",
    category: "focus",
    prompt: "How many hours of real, focused work did I do?",
    frequency: "daily",
  },
  {
    id: "focus-2",
    category: "focus",
    prompt: "What broke my concentration today?",
    frequency: "daily",
  },
  {
    id: "focus-3",
    category: "focus",
    prompt: "Did I protect my focus time?",
    frequency: "daily",
  },

  // === HONESTY (Daily) ===
  {
    id: "honesty-1",
    category: "honesty",
    prompt: "What hard thing did I do today?",
    frequency: "daily",
  },
  {
    id: "honesty-2",
    category: "honesty",
    prompt: "Where did I take the easy path?",
    frequency: "daily",
  },
  {
    id: "honesty-3",
    category: "honesty",
    prompt: "Am I being honest with myself about my effort?",
    frequency: "daily",
  },

  // === CLARITY (Daily) ===
  {
    id: "clarity-1",
    category: "clarity",
    prompt: "What's still in my head that needs to be written down?",
    frequency: "daily",
  },
  {
    id: "clarity-2",
    category: "clarity",
    prompt: "What open loops are draining my energy?",
    frequency: "daily",
  },

  // === PRIORITY (Weekly) ===
  {
    id: "priority-1",
    category: "priority",
    prompt: "What should I have said no to this week?",
    frequency: "weekly",
  },
  {
    id: "priority-2",
    category: "priority",
    prompt: "What's the ONE thing that matters most right now?",
    frequency: "weekly",
  },
  {
    id: "priority-3",
    category: "priority",
    prompt: "What am I doing that doesn't actually matter?",
    frequency: "weekly",
  },

  // === PROGRESS (Weekly) ===
  {
    id: "progress-1",
    category: "progress",
    prompt: "What small actions am I stacking up?",
    frequency: "weekly",
  },
  {
    id: "progress-2",
    category: "progress",
    prompt: "Where am I being inconsistent?",
    frequency: "weekly",
  },

  // === HONESTY (Weekly) ===
  {
    id: "honesty-weekly-1",
    category: "honesty",
    prompt: "Rate my week honestly, 1-10. Why?",
    frequency: "weekly",
  },
  {
    id: "honesty-weekly-2",
    category: "honesty",
    prompt: "What uncomfortable truth am I avoiding?",
    frequency: "weekly",
  },

  // === QUARTERLY ===
  {
    id: "priority-quarterly-1",
    category: "priority",
    prompt: "What should I stop doing entirely?",
    frequency: "quarterly",
  },
  {
    id: "priority-quarterly-2",
    category: "priority",
    prompt: "Are my priorities still the right priorities?",
    frequency: "quarterly",
  },
  {
    id: "honesty-quarterly-1",
    category: "honesty",
    prompt: "Am I proud of who I'm becoming?",
    frequency: "quarterly",
  },

  // === GENERAL ===
  {
    id: "general-1",
    category: "general",
    prompt: "What's on your mind?",
    frequency: "daily",
  },
  {
    id: "general-2",
    category: "general",
    prompt: "How are you feeling right now?",
    frequency: "daily",
  },
]

// Get prompts by category
export function getPromptsByCategory(category: PromptCategory): JournalPrompt[] {
  return JOURNAL_PROMPTS.filter((p) => p.category === category)
}

// Get prompts by frequency
export function getPromptsByFrequency(frequency: JournalPrompt["frequency"]): JournalPrompt[] {
  return JOURNAL_PROMPTS.filter((p) => p.frequency === frequency)
}

// Get daily prompts
export function getDailyPrompts(): JournalPrompt[] {
  return getPromptsByFrequency("daily")
}

// Get weekly prompts
export function getWeeklyPrompts(): JournalPrompt[] {
  return getPromptsByFrequency("weekly")
}

// Get a random prompt from eligible ones
export function getRandomPrompt(
  preferredCategories: PromptCategory[] = [],
  recentPromptIds: string[] = [],
  frequency: JournalPrompt["frequency"] = "daily"
): JournalPrompt | null {
  let eligible = JOURNAL_PROMPTS.filter((p) => p.frequency === frequency)

  // Filter by preferred categories if set
  if (preferredCategories.length > 0) {
    eligible = eligible.filter((p) => preferredCategories.includes(p.category))
  }

  // Exclude recent prompts (last 5)
  const recentSet = new Set(recentPromptIds.slice(0, 5))
  eligible = eligible.filter((p) => !recentSet.has(p.id))

  // If no eligible prompts, fall back to all prompts of that frequency
  if (eligible.length === 0) {
    eligible = JOURNAL_PROMPTS.filter((p) => p.frequency === frequency)
  }

  if (eligible.length === 0) {
    return null
  }

  return eligible[Math.floor(Math.random() * eligible.length)]
}

// Get prompt by ID
export function getPromptById(id: string): JournalPrompt | undefined {
  return JOURNAL_PROMPTS.find((p) => p.id === id)
}
