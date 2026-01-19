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
  SyncIssue,
  SyncRunResult,
  InventoryItem,
  AirFryerRecipe,
  AirFryerDevice,
  CookingSession,
  DailyExcavation,
  EmergentVision,
  PatternInterrupt,
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
  syncIssues!: Table<SyncIssue>
  syncRuns!: Table<SyncRunResult>
  // Version 9: Air fryer feature
  inventoryItems!: Table<InventoryItem>
  airFryerRecipes!: Table<AirFryerRecipe>
  // Version 10: Air fryer device settings
  airFryerDevices!: Table<AirFryerDevice>
  // Version 11: Cooking session sequencer
  cookingSessions!: Table<CookingSession>
  // Version 12: Daily excavation system
  dailyExcavations!: Table<DailyExcavation>
  emergentVision!: Table<EmergentVision>
  // Version 13: Pattern interrupts for contemplation
  patternInterrupts!: Table<PatternInterrupt>

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

    // Version 7: Sync/Coherence system for data integrity and LLM-powered connections
    this.version(7).stores({
      yearlyGoals: "id, aspect, year, status, priority",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status, priority",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
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
      // New: Sync system tables
      syncIssues: "id, type, severity, entityType, entityId, layer, detectedAt, resolvedAt",
      syncRuns: "id, runType, startedAt",
    })

    // Version 8: Psychology-backed goal types (WOOP, Implementation Intentions)
    // Added: goalType index to yearlyGoals for filtering by goal type
    // New fields are stored as objects (not indexed): woop, motivation, habit, mastery, project, outcome
    this.version(8).stores({
      yearlyGoals: "id, aspect, year, status, priority, goalType",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status, priority",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
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
      syncIssues: "id, type, severity, entityType, entityId, layer, detectedAt, resolvedAt",
      syncRuns: "id, runType, startedAt",
    }).upgrade((tx) => {
      // Migrate existing yearly goals to have goalType = "project" (safest default)
      return tx.table("yearlyGoals").toCollection().modify((goal) => {
        if (goal.goalType === undefined) {
          goal.goalType = "project"
        }
      })
    })

    // Version 9: Air fryer recipe suggestions with pantry inventory
    // New tables: inventoryItems (pantry tracking), airFryerRecipes (extended recipe with steps)
    this.version(9).stores({
      yearlyGoals: "id, aspect, year, status, priority, goalType",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status, priority",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
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
      syncIssues: "id, type, severity, entityType, entityId, layer, detectedAt, resolvedAt",
      syncRuns: "id, runType, startedAt",
      // New: Pantry inventory for ingredient tracking
      inventoryItems: "id, normalizedName, category, expiresAt",
      // New: Air fryer recipes with guided steps
      airFryerRecipes: "id, difficulty, *tags",
    })

    // Version 10: Air fryer device settings (capacity, temp unit preference)
    this.version(10).stores({
      yearlyGoals: "id, aspect, year, status, priority, goalType",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status, priority",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
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
      syncIssues: "id, type, severity, entityType, entityId, layer, detectedAt, resolvedAt",
      syncRuns: "id, runType, startedAt",
      inventoryItems: "id, normalizedName, category, expiresAt",
      airFryerRecipes: "id, difficulty, *tags",
      // New: User's air fryer device configuration
      airFryerDevices: "id",
    })

    // Version 11: Cooking session sequencer for multi-item batch optimization
    this.version(11).stores({
      yearlyGoals: "id, aspect, year, status, priority, goalType",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status, priority",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
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
      syncIssues: "id, type, severity, entityType, entityId, layer, detectedAt, resolvedAt",
      syncRuns: "id, runType, startedAt",
      inventoryItems: "id, normalizedName, category, expiresAt",
      airFryerRecipes: "id, difficulty, *tags",
      airFryerDevices: "id",
      // New: Cooking session for batch optimization
      cookingSessions: "id, status, createdAt",
    })

    // Version 12: Daily excavation system for psychological foundation building
    this.version(12).stores({
      yearlyGoals: "id, aspect, year, status, priority, goalType",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status, priority",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
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
      syncIssues: "id, type, severity, entityType, entityId, layer, detectedAt, resolvedAt",
      syncRuns: "id, runType, startedAt",
      inventoryItems: "id, normalizedName, category, expiresAt",
      airFryerRecipes: "id, difficulty, *tags",
      airFryerDevices: "id",
      cookingSessions: "id, status, createdAt",
      // New: Daily excavation for building psychological foundation over time
      dailyExcavations: "id, date, theme, isComplete, startedAt",
      emergentVision: "id",
    })

    // Version 13: Pattern interrupts for contemplation questions
    this.version(13).stores({
      yearlyGoals: "id, aspect, year, status, priority, goalType",
      monthlyGoals: "id, yearlyGoalId, aspect, month, status, priority",
      weeklyGoals: "id, monthlyGoalId, aspect, week, status",
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
      syncIssues: "id, type, severity, entityType, entityId, layer, detectedAt, resolvedAt",
      syncRuns: "id, runType, startedAt",
      inventoryItems: "id, normalizedName, category, expiresAt",
      airFryerRecipes: "id, difficulty, *tags",
      airFryerDevices: "id",
      cookingSessions: "id, status, createdAt",
      dailyExcavations: "id, date, theme, isComplete, startedAt",
      emergentVision: "id",
      // New: Pattern interrupts for random contemplation questions
      patternInterrupts: "id, scheduledFor, skipped, respondedAt",
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
  // Use local timezone components to avoid off-by-one errors for users ahead of UTC
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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
