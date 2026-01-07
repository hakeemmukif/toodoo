/**
 * Deep Prompts
 *
 * Aspect-specific questions that gather context BEFORE generating breakdown.
 * Uses selection-based UI to minimize typing friction.
 */

import type { DeepPromptQuestion, LifeAspect } from "@/lib/types"

// Questions per aspect - asked FIRST before breakdown generation
export const DEEP_PROMPT_QUESTIONS: Record<LifeAspect, DeepPromptQuestion[]> = {
  fitness: [
    {
      id: "fitness-session-type",
      aspect: "fitness",
      questionKey: "session_type",
      question: "Session type?",
      options: [
        { value: "technique", label: "Technique", icon: "Target", defaultDuration: 90 },
        { value: "heavy-bag", label: "Heavy Bag", icon: "Flame", defaultDuration: 60 },
        { value: "sparring", label: "Sparring", icon: "Swords", defaultDuration: 90 },
        { value: "conditioning", label: "Conditioning", icon: "Zap", defaultDuration: 45 },
        { value: "pads", label: "Pads", icon: "Shield", defaultDuration: 60 },
        { value: "strength", label: "Strength", icon: "Dumbbell", defaultDuration: 60 },
        { value: "cardio", label: "Cardio", icon: "Heart", defaultDuration: 45 },
        { value: "flexibility", label: "Flexibility", icon: "Accessibility", defaultDuration: 30 },
      ],
      required: true,
      order: 1,
    },
    {
      id: "fitness-duration",
      aspect: "fitness",
      questionKey: "duration",
      question: "Duration?",
      options: [
        { value: "30", label: "30 min", defaultDuration: 30 },
        { value: "45", label: "45 min", defaultDuration: 45 },
        { value: "60", label: "1 hour", defaultDuration: 60 },
        { value: "90", label: "1.5 hours", defaultDuration: 90 },
        { value: "120", label: "2 hours", defaultDuration: 120 },
      ],
      required: true,
      order: 2,
    },
    {
      id: "fitness-intensity",
      aspect: "fitness",
      questionKey: "intensity",
      question: "Intensity level?",
      options: [
        { value: "light", label: "Light / Recovery" },
        { value: "moderate", label: "Moderate" },
        { value: "hard", label: "Hard Push" },
        { value: "competition", label: "Competition Prep" },
      ],
      required: false,
      order: 3,
    },
  ],

  nutrition: [
    {
      id: "nutrition-meal-type",
      aspect: "nutrition",
      questionKey: "meal_type",
      question: "What type?",
      options: [
        { value: "quick", label: "Quick meal", icon: "Zap", defaultDuration: 30 },
        { value: "full-recipe", label: "Full recipe", icon: "ChefHat", defaultDuration: 60 },
        { value: "meal-prep", label: "Meal prep", icon: "Package", defaultDuration: 120 },
        { value: "baking", label: "Baking", icon: "Cake", defaultDuration: 90 },
      ],
      required: true,
      order: 1,
    },
    {
      id: "nutrition-complexity",
      aspect: "nutrition",
      questionKey: "complexity",
      question: "Complexity?",
      options: [
        { value: "simple", label: "Simple (<30min)", defaultDuration: 30 },
        { value: "medium", label: "Medium (30-60min)", defaultDuration: 45 },
        { value: "complex", label: "Complex (>1hr)", defaultDuration: 90 },
      ],
      required: true,
      order: 2,
    },
    {
      id: "nutrition-servings",
      aspect: "nutrition",
      questionKey: "servings",
      question: "How many servings?",
      options: [
        { value: "1", label: "Just me" },
        { value: "2", label: "For two" },
        { value: "4", label: "Family (4+)" },
        { value: "batch", label: "Batch cooking" },
      ],
      required: false,
      order: 3,
    },
  ],

  career: [
    {
      id: "career-work-type",
      aspect: "career",
      questionKey: "work_type",
      question: "Work type?",
      options: [
        { value: "deep-work", label: "Deep work / Coding", icon: "Brain", defaultDuration: 120 },
        { value: "meeting", label: "Meeting", icon: "Users", defaultDuration: 60 },
        { value: "review", label: "Review / Feedback", icon: "CheckSquare", defaultDuration: 30 },
        { value: "planning", label: "Planning", icon: "Map", defaultDuration: 45 },
        { value: "communication", label: "Emails / Slack", icon: "MessageSquare", defaultDuration: 30 },
        { value: "learning", label: "Learning / Research", icon: "BookOpen", defaultDuration: 60 },
      ],
      required: true,
      order: 1,
    },
    {
      id: "career-focus-level",
      aspect: "career",
      questionKey: "focus_level",
      question: "Focus needed?",
      options: [
        { value: "deep", label: "Deep focus (no interruptions)" },
        { value: "moderate", label: "Moderate focus" },
        { value: "shallow", label: "Can multitask" },
      ],
      required: false,
      order: 2,
    },
  ],

  financial: [
    {
      id: "financial-task-type",
      aspect: "financial",
      questionKey: "task_type",
      question: "What kind?",
      options: [
        { value: "review", label: "Review accounts", icon: "Eye", defaultDuration: 30 },
        { value: "transfer", label: "Transfer / Pay bills", icon: "ArrowRightLeft", defaultDuration: 15 },
        { value: "budget", label: "Budget review", icon: "Calculator", defaultDuration: 45 },
        { value: "investment", label: "Investment check", icon: "TrendingUp", defaultDuration: 30 },
        { value: "planning", label: "Financial planning", icon: "Target", defaultDuration: 60 },
      ],
      required: true,
      order: 1,
    },
  ],

  "side-projects": [
    {
      id: "side-project-type",
      aspect: "side-projects",
      questionKey: "project_type",
      question: "Activity type?",
      options: [
        { value: "dj-practice", label: "DJ Practice", icon: "Music", defaultDuration: 120 },
        { value: "music-production", label: "Music Production", icon: "AudioWaveform", defaultDuration: 90 },
        { value: "coding", label: "Personal Coding", icon: "Code", defaultDuration: 90 },
        { value: "creative", label: "Creative Work", icon: "Palette", defaultDuration: 60 },
        { value: "learning", label: "Learning New Skill", icon: "GraduationCap", defaultDuration: 60 },
      ],
      required: true,
      order: 1,
    },
    {
      id: "side-project-goal",
      aspect: "side-projects",
      questionKey: "session_goal",
      question: "Session goal?",
      options: [
        { value: "explore", label: "Explore / Play" },
        { value: "practice", label: "Deliberate practice" },
        { value: "create", label: "Create something" },
        { value: "finish", label: "Finish a project" },
      ],
      required: false,
      order: 2,
    },
  ],

  chores: [
    {
      id: "chores-type",
      aspect: "chores",
      questionKey: "chore_type",
      question: "What kind?",
      options: [
        { value: "cleaning", label: "Cleaning", icon: "Sparkles", defaultDuration: 45 },
        { value: "laundry", label: "Laundry", icon: "Shirt", defaultDuration: 60 },
        { value: "shopping", label: "Shopping / Errands", icon: "ShoppingCart", defaultDuration: 60 },
        { value: "organizing", label: "Organizing", icon: "LayoutGrid", defaultDuration: 45 },
        { value: "maintenance", label: "Home maintenance", icon: "Wrench", defaultDuration: 60 },
      ],
      required: true,
      order: 1,
    },
  ],
}

