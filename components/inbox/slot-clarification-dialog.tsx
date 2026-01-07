"use client"

import { useState, useEffect } from "react"
import type { ClarificationState, SlotType, SlotQuestion } from "@/lib/types"
import { getSlotLabel } from "@/services/inbox-parser/slot-analyzer"
import { ASPECT_CONFIG } from "@/lib/constants"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Check, Sparkles, Loader2, Save } from "lucide-react"

interface SlotClarificationDialogProps {
  open: boolean
  state: ClarificationState | null
  isGenerating: boolean
  onAnswerChange: (slot: SlotType, value: string) => void
  onSubmit: () => void
  onCancel: () => void
  onSkip: () => void
}

// Render the appropriate input for each slot type
function SlotInput({
  question,
  value,
  onChange,
}: {
  question: SlotQuestion
  value: string
  onChange: (value: string) => void
}) {
  const { slot, inputType, placeholder, options } = question

  if (inputType === "select" && options) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder || "Select..."} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const aspectConfig = slot === "why" ? ASPECT_CONFIG[option.value as keyof typeof ASPECT_CONFIG] : null
            const Icon = aspectConfig?.icon

            return (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  {Icon && <Icon className="h-4 w-4" style={{ color: aspectConfig?.color }} />}
                  {option.label}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    )
  }

  if (inputType === "number") {
    return (
      <Input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full"
      />
    )
  }

  // Default text input (also works for datetime as free text)
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full"
    />
  )
}

// Display already extracted slots with checkmarks
function ExtractedSlotDisplay({
  slots,
}: {
  slots: { slot: SlotType; value: string | number }[]
}) {
  if (slots.length === 0) return null

  return (
    <div className="space-y-1.5">
      {slots.map(({ slot, value }) => {
        const label = getSlotLabel(slot)
        let displayValue = String(value)

        // Format aspect to human-readable
        if (slot === "why" && ASPECT_CONFIG[value as keyof typeof ASPECT_CONFIG]) {
          displayValue = ASPECT_CONFIG[value as keyof typeof ASPECT_CONFIG].label
        }

        return (
          <div
            key={slot}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Check className="h-3.5 w-3.5 text-green-500" />
            <span className="font-medium">{label}:</span>
            <span>{displayValue}</span>
          </div>
        )
      })}
    </div>
  )
}

export function SlotClarificationDialog({
  open,
  state,
  isGenerating,
  onAnswerChange,
  onSubmit,
  onCancel,
  onSkip,
}: SlotClarificationDialogProps) {
  const [localAnswers, setLocalAnswers] = useState<Partial<Record<SlotType, string>>>({})

  // Sync local state with external state when dialog opens
  useEffect(() => {
    if (state?.answers) {
      setLocalAnswers(state.answers)
    } else {
      setLocalAnswers({})
    }
  }, [state?.answers, open])

  if (!state) return null

  const { originalText, analysis, questions, generationMethod } = state

  // Get filled slots for display
  const filledSlots = analysis.slots
    .filter((s) => s.filled && s.value !== undefined)
    .map((s) => ({ slot: s.slot, value: s.value! }))

  // Check if all required questions are answered
  const requiredQuestions = questions.filter((q) => q.required)
  const answeredRequired = requiredQuestions.every(
    (q) => localAnswers[q.slot]?.trim()
  )

  const handleAnswerChange = (slot: SlotType, value: string) => {
    setLocalAnswers((prev) => ({ ...prev, [slot]: value }))
    onAnswerChange(slot, value)
  }

  const handleSubmit = () => {
    if (answeredRequired) {
      onSubmit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Quick clarification
            {generationMethod === "ai" && (
              <span className="flex items-center gap-1 text-xs font-normal text-purple-600 dark:text-purple-400">
                <Sparkles className="h-3 w-3" />
                AI Enhanced
              </span>
            )}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p className="italic text-sm">"{originalText}"</p>
              <ExtractedSlotDisplay slots={filledSlots} />
            </div>
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Generating questions...
            </span>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {questions.map((question) => (
              <div key={question.slot} className="space-y-2">
                <Label
                  htmlFor={`slot-${question.slot}`}
                  className={cn(
                    "text-sm font-medium",
                    question.required && "after:content-['*'] after:ml-0.5 after:text-destructive"
                  )}
                >
                  {question.question}
                </Label>
                <SlotInput
                  question={question}
                  value={localAnswers[question.slot] || ""}
                  onChange={(value) => handleAnswerChange(question.slot, value)}
                />
                {question.context && (
                  <p className="text-xs text-muted-foreground">{question.context}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-muted-foreground sm:mr-auto"
            disabled={isGenerating}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save to inbox anyway
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!answeredRequired || isGenerating}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
