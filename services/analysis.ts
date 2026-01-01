import Sentiment from "sentiment"
import type { LifeAspect, GoalAlignment, YearlyGoal } from "@/lib/types"
import { db } from "@/db"

const sentiment = new Sentiment()

// Keyword dictionaries for aspect detection
const aspectKeywords: Record<LifeAspect, string[]> = {
  fitness: [
    "training",
    "muay thai",
    "gym",
    "run",
    "workout",
    "exercise",
    "sore",
    "tired",
    "cardio",
    "strength",
    "stretch",
    "yoga",
    "sparring",
    "boxing",
    "kickboxing",
    "martial arts",
    "weight",
    "lift",
    "muscles",
    "endurance",
    "stamina",
    "fitness",
    "physical",
    "body",
    "health",
    "recovery",
    "rest day",
  ],
  nutrition: [
    "cook",
    "meal",
    "food",
    "recipe",
    "ate",
    "grabfood",
    "ordered",
    "hungry",
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "protein",
    "carbs",
    "calories",
    "diet",
    "eating",
    "kitchen",
    "prep",
    "vegetables",
    "healthy",
    "junk food",
    "restaurant",
    "delivery",
    "nutrition",
    "macro",
  ],
  career: [
    "work",
    "meeting",
    "project",
    "deadline",
    "promotion",
    "skill",
    "paywatch",
    "job",
    "office",
    "boss",
    "colleague",
    "team",
    "client",
    "presentation",
    "interview",
    "resume",
    "portfolio",
    "professional",
    "career",
    "salary",
    "raise",
    "performance",
    "review",
    "learning",
    "course",
    "certification",
  ],
  financial: [
    "money",
    "savings",
    "invest",
    "budget",
    "expense",
    "salary",
    "spend",
    "bank",
    "account",
    "stocks",
    "crypto",
    "debt",
    "loan",
    "credit",
    "income",
    "passive",
    "dividends",
    "retirement",
    "emergency fund",
    "financial",
    "wealth",
    "net worth",
    "bills",
    "payment",
  ],
  "side-projects": [
    "dj",
    "music",
    "rekordbox",
    "mixing",
    "project",
    "hobby",
    "side hustle",
    "startup",
    "app",
    "build",
    "create",
    "develop",
    "code",
    "programming",
    "design",
    "creative",
    "art",
    "blog",
    "youtube",
    "content",
    "podcast",
    "writing",
    "personal project",
    "mvp",
    "launch",
  ],
  chores: [
    "clean",
    "fix",
    "errands",
    "laundry",
    "bills",
    "appointment",
    "grocery",
    "shopping",
    "maintenance",
    "repair",
    "organize",
    "tidy",
    "vacuum",
    "mop",
    "dishes",
    "trash",
    "recycle",
    "car",
    "house",
    "apartment",
    "admin",
    "paperwork",
    "dentist",
    "doctor",
  ],
}

/**
 * Analyze sentiment of text using the sentiment npm package
 * Returns a score from -1 to 1
 */
export function analyzeSentiment(text: string): number {
  const result = sentiment.analyze(text)
  // Normalize the comparative score to -1 to 1 range
  // The comparative score is typically between -5 and 5
  const normalized = Math.max(-1, Math.min(1, result.comparative))
  return Number(normalized.toFixed(2))
}

/**
 * Detect which life aspects are mentioned in the text
 */
export function detectAspects(text: string): LifeAspect[] {
  const lowerText = text.toLowerCase()
  const detectedAspects: LifeAspect[] = []

  for (const [aspect, keywords] of Object.entries(aspectKeywords)) {
    const hasMatch = keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()))
    if (hasMatch) {
      detectedAspects.push(aspect as LifeAspect)
    }
  }

  return detectedAspects
}

/**
 * Determine goal alignment based on content and sentiment
 */
