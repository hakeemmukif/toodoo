/**
 * Breakdown Generator
 *
 * Generates START-MIDDLE-END task structure based on Implementation Intentions theory.
 * Creates mini-task steps that can be visualized in calendar view.
 *
 * Based on Gollwitzer's research: "When situation X arises, I will perform response Y"
 */

import type { TaskBreakdown, TaskStep, LifeAspect, TimePreference } from "@/lib/types"

// Step templates per aspect
const ASPECT_STEPS: Record<LifeAspect, {
  steps: Array<{ title: string; durationRatio: number }>
  completionCriteria: string
  satisfactionCheck: string
  environmentalCues: string[]
}> = {
  fitness: {
    steps: [
      { title: "Warm up", durationRatio: 0.15 },
      { title: "Main session", durationRatio: 0.70 },
      { title: "Cool down & stretch", durationRatio: 0.15 },
    ],
    completionCriteria: "Training session completed",
    satisfactionCheck: "Did I push beyond my comfort zone?",
    environmentalCues: ["Gym bag packed by door", "Workout clothes laid out", "Water bottle filled"],
  },
  nutrition: {
    steps: [
      { title: "Prep ingredients", durationRatio: 0.25 },
      { title: "Cook", durationRatio: 0.50 },
      { title: "Plate & clean up", durationRatio: 0.25 },
    ],
    completionCriteria: "Meal prepared and kitchen cleaned",
    satisfactionCheck: "Did I enjoy the cooking process?",
    environmentalCues: ["Recipe on counter", "Ingredients gathered", "Kitchen space cleared"],
  },
  career: {
    steps: [
      { title: "Review context & goals", durationRatio: 0.15 },
      { title: "Execute main work", durationRatio: 0.70 },
      { title: "Document & communicate", durationRatio: 0.15 },
    ],
    completionCriteria: "Work deliverable completed and documented",
    satisfactionCheck: "Did I make meaningful progress?",
    environmentalCues: ["Focus mode enabled", "Notifications silenced", "Materials gathered"],
  },
  financial: {
    steps: [
      { title: "Open accounts/apps", durationRatio: 0.20 },
      { title: "Execute transactions", durationRatio: 0.50 },
      { title: "Verify & record", durationRatio: 0.30 },
    ],
    completionCriteria: "Financial task completed and verified",
    satisfactionCheck: "Am I on track with my financial goals?",
    environmentalCues: ["Banking apps ready", "Account numbers accessible", "Calculator at hand"],
  },
  "side-projects": {
    steps: [
      { title: "Set up environment", durationRatio: 0.10 },
      { title: "Creative work session", durationRatio: 0.75 },
      { title: "Save & backup", durationRatio: 0.15 },
    ],
    completionCriteria: "Creative output produced and saved",
    satisfactionCheck: "Did I create something I'm proud of?",
    environmentalCues: ["Equipment connected", "Reference materials ready", "Distractions minimized"],
  },
  chores: {
    steps: [
      { title: "Gather supplies", durationRatio: 0.15 },
      { title: "Main task", durationRatio: 0.70 },
      { title: "Put away & finish", durationRatio: 0.15 },
    ],
    completionCriteria: "Space transformed - visible improvement",
    satisfactionCheck: "Does the space feel better now?",
    environmentalCues: ["Cleaning supplies ready", "Area cleared", "Trash bag ready"],
  },
}

/**
 * Generate implementation intention trigger
 */
function generateTrigger(
  aspect: LifeAspect,
  time?: string,
  location?: string,
  timePreference?: TimePreference
): { trigger: string; triggerType: "time" | "location" | "event" } {
  const parts: string[] = []
  let triggerType: "time" | "location" | "event" = "event"

  // Time trigger
  if (time) {
    parts.push(`When it's ${formatTime12hr(time)}`)
    triggerType = "time"
  } else if (timePreference && timePreference !== "anytime") {
    parts.push(`When ${timePreference} arrives`)
    triggerType = "time"
  }

  // Location trigger
  if (location) {
    if (parts.length > 0) {
      parts.push(`and I'm at ${location}`)
    } else {
      parts.push(`When I arrive at ${location}`)
      triggerType = "location"
    }
  }

  // Default trigger
  if (parts.length === 0) {
    parts.push("When I decide to start")
    triggerType = "event"
  }

  return {
    trigger: parts.join(" "),
    triggerType,
  }
}

