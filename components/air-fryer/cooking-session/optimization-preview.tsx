"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCookingSessionStore } from "@/stores/cooking-session"
import {
  Thermometer,
  Clock,
  Play,
  ArrowLeft,
  CheckCircle2,
  Timer,
  Flame,
} from "lucide-react"
import { formatMinuteOffset } from "@/services/cooking-optimizer"

export function OptimizationPreview() {
  const {
    currentSession,
    startSession,
    resetOptimization,
  } = useCookingSessionStore()

  if (!currentSession || currentSession.status !== "optimized") {
    return null
  }

  const { phases, totalEstimatedMinutes, items } = currentSession

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Optimized Plan
            </CardTitle>
            <Badge variant="secondary" className="gap-1">
              <Timer className="h-3.5 w-3.5" />
              {totalEstimatedMinutes} min total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{items.length}</div>
              <div className="text-xs text-muted-foreground">Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{phases.length}</div>
              <div className="text-xs text-muted-foreground">Phases</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalEstimatedMinutes}</div>
              <div className="text-xs text-muted-foreground">Minutes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cooking Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {phases.map((phase, phaseIndex) => {
            const phaseItems = items.filter((item) => item.phaseId === phase.id)

            return (
              <div key={phase.id} className="relative">
                {/* Phase Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20">
                    <Flame className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Phase {phaseIndex + 1}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Thermometer className="h-3.5 w-3.5" />
                        {phase.targetTemperature}C
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {phase.totalDurationMinutes}min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phase Items */}
                <div className="ml-11 space-y-2 border-l-2 border-muted pl-4">
                  {phaseItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-2"
                    >
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Add at {formatMinuteOffset(item.startOffsetMinutes || 0)} -
                          Done at {formatMinuteOffset(item.endOffsetMinutes || item.timeMinutes)}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.timeMinutes}min
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Phase Events Summary */}
                <div className="ml-11 mt-2 pl-4">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View {phase.events.length} events
                    </summary>
                    <div className="mt-2 space-y-1">
                      {phase.events.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <span className="font-mono w-12">
                            {formatMinuteOffset(event.minuteOffset)}
                          </span>
                          <span>{event.instruction}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>

                {/* Rest period indicator */}
                {phase.restMinutesAfter > 0 && phaseIndex < phases.length - 1 && (
                  <div className="ml-11 mt-3 pl-4 text-xs text-muted-foreground italic">
                    {phase.restMinutesAfter}min rest before next phase
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={resetOptimization}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Edit Items
        </Button>
        <Button
          className="flex-1"
          onClick={startSession}
        >
          <Play className="mr-2 h-4 w-4" />
          Start Cooking
        </Button>
      </div>
    </div>
  )
}
