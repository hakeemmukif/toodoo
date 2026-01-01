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

  constructor() {
    super("LifeTrackerDB")

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
      createdAt: new Date(),
      updatedAt: new Date(),
    })
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
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return `${year}-W${weekNumber.toString().padStart(2, "0")}`
}

export function getMonthString(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  return `${year}-${month}`
}
