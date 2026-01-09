"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAirFryerStore } from "@/stores/air-fryer"
import type { AirFryerRecipe, RecipeStep } from "@/lib/types"
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Thermometer,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
} from "lucide-react"

interface GuidedCookModeProps {
  recipe: AirFryerRecipe
  onComplete: () => void
  onCancel: () => void
}

export function GuidedCookMode({ recipe, onComplete, onCancel }: GuidedCookModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const { markCooked } = useAirFryerStore()

  const currentStep = recipe.steps[currentStepIndex]
  const isLastStep = currentStepIndex === recipe.steps.length - 1
  const progress = ((currentStepIndex + 1) / recipe.steps.length) * 100

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false)
            // Play notification sound
            playNotification()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerRunning, timerSeconds])

  // Set timer when step changes
  useEffect(() => {
    if (currentStep.durationMinutes) {
      setTimerSeconds(currentStep.durationMinutes * 60)
      setTimerRunning(false)
    } else {
      setTimerSeconds(0)
    }
  }, [currentStepIndex, currentStep.durationMinutes])

  const playNotification = useCallback(() => {
    // Try to play a notification sound
    try {
      const audio = new Audio("/notification.mp3")
      audio.play().catch(() => {
        // Fallback: vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200])
        }
      })
    } catch {
      // Silent fail
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleNextStep = () => {
    // Mark current step as completed
    if (!completedSteps.includes(currentStepIndex)) {
      setCompletedSteps([...completedSteps, currentStepIndex])
    }

    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const handleComplete = async () => {
    // Mark recipe as cooked
    await markCooked(recipe.id, recipe.servings)
    onComplete()
  }

  const getStepSettings = () => {
    return currentStep.airFryerSettings || recipe.airFryerSettings
  }

  const settings = getStepSettings()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Exit
        </Button>
        <h2 className="text-lg font-semibold">{recipe.title}</h2>
        <div className="w-20" /> {/* Spacer */}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStepIndex + 1} of {recipe.steps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Air Fryer Settings Card */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardContent className="flex items-center justify-around p-4">
          <div className="text-center">
            <Thermometer className="mx-auto h-6 w-6 text-orange-500" />
            <p className="mt-1 text-2xl font-bold">
              {settings.temperature}°{settings.temperatureUnit}
            </p>
            <p className="text-xs text-muted-foreground">Temperature</p>
          </div>
          <div className="text-center">
            <Clock className="mx-auto h-6 w-6 text-orange-500" />
            <p className="mt-1 text-2xl font-bold">{settings.timeMinutes}m</p>
            <p className="text-xs text-muted-foreground">Cook Time</p>
          </div>
          {settings.shakeHalfway && (
            <div className="text-center">
              <RotateCcw className="mx-auto h-6 w-6 text-orange-500" />
              <p className="mt-1 text-sm font-medium">Shake</p>
              <p className="text-xs text-muted-foreground">Halfway</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {completedSteps.includes(currentStepIndex) ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {currentStepIndex + 1}
              </span>
            )}
            Step {currentStepIndex + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">{currentStep.instruction}</p>

          {/* Tip */}
          {currentStep.tip && (
            <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 p-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-blue-500" />
              <p className="text-sm text-blue-700 dark:text-blue-300">{currentStep.tip}</p>
            </div>
          )}

          {/* Timer */}
          {currentStep.durationMinutes && (
            <div className="flex flex-col items-center gap-3 rounded-lg bg-muted p-4">
              <p className="text-4xl font-mono font-bold">
                {formatTime(timerSeconds)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimerRunning(!timerRunning)}
                >
                  {timerRunning ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTimerSeconds(currentStep.durationMinutes! * 60)
                    setTimerRunning(false)
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              {timerSeconds === 0 && currentStep.durationMinutes && (
                <div className="flex items-center gap-2 text-green-600">
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Timer complete!</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
          className="flex-1"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleNextStep} className="flex-1">
          {isLastStep ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Done
            </>
          ) : (
            <>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Step Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">All Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recipe.steps.map((step, index) => (
              <button
                key={index}
                onClick={() => setCurrentStepIndex(index)}
                className={`flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm transition-colors ${
                  index === currentStepIndex
                    ? "bg-primary/10 text-primary"
                    : completedSteps.includes(index)
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : "hover:bg-muted"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                    completedSteps.includes(index)
                      ? "bg-green-500 text-white"
                      : index === currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {completedSteps.includes(index) ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="line-clamp-1">{step.instruction}</span>
                {step.durationMinutes && (
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {step.durationMinutes}m
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