/**
 * Format time to 12-hour format
 */
function formatTime12hr(time: string): string {
  const [hours, minutes] = time.split(":").map(Number)
  const period = hours >= 12 ? "pm" : "am"
  const displayHours = hours % 12 || 12
  return minutes > 0 ? `${displayHours}:${String(minutes).padStart(2, "0")}${period}` : `${displayHours}${period}`
}

/**
 * Generate unique ID for task step
 */
function generateStepId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Calculate step times based on start time and duration
 */
function calculateStepTimes(
  startTime: string | undefined,
  totalDuration: number,
  stepRatios: number[]
): (string | undefined)[] {
  if (!startTime) return stepRatios.map(() => undefined)

  const [startHours, startMinutes] = startTime.split(":").map(Number)
  let currentMinutes = startHours * 60 + startMinutes

  return stepRatios.map((ratio, index) => {
    const stepTime = `${String(Math.floor(currentMinutes / 60) % 24).padStart(2, "0")}:${String(currentMinutes % 60).padStart(2, "0")}`
    currentMinutes += Math.round(totalDuration * ratio)
    return stepTime
  })
}

/**
 * Generate task breakdown
 */
export function generateBreakdown(
  aspect: LifeAspect,
  options: {
    time?: string
    location?: string
    timePreference?: TimePreference
    totalDuration?: number
    customActivity?: string
  } = {}
): TaskBreakdown {
  const aspectConfig = ASPECT_STEPS[aspect]
  const totalDuration = options.totalDuration || 60 // Default 60 minutes

  // Generate trigger
  const { trigger, triggerType } = generateTrigger(
    aspect,
    options.time,
    options.location,
    options.timePreference
  )

  // Select environmental cue
  const environmentalCue = aspectConfig.environmentalCues[
    Math.floor(Math.random() * aspectConfig.environmentalCues.length)
  ]

  // Calculate step times
  const stepRatios = aspectConfig.steps.map(s => s.durationRatio)
  const stepTimes = calculateStepTimes(options.time, totalDuration, stepRatios)

  // Generate steps
  const steps: TaskStep[] = aspectConfig.steps.map((stepTemplate, index) => ({
    id: generateStepId(),
    title: stepTemplate.title,
    duration: Math.round(totalDuration * stepTemplate.durationRatio),
    order: index + 1,
    status: "pending",
    scheduledTime: stepTimes[index],
  }))

  return {
    trigger,
    triggerType,
    environmentalCue,
    steps,
    completionCriteria: aspectConfig.completionCriteria,
    satisfactionCheck: aspectConfig.satisfactionCheck,
  }
}

/**
 * Generate a minimal breakdown (just start and end, no detailed steps)
 */
export function generateMinimalBreakdown(
  aspect: LifeAspect,
  options: {
    time?: string
    location?: string
    timePreference?: TimePreference
  } = {}
): TaskBreakdown {
  const aspectConfig = ASPECT_STEPS[aspect]

  const { trigger, triggerType } = generateTrigger(
    aspect,
    options.time,
    options.location,
    options.timePreference
  )

  return {
    trigger,
    triggerType,
    environmentalCue: aspectConfig.environmentalCues[0],
    steps: [], // No detailed steps
    completionCriteria: aspectConfig.completionCriteria,
    satisfactionCheck: aspectConfig.satisfactionCheck,
  }
}

/**
 * Update step statuses in a breakdown
 */