export async function determineGoalAlignment(
  content: string,
  sentimentScore: number
): Promise<GoalAlignment> {
  // Get active yearly goals
  const goals = await db.yearlyGoals.where("status").equals("active").toArray()

  if (goals.length === 0) {
    return "neutral"
  }

  const lowerContent = content.toLowerCase()

  // Check for negative behaviors that work against goals
  const driftIndicators = [
    "skipped",
    "missed",
    "didn't",
    "failed",
    "gave up",
    "quit",
    "lazy",
    "procrastinate",
    "ordered food",
    "junk food",
    "didn't train",
    "didn't workout",
    "spent too much",
    "wasted",
    "overslept",
  ]

  const hasDriftIndicators = driftIndicators.some((indicator) =>
    lowerContent.includes(indicator)
  )

  // Check for positive progress indicators
  const progressIndicators = [
    "completed",
    "finished",
    "achieved",
    "progress",
    "improved",
    "success",
    "trained",
    "worked out",
    "cooked",
    "saved",
    "learned",
    "practiced",
    "consistent",
    "streak",
    "milestone",
  ]

  const hasProgressIndicators = progressIndicators.some((indicator) =>
    lowerContent.includes(indicator)
  )

  // Determine alignment
  if (hasDriftIndicators && sentimentScore < 0) {
    return "drift"
  }

  if (hasProgressIndicators && sentimentScore > 0) {
    return "positive"
  }

  if (sentimentScore < -0.3) {
    return "negative"
  }

  if (sentimentScore > 0.3) {
    return "positive"
  }

  return "neutral"
}

/**
 * Generate pattern observations from data
 */
export function generatePatterns(
  tasks: { status: string; aspect: LifeAspect }[],
  journals: { sentimentScore: number; detectedAspects: LifeAspect[] }[],
  trainingSessions: { date: string }[],
  meals: { cooked: boolean }[]
): string[] {
  const patterns: string[] = []

  // Task completion patterns
  const completedTasks = tasks.filter((t) => t.status === "done").length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  if (completionRate > 80) {
    patterns.push("Strong task completion rate this week")
  } else if (completionRate < 50) {
    patterns.push("Task completion rate needs improvement")
  }

  // Sentiment patterns
  const avgSentiment =
    journals.length > 0
      ? journals.reduce((sum, j) => sum + j.sentimentScore, 0) / journals.length
      : 0

  if (avgSentiment > 0.3) {
    patterns.push("Positive sentiment trend in journal entries")
  } else if (avgSentiment < -0.3) {
    patterns.push("Journal entries show signs of stress or frustration")
  }

  // Training consistency
  if (trainingSessions.length >= 4) {
    patterns.push("Maintaining good training frequency")
  } else if (trainingSessions.length === 0) {
    patterns.push("No training sessions logged this week")
  }

  // Cooking ratio
  const cookedMeals = meals.filter((m) => m.cooked).length
  const cookingRatio = meals.length > 0 ? (cookedMeals / meals.length) * 100 : 0

  if (cookingRatio >= 80) {
    patterns.push("Excellent home cooking ratio")
  } else if (cookingRatio < 50) {
    patterns.push("Ordering out more than cooking - consider meal prep")
  }

  // Cross-aspect patterns
  const negativeFitness = journals.some(
    (j) => j.detectedAspects.includes("fitness") && j.sentimentScore < -0.2
  )
  if (negativeFitness) {
    patterns.push("Some frustration detected around fitness activities")
  }

  return patterns
}

/**
 * Get sentiment label from score
 */
export function getSentimentLabel(score: number): "positive" | "neutral" | "negative" {
  if (score > 0.2) return "positive"
  if (score < -0.2) return "negative"
  return "neutral"
}

/**
 * Get sentiment color for UI
 */
export function getSentimentColor(score: number): string {
  if (score > 0.2) return "#22c55e" // green
  if (score < -0.2) return "#ef4444" // red
  return "#64748b" // gray
}
