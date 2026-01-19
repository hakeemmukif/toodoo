"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useCookingSessionStore } from "@/stores/cooking-session"
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Thermometer,
  Clock,
  Bell,
  X,
  ChefHat,
} from "lucide-react"
import { formatMinuteOffset } from "@/services/cooking-optimizer"

export function SessionExecutor() {
  const {
    currentSession,
    getCurrentPhase,
    getProgress,
    completeEvent,
    completePhase,
    completeSession,
    cancelSession,
  } = useCookingSessionStore()

  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [currentEventIndex, setCurrentEventIndex] = useState(0)

  const currentPhase = getCurrentPhase()
  const progress = getProgress()

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false)
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

  // Reset timer when phase changes
  useEffect(() => {
    if (currentPhase) {
      setTimerSeconds(currentPhase.totalDurationMinutes * 60)
      setTimerRunning(false)
      setCurrentEventIndex(0)
    }
  }, [currentPhase?.id])

  const playNotification = useCallback(() => {
    try {
      const audio = new Audio("/notification.mp3")
      audio.play().catch(() => {
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

  const handleEventComplete = () => {
    if (!currentPhase || !currentSession) return

    const phaseIndex = currentSession.currentPhaseIndex ?? 0
    completeEvent(phaseIndex, currentEventIndex)

    // Check if this was the last event
    if (currentEventIndex >= currentPhase.events.length - 1) {
      // Phase is complete
      if (phaseIndex >= currentSession.phases.length - 1) {
        // All phases complete
        completeSession()
      } else {
        completePhase(phaseIndex)
      }
    } else {
      setCurrentEventIndex((prev) => prev + 1)
    }
  }

  const handleSkipToNextPhase = () => {
    if (!currentSession) return
    const phaseIndex = currentSession.currentPhaseIndex ?? 0

    if (phaseIndex >= currentSession.phases.length - 1) {
      completeSession()
    } else {
      completePhase(phaseIndex)
    }
  }

  if (!currentSession || currentSession.status !== "in_progress" || !currentPhase) {
    return null
  }

  const currentEvent = currentPhase.events[currentEventIndex]
  const elapsedMinutes = (currentPhase.totalDurationMinutes * 60 - timerSeconds) / 60
  const phaseProgress = (elapsedMinutes / currentPhase.totalDurationMinutes) * 100

  // Find upcoming events
  const upcomingEvents = currentPhase.events
    .slice(currentEventIndex)
    .filter((e) => !e.completed)
    .slice(0, 3)

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Phase {progress.currentPhase} of {progress.totalPhases}
            </span>
            <Badge variant="secondary">
              {progress.percentComplete}% Complete
            </Badge>
          </div>
          <Progress value={progress.percentComplete} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Phase */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-orange-500" />
              {currentPhase.targetTemperature}C
            </CardTitle>
            <div className="text-3xl font-bold font-mono">
              {formatTime(timerSeconds)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phase Timer Progress */}
          <Progress value={phaseProgress} className="h-3" />

          {/* Timer Controls */}
          <div className="flex justify-center gap-4">
            <Button
              variant={timerRunning ? "secondary" : "default"}
              size="lg"
              onClick={() => setTimerRunning(!timerRunning)}
            >
              {timerRunning ? (
                <>
                  <Pause className="mr-2 h-5 w-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start Timer
                </>
              )}
            </Button>
          </div>

          {/* Current Event */}
          {currentEvent && (
            <div className="rounded-lg border-2 border-orange-500 bg-orange-500/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm text-muted-foreground">
                    {formatMinuteOffset(currentEvent.minuteOffset)}
                  </div>
                  <div className="font-medium text-lg mt-1">
                    {currentEvent.instruction}
                  </div>
                </div>
                <Button onClick={handleEventComplete}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 1 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Coming Up</div>
              {upcomingEvents.slice(1).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-lg bg-muted/50 p-2"
                >
                  <span className="font-mono text-xs text-muted-foreground w-12">
                    {formatMinuteOffset(event.minuteOffset)}
                  </span>
                  <span className="text-sm">{event.instruction}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items in this Phase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items Cooking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {currentSession.items
              .filter((item) => item.phaseId === currentPhase.id)
              .map((item) => {
                const itemDone = elapsedMinutes >= (item.endOffsetMinutes ?? item.timeMinutes)
                const itemStarted = elapsedMinutes >= (item.startOffsetMinutes ?? 0)

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      itemDone
                        ? "border-green-500 bg-green-500/10"
                        : itemStarted
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {itemDone ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : itemStarted ? (
                        <Clock className="h-5 w-5 text-orange-500 animate-pulse" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.timeMinutes}min @ {item.temperature}C
                        </div>
                      </div>
                    </div>
                    <Badge variant={itemDone ? "default" : itemStarted ? "secondary" : "outline"}>
                      {itemDone ? "Done" : itemStarted ? "Cooking" : "Waiting"}
                    </Badge>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={cancelSession}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={handleSkipToNextPhase}
        >
          <SkipForward className="mr-2 h-4 w-4" />
          {progress.currentPhase >= progress.totalPhases ? "Finish" : "Next Phase"}
        </Button>
      </div>
    </div>
  )
}
