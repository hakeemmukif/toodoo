"use client"

import { useEffect, useState, useCallback } from "react"
import type { OllamaStatus } from "@/lib/types"
import { checkOllamaConnection } from "@/services/ollama"
import { cn } from "@/lib/utils"
import { Sparkles, Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface OllamaStatusIndicatorProps {
  /** Interval in ms to check connection (default: 30000 = 30s) */
  checkInterval?: number
  /** Show as compact badge or expanded indicator */
  variant?: "badge" | "indicator" | "inline"
  /** Show reconnect button when disconnected */
  showReconnect?: boolean
  /** Callback when status changes */
  onStatusChange?: (status: OllamaStatus) => void
  className?: string
}

export function OllamaStatusIndicator({
  checkInterval = 30000,
  variant = "badge",
  showReconnect = true,
  onStatusChange,
  className,
}: OllamaStatusIndicatorProps) {
  const [status, setStatus] = useState<OllamaStatus>("checking")
  const [isManualCheck, setIsManualCheck] = useState(false)

  const checkConnection = useCallback(async (isManual = false) => {
    if (isManual) setIsManualCheck(true)
    setStatus("checking")

    try {
      const connected = await checkOllamaConnection()
      const newStatus: OllamaStatus = connected ? "connected" : "disconnected"
      setStatus(newStatus)
      onStatusChange?.(newStatus)
    } catch {
      setStatus("disconnected")
      onStatusChange?.("disconnected")
    } finally {
      if (isManual) setIsManualCheck(false)
    }
  }, [onStatusChange])

  // Initial check and interval
  useEffect(() => {
    checkConnection()
    const interval = setInterval(() => checkConnection(), checkInterval)
    return () => clearInterval(interval)
  }, [checkConnection, checkInterval])

  const handleRetry = () => {
    if (status === "checking") return // Prevent spam clicks during check
    checkConnection(true)
  }

  // Badge variant - compact pill
  if (variant === "badge") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={handleRetry}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer hover:opacity-80",
                status === "connected" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                status === "disconnected" && "bg-muted text-muted-foreground",
                status === "checking" && "bg-muted text-muted-foreground animate-pulse",
                className
              )}
            >
              {status === "connected" && (
                <>
                  <Sparkles className="h-3 w-3" />
                  <span>AI Enhanced</span>
                </>
              )}
              {status === "disconnected" && (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Offline</span>
                </>
              )}
              {status === "checking" && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Checking</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {status === "connected" && "Click to check connection"}
            {status === "disconnected" && "Click to retry connection"}
            {status === "checking" && "Checking..."}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Indicator variant - dot with optional label
  if (variant === "indicator") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div onClick={handleRetry} className={cn("flex items-center gap-2 cursor-pointer hover:opacity-80", className)}>
              <span
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  status === "connected" && "bg-green-500",
                  status === "disconnected" && "bg-gray-400",
                  status === "checking" && "bg-yellow-500 animate-pulse"
                )}
              />
              <span className="text-xs text-muted-foreground">
                {status === "connected" && "Ollama"}
                {status === "disconnected" && "Offline"}
                {status === "checking" && "Checking..."}
              </span>
              {status === "disconnected" && showReconnect && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                  disabled={isManualCheck}
                >
                  <RefreshCw className={cn("h-3 w-3", isManualCheck && "animate-spin")} />
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {status === "connected" && "Click to check connection"}
            {status === "disconnected" && "Click to retry connection"}
            {status === "checking" && "Checking..."}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Inline variant - full status card
  return (
    <div
      onClick={handleRetry}
      className={cn(
        "flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer hover:opacity-90",
        status === "connected" && "border-green-500/30 bg-green-50/30 dark:bg-green-950/10",
        status === "disconnected" && "border-border bg-muted/30",
        status === "checking" && "border-yellow-500/30 bg-yellow-50/30 dark:bg-yellow-950/10",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {status === "connected" && (
          <>
            <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium">AI Parsing Active</p>
              <p className="text-xs text-muted-foreground">
                Ollama enhances parsing accuracy
              </p>
            </div>
          </>
        )}
        {status === "disconnected" && (
          <>
            <WifiOff className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Offline Mode</p>
              <p className="text-xs text-muted-foreground">
                Using rule-based parsing
              </p>
            </div>
          </>
        )}
        {status === "checking" && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm font-medium">Connecting...</p>
              <p className="text-xs text-muted-foreground">
                Checking Ollama status
              </p>
            </div>
          </>
        )}
      </div>
      {status === "disconnected" && showReconnect && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => { e.stopPropagation(); handleRetry(); }}
          disabled={isManualCheck}
          className="h-7"
        >
          {isManualCheck ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3 w-3" />
          )}
          Retry
        </Button>
      )}
    </div>
  )
}

// Simplified hook for getting Ollama status
export function useOllamaStatus(checkInterval = 30000) {
  const [status, setStatus] = useState<OllamaStatus>("checking")

  useEffect(() => {
    const check = async () => {
      try {
        const connected = await checkOllamaConnection()
        setStatus(connected ? "connected" : "disconnected")
      } catch {
        setStatus("disconnected")
      }
    }

    check()
    const interval = setInterval(check, checkInterval)
    return () => clearInterval(interval)
  }, [checkInterval])

  return status
}
