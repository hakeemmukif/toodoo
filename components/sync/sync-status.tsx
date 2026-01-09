"use client"

import { useEffect, useState } from "react"
import { useSyncStore } from "@/stores/sync"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SyncStatusProps {
  className?: string
  compact?: boolean
}

export function SyncStatus({ className, compact = false }: SyncStatusProps) {
  const [mounted, setMounted] = useState(false)

  const isRunning = useSyncStore((state) => state.isRunning)
  const currentLayer = useSyncStore((state) => state.currentLayer)
  const unresolvedCount = useSyncStore((state) => state.unresolvedCount)
  const lastRun = useSyncStore((state) => state.lastRun)
  const getCriticalIssues = useSyncStore((state) => state.getCriticalIssues)
  const getWarningIssues = useSyncStore((state) => state.getWarningIssues)
  const runSync = useSyncStore((state) => state.runSync)
  const loadIssues = useSyncStore((state) => state.loadIssues)

  useEffect(() => {
    setMounted(true)
    loadIssues()
  }, [loadIssues])

  if (!mounted) return null

  const criticalCount = getCriticalIssues().length
  const warningCount = getWarningIssues().length

  const handleSync = async () => {
    try {
      await runSync({ layer1: true, runType: "manual" })
    } catch (error) {
      console.error("Sync failed:", error)
    }
  }

  // Determine status color and icon
  const getStatusInfo = () => {
    if (isRunning) {
      return {
        icon: Loader2,
        iconClass: "animate-spin text-blue-500",
        label: `Syncing Layer ${currentLayer}...`,
        bgClass: "bg-blue-500/10",
      }
    }

    if (criticalCount > 0) {
      return {
        icon: AlertCircle,
        iconClass: "text-red-500",
        label: `${criticalCount} critical issue${criticalCount > 1 ? "s" : ""}`,
        bgClass: "bg-red-500/10",
      }
    }

    if (warningCount > 0) {
      return {
        icon: AlertTriangle,
        iconClass: "text-yellow-500",
        label: `${warningCount} warning${warningCount > 1 ? "s" : ""}`,
        bgClass: "bg-yellow-500/10",
      }
    }

    if (unresolvedCount > 0) {
      return {
        icon: Info,
        iconClass: "text-blue-500",
        label: `${unresolvedCount} suggestion${unresolvedCount > 1 ? "s" : ""}`,
        bgClass: "bg-blue-500/10",
      }
    }

    return {
      icon: CheckCircle2,
      iconClass: "text-green-500",
      label: "All synced",
      bgClass: "bg-green-500/10",
    }
  }

  const status = getStatusInfo()
  const StatusIcon = status.icon

  // Format last run time
  const formatLastRun = () => {
    if (!lastRun) return "Never"
    const diff = Date.now() - new Date(lastRun.completedAt).getTime()
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={isRunning}
              className={cn("h-8 gap-1.5", className)}
            >
              <StatusIcon className={cn("h-4 w-4", status.iconClass)} />
              {unresolvedCount > 0 && (
                <span className="text-xs font-medium">{unresolvedCount}</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{status.label}</p>
            <p className="text-xs text-muted-foreground">
              Last sync: {formatLastRun()}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-3",
        status.bgClass,
        className
      )}
    >
      <div className="flex items-center gap-3">
        <StatusIcon className={cn("h-5 w-5", status.iconClass)} />
        <div>
          <p className="text-sm font-medium">{status.label}</p>
          <p className="text-xs text-muted-foreground">
            Last sync: {formatLastRun()}
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isRunning}
        className="gap-1.5"
      >
        <RefreshCw className={cn("h-4 w-4", isRunning && "animate-spin")} />
        {isRunning ? "Syncing..." : "Sync Now"}
      </Button>
    </div>
  )
}
