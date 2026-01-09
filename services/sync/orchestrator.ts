/**
 * Sync Orchestrator
 *
 * Coordinates all sync layers with support for:
 * - Background sync (periodic)
 * - On-demand sync (manual trigger)
 * - Real-time sync (debounced entity changes)
 */

import { useSyncStore } from "@/stores/sync"
import type { SyncEntityType, SyncSettings } from "@/lib/types"

// Singleton orchestrator state
let backgroundIntervalId: ReturnType<typeof setInterval> | null = null
let realtimeDebounceTimer: ReturnType<typeof setTimeout> | null = null
let isInitialized = false

interface QueuedChange {
  entityType: SyncEntityType
  entityId: string
  operation: "create" | "update" | "delete"
  timestamp: number
}

const changeQueue: QueuedChange[] = []

/**
 * Initialize the sync orchestrator
 * Call this once when the app starts (in DataProvider)
 */
export function initializeSyncOrchestrator(): void {
  if (isInitialized) return

  const settings = useSyncStore.getState().settings

  // Start background sync if enabled
  if (settings.backgroundSyncEnabled) {
    startBackgroundSync(settings.backgroundSyncInterval)
  }

  isInitialized = true
  console.log("[Sync] Orchestrator initialized")
}

/**
 * Shutdown the sync orchestrator
 * Call this when the app is closing
 */
export function shutdownSyncOrchestrator(): void {
  stopBackgroundSync()
  if (realtimeDebounceTimer) {
    clearTimeout(realtimeDebounceTimer)
    realtimeDebounceTimer = null
  }
  changeQueue.length = 0
  isInitialized = false
  console.log("[Sync] Orchestrator shutdown")
}

/**
 * Start background sync at specified interval
 */
export function startBackgroundSync(intervalMinutes: number): void {
  stopBackgroundSync()

  const intervalMs = intervalMinutes * 60 * 1000

  // Run initial sync after a short delay (let app settle)
  setTimeout(() => {
    runBackgroundSync()
  }, 5000)

  // Schedule periodic syncs
  backgroundIntervalId = setInterval(() => {
    runBackgroundSync()
  }, intervalMs)

  console.log(`[Sync] Background sync started (every ${intervalMinutes}min)`)
}

/**
 * Stop background sync
 */
export function stopBackgroundSync(): void {
  if (backgroundIntervalId) {
    clearInterval(backgroundIntervalId)
    backgroundIntervalId = null
    console.log("[Sync] Background sync stopped")
  }
}

/**
 * Run background sync
 * Uses requestIdleCallback for non-blocking execution
 */
async function runBackgroundSync(): Promise<void> {
  const state = useSyncStore.getState()

  // Skip if already running
  if (state.isRunning) {
    console.log("[Sync] Skipping background sync - already running")
    return
  }

  // Use requestIdleCallback if available, otherwise setTimeout
  const scheduleSync = typeof requestIdleCallback !== "undefined"
    ? requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 1)

  scheduleSync(async () => {
    try {
      console.log("[Sync] Running background sync...")
      await state.runSync({
        layer1: true,
        layer2: state.settings.layer2Enabled,
        layer3: state.settings.layer3Enabled,
        runType: "background",
      })
      console.log("[Sync] Background sync completed")
    } catch (error) {
      console.error("[Sync] Background sync failed:", error)
    }
  })
}

/**
 * Queue a real-time sync for entity changes
 * Changes are debounced to prevent excessive syncs
 */
export function queueRealtimeSync(
  entityType: SyncEntityType,
  entityId: string,
  operation: "create" | "update" | "delete"
): void {
  const settings = useSyncStore.getState().settings

  if (!settings.realtimeSyncEnabled) return

  // Add to queue
  changeQueue.push({
    entityType,
    entityId,
    operation,
    timestamp: Date.now(),
  })

  // Debounce the sync
  if (realtimeDebounceTimer) {
    clearTimeout(realtimeDebounceTimer)
  }

  realtimeDebounceTimer = setTimeout(() => {
    processRealtimeQueue()
  }, settings.realtimeSyncDebounce)
}

/**
 * Process queued realtime changes
 */
async function processRealtimeQueue(): Promise<void> {
  if (changeQueue.length === 0) return

  const state = useSyncStore.getState()

  // Skip if full sync is running
  if (state.isRunning) {
    console.log("[Sync] Deferring realtime sync - full sync in progress")
    return
  }

  // Get unique changes (latest per entity)
  const uniqueChanges = new Map<string, QueuedChange>()
  for (const change of changeQueue) {
    const key = `${change.entityType}:${change.entityId}`
    uniqueChanges.set(key, change)
  }

  // Clear queue
  changeQueue.length = 0

  console.log(`[Sync] Processing ${uniqueChanges.size} realtime changes`)

  try {
    // For realtime, only run Layer 1 (fast validation)
    await state.runSync({
      layer1: true,
      layer2: false, // Skip LLM layers for realtime
      layer3: false,
      runType: "realtime",
    })
  } catch (error) {
    console.error("[Sync] Realtime sync failed:", error)
  }
}

/**
 * Run a manual sync (all enabled layers)
 */
export async function runManualSync(): Promise<void> {
  const state = useSyncStore.getState()

  if (state.isRunning) {
    throw new Error("Sync already in progress")
  }

  console.log("[Sync] Running manual sync...")

  try {
    await state.runSync({
      layer1: true,
      layer2: state.settings.layer2Enabled,
      layer3: state.settings.layer3Enabled,
      runType: "manual",
    })
    console.log("[Sync] Manual sync completed")
  } catch (error) {
    console.error("[Sync] Manual sync failed:", error)
    throw error
  }
}

/**
 * Update sync settings and restart orchestrator as needed
 */
export function updateSyncSettings(newSettings: Partial<SyncSettings>): void {
  const state = useSyncStore.getState()
  const oldSettings = state.settings

  // Update settings in store
  state.updateSettings(newSettings)

  const mergedSettings = { ...oldSettings, ...newSettings }

  // Handle background sync changes
  if (
    "backgroundSyncEnabled" in newSettings ||
    "backgroundSyncInterval" in newSettings
  ) {
    if (mergedSettings.backgroundSyncEnabled) {
      startBackgroundSync(mergedSettings.backgroundSyncInterval)
    } else {
      stopBackgroundSync()
    }
  }
}

/**
 * Get orchestrator status
 */
export function getOrchestratorStatus(): {
  isInitialized: boolean
  backgroundSyncActive: boolean
  queuedChanges: number
} {
  return {
    isInitialized,
    backgroundSyncActive: backgroundIntervalId !== null,
    queuedChanges: changeQueue.length,
  }
}

/**
 * Hook for stores to trigger realtime sync
 * Use this in store mutations
 */
export function createSyncTrigger(entityType: SyncEntityType) {
  return {
    onCreate: (entityId: string) => queueRealtimeSync(entityType, entityId, "create"),
    onUpdate: (entityId: string) => queueRealtimeSync(entityType, entityId, "update"),
    onDelete: (entityId: string) => queueRealtimeSync(entityType, entityId, "delete"),
  }
}
