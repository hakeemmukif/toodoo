"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AspectBadge } from "@/components/aspect-badge"
import { cn } from "@/lib/utils"
import { parseInboxItem } from "@/services/inbox-parser"
import { useTasksStore } from "@/stores/tasks"
import { formatDate } from "@/db"
import type { ParsedResult, TaskPriority } from "@/lib/types"
import {
  Flag,
  Calendar,
  Clock,
  MapPin,
  Timer,
  Loader2,
  Plus,
  Check,
  type LucideIcon,
} from "lucide-react"
import { format } from "date-fns"

interface QuickAddInputProps {
  className?: string
  onTaskCreated?: () => void
}

// Priority configuration - only priority gets colored box (like Todoist)
const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bgColor: string }> = {
  1: { color: "#ffffff", bgColor: "rgba(179, 58, 58, 0.95)" },     // urgent - dark red
  2: { color: "#ffffff", bgColor: "rgba(219, 125, 8, 0.95)" },     // high - orange
  3: { color: "#ffffff", bgColor: "rgba(41, 98, 194, 0.95)" },     // medium - blue
  4: { color: "#ffffff", bgColor: "rgba(105, 105, 105, 0.9)" },    // low - gray
}

// Token types: only priority gets box, date/time get bold
type TokenType = "priority" | "date" | "time" | "text"

interface Token {
  type: TokenType
  value: string
  priority?: TaskPriority
}

