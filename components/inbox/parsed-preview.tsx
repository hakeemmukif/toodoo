"use client"

import { useState, useEffect } from "react"
import type { ParsedResult, LifeAspect, TimePreference, Task, TaskBreakdown, GoalMatch, ConflictCheckResult } from "@/lib/types"
import { ASPECT_CONFIG } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AspectBadge } from "@/components/aspect-badge"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Clock,
  MapPin,
  Timer,
  Check,
  Pencil,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Target,
  Plus,
  Loader2,
} from "lucide-react"
import { GoalSelector } from "./goal-selector"
import { ConflictWarning } from "./conflict-warning"
import { checkTimeConflict } from "@/services/conflict-detector"
import { format } from "date-fns"

interface ParsedPreviewProps {
  parsed: ParsedResult
  originalText: string
  isEnhancing?: boolean
  onConfirm: (task: Partial<Task>, breakdown?: TaskBreakdown) => void
  onEdit: () => void
  onDismiss: () => void
  onCreateGoal?: () => void
  onTimeChange?: (newTime: string) => void
  className?: string
}

// Confidence color based on level
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "oklch(0.72 0.19 142.5)" // green
  if (confidence >= 0.5) return "oklch(0.76 0.15 55)" // yellow/amber
  return "oklch(0.63 0.21 25)" // red
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "High"
  if (confidence >= 0.5) return "Medium"
  return "Low"
}

// Confidence badge component
function ConfidenceBadge({
  confidence,
  size = "sm",
}: {
  confidence: number
  size?: "sm" | "md"
}) {
  const color = getConfidenceColor(confidence)
  const label = getConfidenceLabel(confidence)

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-mono",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
      style={{
        backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
        color: color,
      }}
      title={`${Math.round(confidence * 100)}% confidence`}
    >
      {Math.round(confidence * 100)}%
    </span>
  )
}

