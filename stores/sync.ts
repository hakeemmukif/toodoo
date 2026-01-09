import { create } from "zustand"
import { persist } from "zustand/middleware"
import { db, generateId } from "@/db"
import type {
  SyncIssue,
  SyncRunResult,
  SyncSettings,
  SyncIssueSeverity,
} from "@/lib/types"
import {
  runIntegrityCheck,
  getUnresolvedIssues,
  resolveIssue as resolveIssueService,
  type IntegrityCheckResult,
} from "@/services/sync/integrity"
import { runSmartConnections } from "@/services/sync/smart-connections"
import { runCoherenceAudit } from "@/services/sync/coherence"

interface SyncState {
  // Issues
  issues: SyncIssue[]
  unresolvedCount: number

  // Run history
  lastRun: SyncRunResult | null
  runHistory: SyncRunResult[]

  // Status
  isRunning: boolean
  currentLayer: 1 | 2 | 3 | null
  error: string | null

  // Settings
  settings: SyncSettings

  // Hydration
  _hasHydrated: boolean

  // Actions
  loadIssues: () => Promise<void>
  runSync: (options?: { layer1?: boolean; layer2?: boolean; layer3?: boolean; runType?: "manual" | "background" | "realtime" }) => Promise<SyncRunResult>
  resolveIssue: (issueId: string, resolution: "linked" | "unlinked" | "ignored" | "deleted", newLinkId?: string) => Promise<void>
  dismissIssue: (issueId: string) => Promise<void>
  updateSettings: (settings: Partial<SyncSettings>) => void
  setHasHydrated: (state: boolean) => void

  // Computed
  getCriticalIssues: () => SyncIssue[]
  getWarningIssues: () => SyncIssue[]
  getInfoIssues: () => SyncIssue[]
  getIssuesByLayer: (layer: 1 | 2 | 3) => SyncIssue[]
}

const DEFAULT_SETTINGS: SyncSettings = {
  backgroundSyncEnabled: true,
  backgroundSyncInterval: 30,
  realtimeSyncEnabled: true,
  realtimeSyncDebounce: 2000,
  layer2Enabled: true,
  layer3Enabled: true,
  showSyncNotifications: true,
  autoResolveOrphanedLinks: false,
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      // Initial state
      issues: [],
      unresolvedCount: 0,
      lastRun: null,
      runHistory: [],
      isRunning: false,
      currentLayer: null,
      error: null,
      settings: DEFAULT_SETTINGS,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      loadIssues: async () => {
        try {
          const issues = await getUnresolvedIssues()
          set({
            issues,
            unresolvedCount: issues.length,
          })
        } catch (error) {
          console.error("Failed to load sync issues:", error)
          set({ error: "Failed to load sync issues" })
        }
      },

      runSync: async (options = {}) => {
        const {
          layer1 = true,
          layer2 = true,
          layer3 = true,
          runType = "manual",
        } = options

        const state = get()
        if (state.isRunning) {
          throw new Error("Sync already running")
        }

        const startedAt = new Date()
        set({ isRunning: true, error: null })

        const result: SyncRunResult = {
          id: generateId(),
          runType,
          startedAt,
          completedAt: new Date(),
          duration: 0,
          layer1: { ran: false, issuesFound: 0, issuesFixed: 0 },
          layer2: { ran: false, ollamaAvailable: false, suggestionsGenerated: 0 },
          layer3: { ran: false, ollamaAvailable: false, coherenceIssues: 0 },
          totalIssues: 0,
          newIssues: 0,
          resolvedIssues: 0,
        }

        try {
          // Layer 1: Data Integrity (always runs if enabled)
          if (layer1) {
            set({ currentLayer: 1 })
            const integrityResult = await runIntegrityCheck({
              autoResolve: state.settings.autoResolveOrphanedLinks,
            })
            result.layer1 = {
              ran: true,
              issuesFound: integrityResult.issuesFound,
              issuesFixed: integrityResult.issuesFixed,
            }
          }

          // Layer 2: Smart Connections
          if (layer2 && state.settings.layer2Enabled) {
            set({ currentLayer: 2 })
            const connectionsResult = await runSmartConnections()
            result.layer2 = {
              ran: connectionsResult.ran,
              ollamaAvailable: connectionsResult.ollamaAvailable,
              suggestionsGenerated: connectionsResult.suggestionsGenerated,
            }
          }

          // Layer 3: Coherence Audits
          if (layer3 && state.settings.layer3Enabled) {
            set({ currentLayer: 3 })
            const coherenceResult = await runCoherenceAudit()
            result.layer3 = {
              ran: coherenceResult.ran,
              ollamaAvailable: coherenceResult.ollamaAvailable,
              coherenceIssues: coherenceResult.coherenceIssues,
            }
          }

          // Calculate totals
          const completedAt = new Date()
          result.completedAt = completedAt
          result.duration = completedAt.getTime() - startedAt.getTime()
          result.totalIssues =
            result.layer1.issuesFound +
            result.layer2.suggestionsGenerated +
            result.layer3.coherenceIssues
          result.resolvedIssues = result.layer1.issuesFixed

          // Save run result
          await db.syncRuns.add(result)

          // Reload issues
          const updatedIssues = await getUnresolvedIssues()

          set({
            isRunning: false,
            currentLayer: null,
            lastRun: result,
            runHistory: [result, ...state.runHistory].slice(0, 10), // Keep last 10 runs
            issues: updatedIssues,
            unresolvedCount: updatedIssues.length,
          })

          return result
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Sync failed"
          set({
            isRunning: false,
            currentLayer: null,
            error: errorMessage,
          })
          throw error
        }
      },

      resolveIssue: async (issueId, resolution, newLinkId) => {
        try {
          await resolveIssueService(issueId, resolution, newLinkId)

          // Update local state
          set((state) => ({
            issues: state.issues.filter((i) => i.id !== issueId),
            unresolvedCount: state.unresolvedCount - 1,
          }))
        } catch (error) {
          console.error("Failed to resolve issue:", error)
          throw error
        }
      },

      dismissIssue: async (issueId) => {
        try {
          await resolveIssueService(issueId, "ignored")

          set((state) => ({
            issues: state.issues.filter((i) => i.id !== issueId),
            unresolvedCount: state.unresolvedCount - 1,
          }))
        } catch (error) {
          console.error("Failed to dismiss issue:", error)
          throw error
        }
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }))
      },

      // Computed getters
      getCriticalIssues: () => {
        return get().issues.filter((i) => i.severity === "critical")
      },

      getWarningIssues: () => {
        return get().issues.filter((i) => i.severity === "warning")
      },

      getInfoIssues: () => {
        return get().issues.filter((i) => i.severity === "info")
      },

      getIssuesByLayer: (layer) => {
        return get().issues.filter((i) => i.layer === layer)
      },
    }),
    {
      name: "sync-storage",
      partialize: (state) => ({
        settings: state.settings,
        runHistory: state.runHistory.slice(0, 5), // Only persist last 5 runs
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
