"use client"

import { cn } from "@/lib/utils"
import type { TemperatureHint } from "@/lib/types"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

interface TemperatureIndicatorProps {
  hint: TemperatureHint
  compact?: boolean
}

export function TemperatureIndicator({ hint, compact }: TemperatureIndicatorProps) {
  const Icon = hint.severity === "ok"
    ? CheckCircle2
    : hint.severity === "warning"
    ? AlertTriangle
    : XCircle

  const colorClasses = {
    ok: "text-green-600 bg-green-500/10 border-green-500/30",
    warning: "text-yellow-600 bg-yellow-500/10 border-yellow-500/30",
    mismatch: "text-red-600 bg-red-500/10 border-red-500/30",
  }

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border",
          colorClasses[hint.severity]
        )}
        title={hint.message}
      >
        <Icon className="h-3 w-3" />
        <span>{hint.temperatureRange.min === hint.temperatureRange.max
          ? `${hint.temperatureRange.min}C`
          : `${hint.temperatureRange.min}-${hint.temperatureRange.max}C`
        }</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1 text-xs border",
        colorClasses[hint.severity]
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{hint.message}</span>
    </div>
  )
}