// Extracted slot display
function SlotDisplay({
  icon: Icon,
  label,
  value,
  confidence,
  source,
}: {
  icon: React.ElementType
  label: string
  value: string
  confidence?: number
  source?: "rule" | "llm"
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {confidence !== undefined && <ConfidenceBadge confidence={confidence} />}
          {source === "llm" && (
            <span title="AI enhanced">
              <Sparkles className="h-3 w-3 text-purple-500" />
            </span>
          )}
        </div>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export function ParsedPreview({
  parsed,
  originalText,
  isEnhancing = false,
  onConfirm,
  onEdit,
  onDismiss,
  onCreateGoal,
  onTimeChange,
  className,
}: ParsedPreviewProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<GoalMatch | null>(parsed.goalMatch)
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    parsed.suggestedTask.hardScheduledTime
  )

  const { suggestedTask, suggestedBreakdown, confidenceLevel, parsingMethod } = parsed

  // Check for time conflicts when time or date changes
  useEffect(() => {
    const checkConflicts = async () => {
      const time = selectedTime || suggestedTask.hardScheduledTime
      const date = suggestedTask.scheduledDate

      if (time && date) {
        try {
          const result = await checkTimeConflict(
            date,
            time,
            suggestedTask.durationEstimate || 60
          )
          setConflictResult(result)
        } catch (error) {
          console.error("Failed to check time conflicts:", error)
          setConflictResult(null)
        }
      } else {
        setConflictResult(null)
      }
    }

    checkConflicts()
  }, [selectedTime, suggestedTask.hardScheduledTime, suggestedTask.scheduledDate, suggestedTask.durationEstimate])

  // Handle time selection from conflict warning
  const handleSelectAlternativeTime = (time: string) => {
    setSelectedTime(time)
    onTimeChange?.(time)
  }

  // Check if we have a hard conflict (blocks creation)
  const hasHardConflict = conflictResult?.conflicts.some(
    (c) => c.conflictType === "exact" || c.conflictType === "overlap"
  ) ?? false

  const isHighConfidence = confidenceLevel === "high"
  const aspectConfig = suggestedTask.aspect ? ASPECT_CONFIG[suggestedTask.aspect] : null

  // Format time for display
  const formatTimeDisplay = (time?: string, preference?: TimePreference): string => {
    if (time) {
      const [hours, minutes] = time.split(":").map(Number)
      const period = hours >= 12 ? "pm" : "am"
      const displayHours = hours % 12 || 12
      return minutes > 0 ? `${displayHours}:${String(minutes).padStart(2, "0")}${period}` : `${displayHours}${period}`
    }
    if (preference && preference !== "anytime") {
      return preference.charAt(0).toUpperCase() + preference.slice(1)
    }
    return "Anytime"
  }

  const handleConfirm = () => {
    // Build task with selected time and goal
    const taskWithUpdates = {
      ...suggestedTask,
      ...(selectedTime && { hardScheduledTime: selectedTime }),
      ...(selectedGoal && { weeklyGoalId: selectedGoal.weeklyGoalId }),
    }
    onConfirm(taskWithUpdates, suggestedBreakdown)
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-2 transition-colors",
        isHighConfidence
          ? "border-green-500/30 bg-green-50/30 dark:bg-green-950/10"
          : "border-yellow-500/30 bg-yellow-50/30 dark:bg-yellow-950/10",
        className
      )}
    >
      <CardContent className="space-y-4 p-4">
        {/* Header with confidence */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              {isHighConfidence ? (
                <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
                  <Check className="mr-1 h-3 w-3" />
                  Ready to Create
                </Badge>
              ) : (
                <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Review Suggested
                </Badge>
              )}
              {isEnhancing && (
                <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Enhancing...
                </span>
              )}
              {!isEnhancing && parsingMethod === "hybrid" && (
                <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-3 w-3" />
                  AI Enhanced
                </span>
              )}
            </div>
            <p className="text-sm italic text-muted-foreground">"{originalText}"</p>
          </div>
        </div>

        {/* Conflict Warning */}
        {conflictResult && conflictResult.conflicts.length > 0 && (
          <ConflictWarning
            conflicts={conflictResult.conflicts}
            suggestedTimes={conflictResult.suggestedTimes}
            onSelectTime={handleSelectAlternativeTime}
            onCustomTime={onEdit}
          />
        )}

        {/* Suggested task title */}
        {suggestedTask.title && (
          <div className="flex items-center gap-2">
            {aspectConfig && <AspectBadge aspect={suggestedTask.aspect!} />}
            <h3 className="flex-1 font-semibold">{suggestedTask.title}</h3>
          </div>
        )}

        {/* Extracted slots grid */}
        <div className="grid grid-cols-2 gap-3">
          {parsed.when?.date && (
            <SlotDisplay
              icon={Calendar}
              label="Date"
              value={format(new Date(parsed.when.date.value), "EEE, MMM d")}
              confidence={parsed.when.date.confidence}
              source={parsed.when.date.source}
            />
          )}
          {(parsed.when?.time || parsed.when?.timePreference || selectedTime) && (
            <SlotDisplay
              icon={Clock}
              label="Time"
              value={formatTimeDisplay(
                selectedTime || parsed.when?.time?.value,
                parsed.when?.timePreference?.value
              )}
              confidence={selectedTime && selectedTime !== parsed.when?.time?.value ? 1.0 : (parsed.when?.time?.confidence ?? parsed.when?.timePreference?.confidence)}
              source={selectedTime && selectedTime !== parsed.when?.time?.value ? "rule" : (parsed.when?.time?.source ?? parsed.when?.timePreference?.source)}
            />
          )}
          {parsed.where && (
            <SlotDisplay
              icon={MapPin}
              label="Location"
              value={parsed.where.value}
              confidence={parsed.where.confidence}
              source={parsed.where.source}
            />
          )}
          {parsed.duration && (
            <SlotDisplay
              icon={Timer}
              label="Duration"
              value={`${parsed.duration.value} min`}
              confidence={parsed.duration.confidence}
              source={parsed.duration.source}
            />
          )}
        </div>

        {/* Goal Link Section - Always show for confirmation */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Goal Link
          </div>

          {selectedGoal ? (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{selectedGoal.goalTitle}</p>
                {selectedGoal.frequencyProgress && (
                  <p className="text-xs text-muted-foreground">
                    {selectedGoal.frequencyProgress.current}/{selectedGoal.frequencyProgress.target} this {selectedGoal.frequencyProgress.period}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceBadge confidence={selectedGoal.matchConfidence} />
                <GoalSelector
                  currentGoal={selectedGoal}
                  alternatives={parsed.alternativeGoals}
                  onSelect={setSelectedGoal}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              <span>No matching goals found</span>
              {onCreateGoal && (
                <Button variant="ghost" size="sm" onClick={onCreateGoal} className="h-7">
                  <Plus className="mr-1 h-3 w-3" />
                  Create Goal
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Task Breakdown Preview */}
        {suggestedBreakdown && suggestedBreakdown.steps.length > 0 && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <span className="font-medium">
                Task Breakdown ({suggestedBreakdown.steps.length} steps)
              </span>
              {showBreakdown ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showBreakdown && (
              <div className="space-y-2 pl-2">
                {/* Implementation Intention */}
                <div className="rounded-lg border border-border/50 bg-card p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Start Trigger
                  </p>
                  <p className="text-sm">{suggestedBreakdown.trigger}</p>
                  {suggestedBreakdown.environmentalCue && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cue: {suggestedBreakdown.environmentalCue}
                    </p>
                  )}
                </div>

                {/* Steps */}
                <div className="space-y-1">
                  {suggestedBreakdown.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 rounded px-2 py-1 text-sm"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="flex-1">{step.title}</span>
                      {step.duration && (
                        <span className="text-xs text-muted-foreground">
                          {step.duration}min
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Completion Criteria */}
                <div className="rounded-lg border border-border/50 bg-card p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Done When
                  </p>
                  <p className="text-sm">{suggestedBreakdown.completionCriteria}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 border-t bg-muted/30 p-3">
        <Button variant="ghost" size="sm" onClick={onDismiss} className="text-muted-foreground">
          Dismiss
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-1 h-3 w-3" />
          Edit
        </Button>
        <Button size="sm" onClick={handleConfirm} disabled={!suggestedTask.title || hasHardConflict}>
          <Check className="mr-1 h-3 w-3" />
          {hasHardConflict ? "Resolve Conflict" : isHighConfidence ? "Create Task" : "Create Anyway"}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Minimal version for inline use
export function ParsedPreviewCompact({
  parsed,
  onConfirm,
  className,
}: {
  parsed: ParsedResult
  onConfirm: () => void
  className?: string
}) {
  const { suggestedTask, confidenceLevel } = parsed
  const isHighConfidence = confidenceLevel === "high"

  if (!isHighConfidence || !suggestedTask.title) return null

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-50/30 px-3 py-2 dark:bg-green-950/10",
        className
      )}
    >
      {suggestedTask.aspect && <AspectBadge aspect={suggestedTask.aspect} />}
      <span className="flex-1 truncate text-sm font-medium">{suggestedTask.title}</span>
      <Button size="sm" variant="ghost" onClick={onConfirm} className="h-7 px-2">
        <Check className="mr-1 h-3 w-3" />
        Quick Add
      </Button>
    </div>
  )
}