export function updateStepStatus(
  breakdown: TaskBreakdown,
  stepId: string,
  status: "pending" | "done" | "skipped"
): TaskBreakdown {
  return {
    ...breakdown,
    steps: breakdown.steps.map(step =>
      step.id === stepId ? { ...step, status } : step
    ),
  }
}

/**
 * Calculate breakdown progress (percentage of steps completed)
 */
export function calculateBreakdownProgress(breakdown: TaskBreakdown): number {
  if (breakdown.steps.length === 0) return 0

  const completedSteps = breakdown.steps.filter(s => s.status === "done").length
  return Math.round((completedSteps / breakdown.steps.length) * 100)
}

/**
 * Get the next pending step in a breakdown
 */
export function getNextPendingStep(breakdown: TaskBreakdown): TaskStep | null {
  const pendingSteps = breakdown.steps
    .filter(s => s.status === "pending")
    .sort((a, b) => a.order - b.order)

  return pendingSteps[0] || null
}

// ========== DYNAMIC BREAKDOWN FROM ANSWERS ==========

// Dynamic step templates per aspect and activity type
const DYNAMIC_STEP_TEMPLATES: Record<
  LifeAspect,
  Record<string, Array<{ title: string; durationRatio: number }>>
> = {
  fitness: {
    technique: [
      { title: "Dynamic warm-up", durationRatio: 0.10 },
      { title: "Technique drills", durationRatio: 0.50 },
      { title: "Light application", durationRatio: 0.25 },
      { title: "Cool down & stretch", durationRatio: 0.15 },
    ],
    sparring: [
      { title: "Warm up & shadow box", durationRatio: 0.15 },
      { title: "Technical sparring", durationRatio: 0.25 },
      { title: "Competitive rounds", durationRatio: 0.40 },
      { title: "Cool down & debrief", durationRatio: 0.20 },
    ],
    "heavy-bag": [
      { title: "Jump rope warm-up", durationRatio: 0.15 },
      { title: "Bag rounds (combinations)", durationRatio: 0.55 },
      { title: "Power shots", durationRatio: 0.15 },
      { title: "Stretch", durationRatio: 0.15 },
    ],
    conditioning: [
      { title: "Mobility warm-up", durationRatio: 0.15 },
      { title: "Circuit training", durationRatio: 0.60 },
      { title: "Finisher", durationRatio: 0.10 },
      { title: "Cool down", durationRatio: 0.15 },
    ],
    pads: [
      { title: "Warm-up & wrapping", durationRatio: 0.10 },
      { title: "Technical rounds", durationRatio: 0.50 },
      { title: "Power rounds", durationRatio: 0.25 },
      { title: "Stretch & recover", durationRatio: 0.15 },
    ],
    strength: [
      { title: "Warm-up & mobility", durationRatio: 0.15 },
      { title: "Main lifts", durationRatio: 0.60 },
      { title: "Accessory work", durationRatio: 0.15 },
      { title: "Stretch", durationRatio: 0.10 },
    ],
    cardio: [
      { title: "Warm-up", durationRatio: 0.10 },
      { title: "Main cardio session", durationRatio: 0.75 },
      { title: "Cool down", durationRatio: 0.15 },
    ],
    flexibility: [
      { title: "Light warm-up", durationRatio: 0.15 },
      { title: "Stretch routine", durationRatio: 0.70 },
      { title: "Relaxation", durationRatio: 0.15 },
    ],
  },

  nutrition: {
    quick: [
      { title: "Gather ingredients", durationRatio: 0.20 },
      { title: "Cook", durationRatio: 0.50 },
      { title: "Plate & enjoy", durationRatio: 0.30 },
    ],
    "full-recipe": [
      { title: "Mise en place", durationRatio: 0.15 },
      { title: "Prep ingredients", durationRatio: 0.20 },
      { title: "Cook", durationRatio: 0.45 },
      { title: "Plate & clean up", durationRatio: 0.20 },
    ],
    "meal-prep": [
      { title: "Plan & check inventory", durationRatio: 0.10 },
      { title: "Prep all ingredients", durationRatio: 0.25 },
      { title: "Cook (batch style)", durationRatio: 0.45 },
      { title: "Portion & store", durationRatio: 0.15 },
      { title: "Clean kitchen", durationRatio: 0.05 },
    ],
    baking: [
      { title: "Prepare ingredients", durationRatio: 0.15 },
      { title: "Mix & prepare", durationRatio: 0.25 },
      { title: "Bake", durationRatio: 0.45 },
      { title: "Cool & finish", durationRatio: 0.15 },
    ],
  },

  career: {
    "deep-work": [
      { title: "Set up environment", durationRatio: 0.05 },
      { title: "Review goals", durationRatio: 0.05 },
      { title: "Deep work block", durationRatio: 0.75 },
      { title: "Document progress", durationRatio: 0.10 },
      { title: "Short break", durationRatio: 0.05 },
    ],
    meeting: [
      { title: "Review agenda & prep", durationRatio: 0.10 },
      { title: "Meeting", durationRatio: 0.70 },
      { title: "Document action items", durationRatio: 0.20 },
    ],
    review: [
      { title: "Gather materials", durationRatio: 0.15 },
      { title: "Review & analyze", durationRatio: 0.60 },
      { title: "Write feedback", durationRatio: 0.25 },
    ],
    planning: [
      { title: "Review current state", durationRatio: 0.20 },
      { title: "Draft plan", durationRatio: 0.50 },
      { title: "Review & finalize", durationRatio: 0.30 },
    ],
    communication: [
      { title: "Triage inbox", durationRatio: 0.20 },
      { title: "Respond to priority items", durationRatio: 0.60 },
      { title: "Schedule follow-ups", durationRatio: 0.20 },
    ],
    learning: [
      { title: "Set learning goal", durationRatio: 0.10 },
      { title: "Study material", durationRatio: 0.65 },
      { title: "Practice/apply", durationRatio: 0.15 },
      { title: "Note key takeaways", durationRatio: 0.10 },
    ],
  },

  financial: {
    review: [
      { title: "Open accounts", durationRatio: 0.20 },
      { title: "Review transactions", durationRatio: 0.50 },
      { title: "Note observations", durationRatio: 0.30 },
    ],
    transfer: [
      { title: "Verify details", durationRatio: 0.20 },
      { title: "Execute transfer", durationRatio: 0.50 },
      { title: "Confirm & record", durationRatio: 0.30 },
    ],
    budget: [
      { title: "Gather data", durationRatio: 0.25 },
      { title: "Review categories", durationRatio: 0.45 },
      { title: "Update plan", durationRatio: 0.30 },
    ],
    investment: [
      { title: "Review portfolio", durationRatio: 0.30 },
      { title: "Analyze performance", durationRatio: 0.40 },
      { title: "Note decisions", durationRatio: 0.30 },
    ],
    planning: [
      { title: "Review goals", durationRatio: 0.20 },
      { title: "Analyze projections", durationRatio: 0.50 },
      { title: "Update strategy", durationRatio: 0.30 },
    ],
  },

  "side-projects": {
    "dj-practice": [
      { title: "Set up equipment", durationRatio: 0.10 },
      { title: "Warm-up mixing", durationRatio: 0.15 },
      { title: "Main practice session", durationRatio: 0.55 },
      { title: "Record & review", durationRatio: 0.15 },
      { title: "Pack up", durationRatio: 0.05 },
    ],
    "music-production": [
      { title: "Load project", durationRatio: 0.10 },
      { title: "Creative work", durationRatio: 0.65 },
      { title: "Mix & review", durationRatio: 0.15 },
      { title: "Export & backup", durationRatio: 0.10 },
    ],
    coding: [
      { title: "Review & plan", durationRatio: 0.10 },
      { title: "Code", durationRatio: 0.70 },
      { title: "Test & debug", durationRatio: 0.15 },
      { title: "Commit & document", durationRatio: 0.05 },
    ],
    creative: [
      { title: "Set up workspace", durationRatio: 0.10 },
      { title: "Create", durationRatio: 0.75 },
      { title: "Review & save", durationRatio: 0.15 },
    ],
    learning: [
      { title: "Set learning goal", durationRatio: 0.10 },
      { title: "Study & practice", durationRatio: 0.70 },
      { title: "Reflect & note", durationRatio: 0.20 },
    ],
  },

  chores: {
    cleaning: [
      { title: "Gather supplies", durationRatio: 0.10 },
      { title: "Clean area", durationRatio: 0.70 },
      { title: "Put away supplies", durationRatio: 0.20 },
    ],
    laundry: [
      { title: "Sort & load", durationRatio: 0.15 },
      { title: "Wash cycle", durationRatio: 0.40 },
      { title: "Dry & fold", durationRatio: 0.35 },
      { title: "Put away", durationRatio: 0.10 },
    ],
    shopping: [
      { title: "Check list", durationRatio: 0.10 },
      { title: "Shop", durationRatio: 0.60 },
      { title: "Unpack & organize", durationRatio: 0.30 },
    ],
    organizing: [
      { title: "Assess area", durationRatio: 0.15 },
      { title: "Sort & organize", durationRatio: 0.60 },
      { title: "Label & maintain", durationRatio: 0.25 },
    ],
    maintenance: [
      { title: "Gather tools", durationRatio: 0.15 },
      { title: "Fix/maintain", durationRatio: 0.65 },
      { title: "Clean up & test", durationRatio: 0.20 },
    ],
  },
}

