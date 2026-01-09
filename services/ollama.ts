import type { YearlyGoal, WeeklyStats, MonthlySummary, JournalEntry } from "@/lib/types"
import { db } from "@/db"

const DEFAULT_OLLAMA_URL = "http://localhost:11434"

/**
 * Get the Ollama URL from settings or use default
 */
async function getOllamaUrl(): Promise<string> {
  const settings = await db.appSettings.get("default")
  return settings?.ollamaUrl || DEFAULT_OLLAMA_URL
}

/**
 * Check if Ollama is connected and available
 */
export async function checkOllamaConnection(): Promise<boolean> {
  try {
    const baseUrl = await getOllamaUrl()
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get list of available models
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const baseUrl = await getOllamaUrl()
    const response = await fetch(`${baseUrl}/api/tags`)
    if (!response.ok) return []

    const data = await response.json()
    return data.models?.map((m: { name: string }) => m.name) || []
  } catch {
    return []
  }
}

/**
 * Query Ollama with a prompt
 */
export async function queryOllama(
  prompt: string,
  model: string = "mistral"
): Promise<string> {
  const baseUrl = await getOllamaUrl()

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to get response from Ollama")
  }

  const data = await response.json()
  return data.response
}

/**
 * Generate with Ollama with timeout and options support
 * This is a convenience wrapper around queryOllama for the sync services
 */
export async function generateWithOllama(
  prompt: string,
  options: { timeout?: number; model?: string } = {}
): Promise<string> {
  const { timeout = 30000, model = "mistral" } = options
  const baseUrl = await getOllamaUrl()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error("Failed to get response from Ollama")
    }

    const data = await response.json()
    return data.response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Analyze journal entry for goal alignment
 */
export async function analyzeJournalEntry(
  entry: string,
  goals: YearlyGoal[]
): Promise<string> {
  const goalsContext = goals
    .map((g) => `- ${g.aspect}: ${g.title} (${g.successCriteria})`)
    .join("\n")

  const prompt = `You are analyzing a personal journal entry for goal alignment.

Current goals:
${goalsContext}

Journal entry:
"${entry}"

Analyze whether this entry indicates:
1. Progress toward goals (positive)
2. Neutral content unrelated to goals
3. Behaviors that work against goals (drift)

Provide a brief analysis (2-3 sentences) and classify as: POSITIVE, NEUTRAL, or DRIFT.`

  return await queryOllama(prompt)
}

/**
 * Generate weekly actionable nudges
 */
export async function generateWeeklyNudges(
  stats: WeeklyStats,
  goals: YearlyGoal[]
): Promise<string> {
  const goalsContext = goals.map((g) => `- ${g.aspect}: ${g.title}`).join("\n")

  const statsContext = `
Weekly stats:
- Task completion: ${JSON.stringify(stats.aspectProgress)}
- Patterns observed: ${stats.patterns.join(", ")}
- Weekly goal progress: ${stats.weeklyGoalProgress.map((g) => `${g.title}: ${g.progress}%`).join(", ")}
`

  const prompt = `Based on this week's data, suggest 3 specific actionable nudges for next week.

${statsContext}

Goals:
${goalsContext}

Provide 3 brief, specific, actionable suggestions. Be encouraging but realistic.`

  return await queryOllama(prompt)
}

/**
 * Generate comprehensive monthly analysis
 */
export async function generateMonthlyAnalysis(
  summary: MonthlySummary,
  journals: JournalEntry[]
): Promise<string> {
  const journalContext = journals
    .map(
      (j) =>
        `- ${new Date(j.timestamp).toLocaleDateString()}: sentiment ${j.sentimentScore.toFixed(2)}, aspects: ${j.detectedAspects.join(", ")}`
    )
    .join("\n")

  const prompt = `Provide a comprehensive monthly review based on this data.

Monthly summary:
${JSON.stringify(summary, null, 2)}

Journal entries (sentiment and key themes):
${journalContext}

Analyze:
1. Overall progress and wins
2. Areas of concern or drift
3. Patterns in behavior and mood
4. Specific recommendations for next month

Keep the analysis personal, constructive, and actionable.`

  return await queryOllama(prompt)
}

/**
 * Generate AI insights for a specific aspect
 */
