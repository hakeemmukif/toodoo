import { cn } from "@/lib/utils"

type ConfidenceLevel = "high" | "medium" | "low"

interface ConfidenceBadgeProps {
  confidence: number
  size?: "sm" | "md"
  showLabel?: boolean
  className?: string
}

function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return "high"
  if (confidence >= 0.5) return "medium"
  return "low"
}

function getConfidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return "High"
    case "medium":
      return "Medium"
    case "low":
      return "Low"
  }
}

const levelStyles: Record<ConfidenceLevel, string> = {
  high: "bg-confidence-high-bg text-confidence-high",
  medium: "bg-confidence-medium-bg text-confidence-medium",
  low: "bg-confidence-low-bg text-confidence-low",
}

export function ConfidenceBadge({
  confidence,
  size = "sm",
  showLabel = false,
  className,
}: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(confidence)
  const label = getConfidenceLabel(level)
  const percentage = Math.round(confidence * 100)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-mono",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        levelStyles[level],
        className
      )}
      title={`${percentage}% confidence - ${label}`}
      role="status"
      aria-label={`Confidence: ${percentage}%, ${label}`}
    >
      {percentage}%
      {showLabel && <span className="font-sans">{label}</span>}
    </span>
  )
}

// Utility function for external use
export { getConfidenceLevel, getConfidenceLabel }