// Completion criteria per activity type
const COMPLETION_CRITERIA: Record<LifeAspect, Record<string, string>> = {
  fitness: {
    technique: "Technique practice completed, new patterns drilled",
    sparring: "Sparring rounds completed, partner debriefed",
    "heavy-bag": "Bag work finished, combinations practiced",
    conditioning: "Conditioning circuit completed",
    pads: "Pad work session finished",
    strength: "All sets and reps completed",
    cardio: "Cardio goal reached",
    flexibility: "Full stretch routine completed",
  },
  nutrition: {
    quick: "Meal prepared and kitchen tidied",
    "full-recipe": "Recipe completed, kitchen cleaned",
    "meal-prep": "All meals prepped and stored",
    baking: "Baked goods finished and cooled",
  },
  career: {
    "deep-work": "Work block completed with documented progress",
    meeting: "Meeting completed with action items recorded",
    review: "Review completed with feedback documented",
    planning: "Plan drafted and reviewed",
    communication: "Inbox processed and responded to",
    learning: "Learning session completed with notes",
  },
  financial: {
    review: "Accounts reviewed and observations noted",
    transfer: "Transfer completed and confirmed",
    budget: "Budget reviewed and updated",
    investment: "Portfolio reviewed with decisions noted",
    planning: "Financial strategy updated",
  },
  "side-projects": {
    "dj-practice": "Practice session recorded and reviewed",
    "music-production": "Track progress saved and backed up",
    coding: "Code committed and documented",
    creative: "Creative work saved",
    learning: "New skill practiced with notes",
  },
  chores: {
    cleaning: "Area cleaned and supplies put away",
    laundry: "Laundry done and put away",
    shopping: "Shopping complete and items organized",
    organizing: "Area organized and labeled",
    maintenance: "Maintenance complete and tested",
  },
}

