import Dexie, { type Table } from "dexie"
import type {
  YearlyGoal,
  MonthlyGoal,
  WeeklyGoal,
  Task,
  RecurrenceTemplate,
  JournalEntry,
  TrainingSession,
  Meal,
  Recipe,
  ShoppingList,
  ShoppingItem,
  ScheduleBlock,
  AppSettings,
  InboxItem,
  WeeklyReview,
  FinancialSnapshot,
  StreakData,
  PlanningDraft,
} from "@/lib/types"

class LifeTrackerDB extends Dexie {
  yearlyGoals!: Table<YearlyGoal>
  monthlyGoals!: Table<MonthlyGoal>
  weeklyGoals!: Table<WeeklyGoal>
  tasks!: Table<Task>
  recurrenceTemplates!: Table<RecurrenceTemplate>
  journalEntries!: Table<JournalEntry>
  trainingSessions!: Table<TrainingSession>
  meals!: Table<Meal>
  recipes!: Table<Recipe>
  shoppingLists!: Table<ShoppingList>
  shoppingItems!: Table<ShoppingItem>
  scheduleBlocks!: Table<ScheduleBlock>
  appSettings!: Table<AppSettings>
  inboxItems!: Table<InboxItem>
  weeklyReviews!: Table<WeeklyReview>
  financialSnapshots!: Table<FinancialSnapshot>
  streakData!: Table<StreakData>
  planningDrafts!: Table<PlanningDraft>

