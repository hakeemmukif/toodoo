"use client"

import { useState } from "react"
import type { DeepPromptQuestion, LifeAspect } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Check, SkipForward } from "lucide-react"
import * as LucideIcons from "lucide-react"

interface DeepPromptFlowProps {
  aspect: LifeAspect
  questions: DeepPromptQuestion[]
  onComplete: (answers: Record<string, string>) => void
  onSkip: () => void
  className?: string
}

export function DeepPromptFlow({
  aspect,
  questions,
  onComplete,
  onSkip,
  className,
}: DeepPromptFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const currentQuestion = questions[currentStep]
  const isLastStep = currentStep === questions.length - 1
  const canProceed = !currentQuestion?.required || answers[currentQuestion.questionKey]

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionKey]: value,
    }))

    // Auto-advance after selection (with slight delay for visual feedback)
    if (!isLastStep) {
      setTimeout(() => setCurrentStep((s) => s + 1), 200)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  const handleComplete = () => {
    if (canProceed) {
      onComplete(answers)
    }
  }

  const handleNext = () => {
    if (canProceed && !isLastStep) {
      setCurrentStep((s) => s + 1)
    }
  }

  // Get icon component by name
  const getIcon = (iconName?: string) => {
    if (!iconName) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (LucideIcons as any)[iconName]
    return IconComponent || null
  }

  if (!currentQuestion) {
    return null
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="space-y-4 p-4">
        {/* Progress Indicator */}
        <div className="flex items-center gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < currentStep
                  ? "bg-primary"
                  : i === currentStep
                    ? "bg-primary/60"
                    : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Question */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>
            {!currentQuestion.required && (
              <span className="text-xs text-muted-foreground">Optional</span>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {currentQuestion.options.map((option) => {
              const Icon = getIcon(option.icon)
              const isSelected = answers[currentQuestion.questionKey] === option.value

              return (
                <Button
                  key={option.value}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "h-auto flex-col gap-1 py-3 px-3",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span className="text-sm font-medium">{option.label}</span>
                    {isSelected && <Check className="ml-auto h-4 w-4 shrink-0" />}
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="gap-1 text-muted-foreground"
          >
            <SkipForward className="h-4 w-4" />
            Skip all
          </Button>

          {isLastStep ? (
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={!canProceed}
              className="gap-1"
            >
              Done
              <Check className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              disabled={!canProceed}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for inline use
export function DeepPromptCompact({
  question,
  selectedValue,
  onSelect,
  className,
}: {
  question: DeepPromptQuestion
  selectedValue?: string
  onSelect: (value: string) => void
  className?: string
}) {
  const getIcon = (iconName?: string) => {
    if (!iconName) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (LucideIcons as any)[iconName]
    return IconComponent || null
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-muted-foreground">{question.question}</p>
      <div className="flex flex-wrap gap-1.5">
        {question.options.map((option) => {
          const Icon = getIcon(option.icon)
          const isSelected = selectedValue === option.value

          return (
            <Button
              key={option.value}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn("h-8 gap-1.5 px-2.5", isSelected && "ring-1 ring-primary")}
              onClick={() => onSelect(option.value)}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {option.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