export async function generateAspectInsights(
  aspect: string,
  data: {
    goalProgress: number
    taskCompletion: number
    sentiment: number
    recentEntries: string[]
  }
): Promise<string> {
  const prompt = `Analyze the ${aspect} aspect of this person's life based on the following data:

- Goal progress: ${data.goalProgress}%
- Task completion rate: ${data.taskCompletion}%
- Average sentiment: ${data.sentiment > 0 ? "positive" : data.sentiment < 0 ? "negative" : "neutral"}
- Recent journal mentions: ${data.recentEntries.join("; ") || "No recent entries"}

Provide 2-3 sentences of insight about their ${aspect} journey and one specific suggestion.`

  return await queryOllama(prompt)
}

/**
 * Get deep analysis with graceful fallback
 */
export async function getDeepAnalysis(
  type: "journal" | "weekly" | "monthly",
  data: unknown
): Promise<{
  available: boolean
  analysis?: string
  fallback?: string
}> {
  const isConnected = await checkOllamaConnection()

  if (!isConnected) {
    return {
      available: false,
      fallback: generateRuleBasedAnalysis(type, data),
    }
  }

  try {
    let analysis: string

    switch (type) {
      case "journal":
        const goals = await db.yearlyGoals.where("status").equals("active").toArray()
        analysis = await analyzeJournalEntry(data as string, goals)
        break
      case "weekly":
        const weeklyGoals = await db.yearlyGoals.where("status").equals("active").toArray()
        analysis = await generateWeeklyNudges(data as WeeklyStats, weeklyGoals)
        break
      case "monthly":
        const journals = await db.journalEntries.toArray()
        analysis = await generateMonthlyAnalysis(data as MonthlySummary, journals)
        break
      default:
        throw new Error("Unknown analysis type")
    }

    return { available: true, analysis }
  } catch (error) {
    return {
      available: false,
      fallback: generateRuleBasedAnalysis(type, data),
    }
  }
}

/**
 * Generate rule-based analysis as fallback when Ollama is not available
 */
function generateRuleBasedAnalysis(type: string, data: unknown): string {
  switch (type) {
    case "journal":
      return "Journal analysis requires Ollama connection. Based on sentiment scoring, this entry has been automatically classified."

    case "weekly":
      const weeklyData = data as WeeklyStats
      const patterns = weeklyData?.patterns || []
      if (patterns.length > 0) {
        return `This week's patterns: ${patterns.join(". ")}. Consider focusing on areas that need improvement.`
      }
      return "Continue tracking your progress to generate weekly insights."

    case "monthly":
      return "Monthly analysis provides comprehensive insights when connected to Ollama. Review your aspect summaries above for current progress."

    default:
      return "Analysis not available. Connect to Ollama for AI-powered insights."
  }
}

/**
 * Lookup result for air fryer model specs
 */
export interface AirFryerSpecsResult {
  found: boolean
  reason?: string           // Why not found (when found=false)
  model?: string
  brand?: string
  capacityLiters?: number
  wattage?: number
  features?: string[]
  notes?: string
}

/**
 * Look up air fryer model specs using Ollama
 * Returns null if lookup fails or Ollama is unavailable
 */
export async function lookupAirFryerSpecs(
  modelName: string
): Promise<AirFryerSpecsResult | null> {
  const isConnected = await checkOllamaConnection()
  if (!isConnected) {
    return null
  }

  // LLMs aren't reliable for product lookups - they hallucinate.
  // Instead of trying to get specs, just help identify the brand and suggest manual entry.
  const prompt = `Parse this air fryer model input and extract what you can identify with certainty.

Input: "${modelName}"

Rules:
- Only extract information you're CERTAIN about from the input text itself
- If the brand name is in the input (Philips, Ninja, Cosori, etc.), extract it
- DO NOT look up or guess specifications like capacity or wattage
- DO NOT invent model numbers - only use what's in the input

Return ONLY valid JSON:
{
  "found": false,
  "brand": "brand name if clearly visible in input, otherwise null",
  "model": "model text from input, cleaned up",
  "reason": "Please enter capacity manually - we cannot verify specs automatically"
}`

  try {
    const response = await generateWithOllama(prompt, { timeout: 15000 })

    // Parse the JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as AirFryerSpecsResult
    return parsed
  } catch (error) {
    console.warn("Air fryer specs lookup failed:", error)
    return null
  }
}