// Patterns for tokenization
const TOKEN_PATTERNS: { type: TokenType; regex: RegExp; getPriority?: (match: string) => TaskPriority }[] = [
  { type: "priority", regex: /\b(p[1-4])\b/gi, getPriority: (m) => parseInt(m.charAt(1), 10) as TaskPriority },
  { type: "time", regex: /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/gi },
  { type: "date", regex: /\b(today|tomorrow|tmr|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi },
]

// Tokenize input for inline highlighting
function tokenizeInput(text: string): Token[] {
  const matches: { type: TokenType; value: string; index: number; priority?: TaskPriority }[] = []

  for (const pattern of TOKEN_PATTERNS) {
    let match
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        type: pattern.type,
        value: match[0],
        index: match.index,
        priority: pattern.getPriority?.(match[0]),
      })
    }
  }

  matches.sort((a, b) => a.index - b.index)

  // Remove overlapping matches
  const filtered: typeof matches = []
  let lastEnd = 0
  for (const m of matches) {
    if (m.index >= lastEnd) {
      filtered.push(m)
      lastEnd = m.index + m.value.length
    }
  }

  // Build tokens
  const tokens: Token[] = []
  let idx = 0
  for (const m of filtered) {
    if (m.index > idx) tokens.push({ type: "text", value: text.slice(idx, m.index) })
    tokens.push({ type: m.type, value: m.value, priority: m.priority })
    idx = m.index + m.value.length
  }
  if (idx < text.length) tokens.push({ type: "text", value: text.slice(idx) })

  return tokens
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export function QuickAddInput({ className, onTaskCreated }: QuickAddInputProps) {
  const [input, setInput] = useState("")
  const [parsed, setParsed] = useState<ParsedResult | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const addTask = useTasksStore((state) => state.addTask)

  // Debounce input for parsing (200ms)
  const debouncedInput = useDebounce(input.trim(), 200)

  // Tokenize input for inline highlighting (immediate, no debounce)
  const tokens = tokenizeInput(input)

  // Parse input when debounced value changes
  useEffect(() => {
    if (!debouncedInput) {
      setParsed(null)
      return
    }

    let cancelled = false
    setIsParsing(true)

    parseInboxItem(debouncedInput).then((result) => {
      if (!cancelled) {
        setParsed(result)
        setIsParsing(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [debouncedInput])

  // Handle task creation
  const handleCreate = useCallback(async () => {
    if (!parsed?.suggestedTask?.title) return

    setIsCreating(true)
    try {
      const task = {
        title: parsed.suggestedTask.title,
        aspect: parsed.suggestedTask.aspect || "chores",
        scheduledDate: parsed.suggestedTask.scheduledDate || formatDate(new Date()),
        timePreference: parsed.suggestedTask.timePreference || "anytime",
        hardScheduledTime: parsed.suggestedTask.hardScheduledTime,
        durationEstimate: parsed.suggestedTask.durationEstimate,
        location: parsed.suggestedTask.location,
        priority: parsed.suggestedTask.priority,
        weeklyGoalId: parsed.suggestedTask.weeklyGoalId,
        who: parsed.suggestedTask.who,
        whoType: parsed.suggestedTask.whoType,
        status: "pending" as const,
        deferCount: 0,
      }

      await addTask(task)
      setInput("")
      setParsed(null)
      onTaskCreated?.()
    } finally {
      setIsCreating(false)
    }
  }, [parsed, addTask, onTaskCreated])

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && parsed?.suggestedTask?.title) {
        e.preventDefault()
        handleCreate()
      }
    },
    [parsed, handleCreate]
  )

  // Focus the input when clicking the container
  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  // Determine border color based on confidence
  const borderClass = parsed?.confidenceLevel === "high"
    ? "border-green-500/50 focus-within:border-green-500"
    : parsed?.confidenceLevel === "medium"
    ? "border-yellow-500/50 focus-within:border-yellow-500"
    : "border-border focus-within:border-ring"

  // Check if we can create
  const canCreate = parsed?.suggestedTask?.title && !isCreating

  return (
    <div className={cn("space-y-2", className)}>
      {/* Input container with overlay */}
      <div
        onClick={handleContainerClick}
        className={cn(
          "flex items-center gap-2 rounded-lg border-2 bg-background px-3 py-2 transition-colors cursor-text",
          borderClass
        )}
      >
        <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />

        {/* Input wrapper with overlay for token highlighting */}
        <div className="relative flex-1 min-w-0 overflow-visible">
          {/* Overlay with styled tokens - only shows when there's input */}
          {input && (
            <div
              className="absolute inset-y-0 -left-1 -right-1 z-0 pointer-events-none whitespace-pre text-sm leading-normal pl-1"
              aria-hidden="true"
            >
              {tokens.map((token, idx) => {
                // Only priority gets colored box - everything else is normal text
                if (token.type === "priority" && token.priority) {
                  const style = PRIORITY_CONFIG[token.priority]
                  return (
                    <span
                      key={idx}
                      className="rounded"
                      style={{
                        boxShadow: `0 0 0 4px ${style.bgColor}`,
                        backgroundColor: style.bgColor,
                        color: style.color,
                        borderRadius: "4px",
                      }}
                    >
                      {token.value}
                    </span>
                  )
                }

                // All other text: normal styling
                return <span key={idx} className="text-foreground">{token.value}</span>
              })}
            </div>
          )}

          {/* Actual input - text transparent when has input (overlay shows), visible when empty (shows placeholder) */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Quick add... (e.g., training tomorrow 7pm p1)"
            className={cn(
              "relative z-10 w-full bg-transparent text-sm leading-normal outline-none placeholder:text-muted-foreground caret-foreground",
              input ? "text-transparent" : "text-foreground"
            )}
          />
        </div>

        {isCreating ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : isParsing && input.trim() ? (
          <div className="h-4 w-4 shrink-0">
            <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
          </div>
        ) : canCreate ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCreate}
            className="h-7 shrink-0 px-2 text-green-600 hover:bg-green-100 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
          >
            <Check className="mr-1 h-3 w-3" />
            Add
          </Button>
        ) : null}
      </div>

      {/* Live preview badges */}
      {parsed && input.trim() && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          {/* Priority badge */}
          {parsed.priority && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: PRIORITY_CONFIG[parsed.priority.value].bgColor,
                color: PRIORITY_CONFIG[parsed.priority.value].color,
              }}
            >
              <Flag className="h-3 w-3" />
              P{parsed.priority.value}
            </span>
          )}

          {/* Aspect badge */}
          {parsed.intent && (
            <AspectBadge aspect={parsed.intent.value} />
          )}

          {/* Date badge */}
          {parsed.when?.date && (
            <PreviewBadge
              icon={Calendar}
              label={format(new Date(parsed.when.date.value), "EEE, MMM d")}
            />
          )}

          {/* Time badge */}
          {parsed.when?.time && (
            <PreviewBadge
              icon={Clock}
              label={formatTime(parsed.when.time.value)}
            />
          )}

          {/* Duration badge */}
          {parsed.duration && (
            <PreviewBadge
              icon={Timer}
              label={`${parsed.duration.value}min`}
            />
          )}

          {/* Location badge */}
          {parsed.where && (
            <PreviewBadge
              icon={MapPin}
              label={parsed.where.value}
            />
          )}
        </div>
      )}

      {/* Helper text */}
      {!input.trim() && (
        <p className="px-1 text-xs text-muted-foreground">
          Use p1-p4 for priority, dates like "tomorrow" or "friday", times like "7pm"
        </p>
      )}
    </div>
  )
}

// Format 24h time to 12h
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number)
  const period = hours >= 12 ? "pm" : "am"
  const displayHours = hours % 12 || 12
  return minutes > 0 ? `${displayHours}:${String(minutes).padStart(2, "0")}${period}` : `${displayHours}${period}`
}

// Preview badge component
function PreviewBadge({
  icon: Icon,
  label,
  color,
}: {
  icon: LucideIcon
  label: string
  color?: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: color
          ? `color-mix(in oklch, ${color} 15%, transparent)`
          : "var(--muted)",
        color: color || "var(--muted-foreground)",
      }}
    >
      <Icon className="h-3 w-3" />
      <span className="max-w-[120px] truncate">{label}</span>
    </span>
  )
}