  constructor() {
    super("LifeTrackerDB")

    // Version 1: Original schema
    this.version(1).stores({
      yearlyGoals: "id, aspect, year, status",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
      tasks: "id, weeklyGoalId, aspect, scheduledDate, status, recurrenceTemplateId",
      recurrenceTemplates: "id, aspect, isActive",
      journalEntries: "id, timestamp, *detectedAspects, goalAlignment",
      trainingSessions: "id, date, type",
      meals: "id, date, type, recipeId",
      recipes: "id, *tags, rating",
      shoppingLists: "id, store",
      shoppingItems: "id, listId, category, status, priority",
      scheduleBlocks: "id, date, type, linkedTaskId",
      appSettings: "id",
    })

    // Version 2: Behavioral framework additions
    this.version(2).stores({
      yearlyGoals: "id, aspect, year, status, priority",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status, priority",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
      tasks: "id, weeklyGoalId, aspect, scheduledDate, status, recurrenceTemplateId, deferCount",
      recurrenceTemplates: "id, aspect, isActive",
      journalEntries: "id, timestamp, *detectedAspects, goalAlignment, promptCategory, energyLevel",
      trainingSessions: "id, date, type, isHardThing",
      meals: "id, date, type, recipeId, cooked",
      recipes: "id, *tags, rating",
      shoppingLists: "id, store",
      shoppingItems: "id, listId, category, status, priority",
      scheduleBlocks: "id, date, type, depth, linkedTaskId",
      appSettings: "id",
      inboxItems: "id, capturedAt, processedAt",
      weeklyReviews: "id, weekOf, completedAt",
      financialSnapshots: "id, date, linkedGoalId, onTrack",
      streakData: "type",
    }).upgrade((tx) => {
      // Migrate existing tasks to have deferCount = 0
      return tx.table("tasks").toCollection().modify((task) => {
        if (task.deferCount === undefined) {
          task.deferCount = 0
        }
      })
    })

    // Version 3: Cross-feature goal integration + AI planning
    this.version(3).stores({
      yearlyGoals: "id, aspect, year, status, priority",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status, priority",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
      tasks: "id, weeklyGoalId, aspect, scheduledDate, status, recurrenceTemplateId, deferCount",
      recurrenceTemplates: "id, aspect, isActive",
      journalEntries: "id, timestamp, *detectedAspects, goalAlignment, promptCategory, energyLevel, *linkedGoalIds, goalContext",
      trainingSessions: "id, date, type, isHardThing, linkedGoalId",
      meals: "id, date, type, recipeId, cooked, linkedGoalId",
      recipes: "id, *tags, rating",
      shoppingLists: "id, store",
      shoppingItems: "id, listId, category, status, priority",
      scheduleBlocks: "id, date, type, depth, linkedTaskId, linkedGoalId",
      appSettings: "id",
      inboxItems: "id, capturedAt, processedAt",
      weeklyReviews: "id, weekOf, completedAt",
      financialSnapshots: "id, date, linkedGoalId, onTrack",
      streakData: "type",
      planningDrafts: "id, aspect, createdAt, lastModifiedAt",
    })

    // Version 4: Intelligent inbox parsing + task location & breakdown
    this.version(4).stores({
      yearlyGoals: "id, aspect, year, status, priority",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status, priority",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
      // Added: location, parentTaskId, isSubtask for task breakdown feature
      tasks: "id, weeklyGoalId, aspect, scheduledDate, status, recurrenceTemplateId, deferCount, parentTaskId, isSubtask",
      recurrenceTemplates: "id, aspect, isActive",
      journalEntries: "id, timestamp, *detectedAspects, goalAlignment, promptCategory, energyLevel, *linkedGoalIds, goalContext",
      trainingSessions: "id, date, type, isHardThing, linkedGoalId",
      meals: "id, date, type, recipeId, cooked, linkedGoalId",
      recipes: "id, *tags, rating",
      shoppingLists: "id, store",
      shoppingItems: "id, listId, category, status, priority",
      scheduleBlocks: "id, date, type, depth, linkedTaskId, linkedGoalId",
      appSettings: "id",
      // Added: parseVersion for cache invalidation when parser improves
      inboxItems: "id, capturedAt, processedAt, parseVersion",
      weeklyReviews: "id, weekOf, completedAt",
      financialSnapshots: "id, date, linkedGoalId, onTrack",
      streakData: "type",
      planningDrafts: "id, aspect, createdAt, lastModifiedAt",
    }).upgrade((tx) => {
      // Migrate existing tasks to have isSubtask = false
      return tx.table("tasks").toCollection().modify((task) => {
        if (task.isSubtask === undefined) {
          task.isSubtask = false
        }
      })
    })

    // Version 5: Goal frequency tracking for inbox-to-goal matching
    // Added: frequency field to weeklyGoals (not indexed, just stored as object)
    this.version(5).stores({
      yearlyGoals: "id, aspect, year, status, priority",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status, priority",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
      tasks: "id, weeklyGoalId, aspect, scheduledDate, status, recurrenceTemplateId, deferCount, parentTaskId, isSubtask",
      recurrenceTemplates: "id, aspect, isActive",
      journalEntries: "id, timestamp, *detectedAspects, goalAlignment, promptCategory, energyLevel, *linkedGoalIds, goalContext",
      trainingSessions: "id, date, type, isHardThing, linkedGoalId",
      meals: "id, date, type, recipeId, cooked, linkedGoalId",
      recipes: "id, *tags, rating",
      shoppingLists: "id, store",
      shoppingItems: "id, listId, category, status, priority",
      scheduleBlocks: "id, date, type, depth, linkedTaskId, linkedGoalId",
      appSettings: "id",
      inboxItems: "id, capturedAt, processedAt, parseVersion",
      weeklyReviews: "id, weekOf, completedAt",
      financialSnapshots: "id, date, linkedGoalId, onTrack",
      streakData: "type",
      planningDrafts: "id, aspect, createdAt, lastModifiedAt",
    })

    // Version 6: WHO field for tasks - tracks who the task is with
    // Added: who, whoType fields to tasks (default "solo" for existing tasks)
    this.version(6).stores({
      yearlyGoals: "id, aspect, year, status, priority",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status, priority",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
      // Added: hardScheduledTime index for conflict detection
      tasks: "id, weeklyGoalId, aspect, scheduledDate, status, recurrenceTemplateId, deferCount, parentTaskId, isSubtask, hardScheduledTime",
      recurrenceTemplates: "id, aspect, isActive",
      journalEntries: "id, timestamp, *detectedAspects, goalAlignment, promptCategory, energyLevel, *linkedGoalIds, goalContext",
      trainingSessions: "id, date, type, isHardThing, linkedGoalId",
      meals: "id, date, type, recipeId, cooked, linkedGoalId",
      recipes: "id, *tags, rating",
      shoppingLists: "id, store",
      shoppingItems: "id, listId, category, status, priority",
      scheduleBlocks: "id, date, type, depth, linkedTaskId, linkedGoalId",
      appSettings: "id",
      inboxItems: "id, capturedAt, processedAt, parseVersion",
      weeklyReviews: "id, weekOf, completedAt",
      financialSnapshots: "id, date, linkedGoalId, onTrack",
      streakData: "type",
      planningDrafts: "id, aspect, createdAt, lastModifiedAt",
    }).upgrade((tx) => {
      // Migrate existing tasks to have who = "solo" and whoType = "solo" by default
      return tx.table("tasks").toCollection().modify((task) => {
        if (task.who === undefined) {
          task.who = "solo"
          task.whoType = "solo"
        }
      })
    })
  }
}