// Environmental cues per activity type
const ENVIRONMENTAL_CUES: Record<LifeAspect, Record<string, string>> = {
  fitness: {
    technique: "Training notes ready",
    sparring: "Mouthguard and gear packed",
    "heavy-bag": "Wraps ready by bag",
    conditioning: "Timer set up",
    pads: "Pads partner confirmed",
    strength: "Workout logged, weights planned",
    cardio: "Shoes and water ready",
    flexibility: "Mat laid out",
  },
  nutrition: {
    quick: "Quick ingredients accessible",
    "full-recipe": "Recipe on counter, ingredients gathered",
    "meal-prep": "Containers ready, shopping done",
    baking: "Oven preheating, ingredients measured",
  },
  career: {
    "deep-work": "Notifications off, environment quiet",
    meeting: "Agenda reviewed, notes ready",
    review: "Documents open, checklist ready",
    planning: "Calendar and goals visible",
    communication: "Inbox open, focus timer set",
    learning: "Course/book open, notes ready",
  },
  financial: {
    review: "Banking apps logged in",
    transfer: "Account details verified",
    budget: "Spreadsheet open",
    investment: "Portfolio dashboard open",
    planning: "Financial goals visible",
  },
  "side-projects": {
    "dj-practice": "Decks on, headphones ready",
    "music-production": "DAW loaded, project open",
    coding: "Editor open, requirements clear",
    creative: "Workspace cleared, materials ready",
    learning: "Course materials queued",
  },
  chores: {
    cleaning: "Cleaning supplies gathered",
    laundry: "Hamper by machine",
    shopping: "List on phone, bags ready",
    organizing: "Bins and labels ready",
    maintenance: "Tools gathered, manual ready",
  },
}