/**
 * Get questions for an aspect
 */
export function getQuestionsForAspect(aspect: LifeAspect): DeepPromptQuestion[] {
  return DEEP_PROMPT_QUESTIONS[aspect] || []
}

/**
 * Get only required questions for an aspect
 */
export function getRequiredQuestionsForAspect(aspect: LifeAspect): DeepPromptQuestion[] {
  return getQuestionsForAspect(aspect).filter((q) => q.required)
}

/**
 * Get default duration based on answers
 */
export function inferDurationFromAnswers(
  aspect: LifeAspect,
  answers: Record<string, string>
): number {
  const questions = DEEP_PROMPT_QUESTIONS[aspect]

  // Check duration question first (explicit choice)
  if (answers.duration) {
    return parseInt(answers.duration, 10)
  }

  // Check first question for defaultDuration on selected option
  if (questions?.[0]) {
    const firstAnswerKey = questions[0].questionKey
    const firstAnswer = answers[firstAnswerKey]
    const selectedOption = questions[0].options.find((o) => o.value === firstAnswer)
    if (selectedOption?.defaultDuration) {
      return selectedOption.defaultDuration
    }
  }

  // Fallback defaults per aspect
  const aspectDefaults: Record<LifeAspect, number> = {
    fitness: 90,
    nutrition: 60,
    career: 60,
    financial: 30,
    "side-projects": 90,
    chores: 45,
  }

  return aspectDefaults[aspect] || 60
}

/**
 * Get the primary activity type from answers
 */
export function getPrimaryActivityType(
  aspect: LifeAspect,
  answers: Record<string, string>
): string | undefined {
  const questions = DEEP_PROMPT_QUESTIONS[aspect]
  if (!questions?.[0]) return undefined

  const firstKey = questions[0].questionKey
  return answers[firstKey]
}