export const db = new LifeTrackerDB()

// Initialize default settings if they don't exist
export async function initializeDb() {
  const settings = await db.appSettings.get("default")
  if (!settings) {
    await db.appSettings.add({
      id: "default",
      ollamaUrl: "http://localhost:11434",
      theme: "dark",
      onboardingCompleted: false,
      weekStartsOn: 1, // Monday
      weeklyReviewDay: 0, // Sunday
      weeklyReviewTime: "18:00",
      journalPromptMode: "rotating",
      preferredPromptCategories: [],
      coachTone: "balanced",
      deepWorkDailyTarget: 4,
      showPrincipleTooltips: true,
      ollamaStatus: "checking", // New: Ollama connection status
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } else {
    // Migrate existing settings to include new fields
    const updates: Partial<AppSettings> = {}
    if (settings.weekStartsOn === undefined) updates.weekStartsOn = 1
    if (settings.weeklyReviewDay === undefined) updates.weeklyReviewDay = 0
    if (settings.weeklyReviewTime === undefined) updates.weeklyReviewTime = "18:00"
    if (settings.journalPromptMode === undefined) updates.journalPromptMode = "rotating"
    if (settings.preferredPromptCategories === undefined) updates.preferredPromptCategories = []
    if (settings.coachTone === undefined) updates.coachTone = "balanced"
    if (settings.deepWorkDailyTarget === undefined) updates.deepWorkDailyTarget = 4
    if (settings.showPrincipleTooltips === undefined) updates.showPrincipleTooltips = true
    // V4: Ollama status tracking
    if (settings.ollamaStatus === undefined) updates.ollamaStatus = "checking"

    if (Object.keys(updates).length > 0) {
      await db.appSettings.update("default", { ...updates, updatedAt: new Date() })
    }
  }

  // Initialize default streak data if not exists
  const streakTypes = ["training", "cooking", "journal", "deep-work"] as const
  for (const type of streakTypes) {
    const existing = await db.streakData.get(type)
    if (!existing) {
      await db.streakData.add({
        type,
        current: 0,
        longest: 0,
        daysSinceDoubleMiss: 0,
      })
    }
  }
}

// Utility function to generate IDs
export function generateId(): string {
  return crypto.randomUUID()
}

// Format date helpers
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function getWeekString(date: Date): string {
  // ISO 8601 week number calculation
  // Week 1 is the week containing the first Thursday of the year
  const target = new Date(date.valueOf())
  // Set to nearest Thursday: current date + 4 - current day number (makes Sunday = 7)
  const dayNum = (date.getDay() + 6) % 7 // Monday = 0, Sunday = 6
  target.setDate(target.getDate() - dayNum + 3) // Set to Thursday of current week

  // Get first Thursday of year
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const firstThursdayDay = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDay + 3)

  // Calculate week number
  const weekNum = 1 + Math.round(
    (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)
  )

  // ISO week year might differ from calendar year at year boundaries
  const isoYear = target.getFullYear()

  return `${isoYear}-W${weekNum.toString().padStart(2, "0")}`
}

export function getMonthString(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  return `${year}-${month}`
}