/**
 * Generate breakdown from deep prompt answers
 */
export function generateBreakdownFromAnswers(
  aspect: LifeAspect,
  answers: Record<string, string>,
  options: {
    time?: string
    location?: string
    timePreference?: TimePreference
    totalDuration?: number
  } = {}
): TaskBreakdown {
  // Get the primary activity type from answers
  const activityType = getActivityTypeFromAnswers(aspect, answers)

  // Get step templates for this activity type
  const stepTemplates =
    DYNAMIC_STEP_TEMPLATES[aspect]?.[activityType] || ASPECT_STEPS[aspect].steps

  // Determine duration (from answers or inferred)
  const totalDuration =
    options.totalDuration ||
    (answers.duration ? parseInt(answers.duration, 10) : 60)

  // Generate trigger
  const { trigger, triggerType } = generateTrigger(
    aspect,
    options.time,
    options.location,
    options.timePreference
  )

  // Get completion criteria and environmental cue
  const completionCriteria =
    COMPLETION_CRITERIA[aspect]?.[activityType] ||
    ASPECT_STEPS[aspect].completionCriteria

  const environmentalCue =
    ENVIRONMENTAL_CUES[aspect]?.[activityType] ||
    ASPECT_STEPS[aspect].environmentalCues[0]

  // Calculate step times
  const stepRatios = stepTemplates.map((s) => s.durationRatio)
  const stepTimes = calculateStepTimes(options.time, totalDuration, stepRatios)

  // Generate steps
  const steps: TaskStep[] = stepTemplates.map((stepTemplate, index) => ({
    id: generateStepId(),
    title: stepTemplate.title,
    duration: Math.round(totalDuration * stepTemplate.durationRatio),
    order: index + 1,
    status: "pending",
    scheduledTime: stepTimes[index],
  }))

  return {
    trigger,
    triggerType,
    environmentalCue,
    steps,
    completionCriteria,
    satisfactionCheck: ASPECT_STEPS[aspect].satisfactionCheck,
  }
}

/**
 * Get activity type from answers based on aspect
 */
function getActivityTypeFromAnswers(
  aspect: LifeAspect,
  answers: Record<string, string>
): string {
  // Map question keys to aspects
  const keyMap: Record<LifeAspect, string> = {
    fitness: "session_type",
    nutrition: "meal_type",
    career: "work_type",
    financial: "task_type",
    "side-projects": "project_type",
    chores: "chore_type",
  }

  const key = keyMap[aspect]
  return answers[key] || Object.keys(DYNAMIC_STEP_TEMPLATES[aspect] || {})[0] || ""
}
