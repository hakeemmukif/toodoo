"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OutcomeGoal } from "@/lib/types"
import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface OutcomeTrackerProps {
  outcome: OutcomeGoal
  onUpdateValue?: (newValue: number) => void
}

export function OutcomeTracker({ outcome, onUpdateValue }: OutcomeTrackerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(outcome.currentValue.toString())

  const progress = outcome.targetValue > 0
    ? Math.min((outcome.currentValue / outcome.targetValue) * 100, 100)
    : 0
  const remaining = outcome.targetValue - outcome.currentValue
  const isGoalReached = outcome.currentValue >= outcome.targetValue

  // Calculate trend from checkpoints
  const recentCheckpoints = outcome.checkpoints
    .filter((c) => c.actualValue !== undefined)
    .slice(-2)

  let trend: "up" | "down" | "flat" = "flat"
  if (recentCheckpoints.length >= 2) {
    const [prev, current] = recentCheckpoints
    if (current.actualValue! > prev.actualValue!) {
      trend = "up"
    } else if (current.actualValue! < prev.actualValue!) {
      trend = "down"
    }
  }

  const handleSave = () => {
    const value = parseFloat(inputValue)
    if (!isNaN(value) && onUpdateValue) {
      onUpdateValue(value)
      setIsEditing(false)
    }
  }

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-rose-600" />
          Outcome Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Progress Display */}
        <div className="text-center">
          <div className="text-4xl font-bold">
            {outcome.currentValue.toLocaleString()}
            <span className="text-lg font-normal text-muted-foreground"> {outcome.unit}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            of {outcome.targetValue.toLocaleString()} {outcome.unit} target
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="relative h-4 overflow-hidden rounded-full bg-muted">
            <div
              className={`absolute inset-y-0 left-0 transition-all ${
                isGoalReached ? "bg-green-500" : "bg-rose-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{Math.round(progress)}% complete</span>
            {!isGoalReached && (
              <span>
                {remaining.toLocaleString()} {outcome.unit} to go
              </span>
            )}
          </div>
        </div>

        {/* Goal Reached Banner */}
        {isGoalReached && (
          <div className="rounded-lg bg-green-500/10 p-4 text-center">
            <p className="text-lg font-semibold text-green-700">Target Reached!</p>
            <p className="text-sm text-green-600">Congratulations on hitting your goal.</p>
          </div>
        )}

        {/* Trend Indicator */}
        {recentCheckpoints.length >= 2 && (
          <div className="flex items-center justify-center gap-2">
            <TrendIcon className={`h-5 w-5 ${trendColor}`} />
            <span className={`text-sm font-medium ${trendColor}`}>
              {trend === "up" ? "Trending up" : trend === "down" ? "Trending down" : "Holding steady"}
            </span>
          </div>
        )}

        {/* Update Value */}
        {onUpdateValue && (
          <div className="space-y-3">
            {isEditing ? (
              <div className="space-y-2">
                <Label>Update current value</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    className="flex-1"
                    autoFocus
                  />
                  <Button onClick={handleSave}>Save</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setInputValue(outcome.currentValue.toString())
                  setIsEditing(true)
                }}
              >
                Update Progress
              </Button>
            )}
          </div>
        )}

        {/* Checkpoints */}
        {outcome.checkpoints.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Checkpoints</p>
            <div className="space-y-2">
              {outcome.checkpoints.map((checkpoint, index) => {
                const date = new Date(checkpoint.date)
                const isPast = date < new Date()
                const isOnTrack = checkpoint.actualValue !== undefined
                  ? checkpoint.actualValue >= checkpoint.targetValue
                  : false

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      checkpoint.actualValue !== undefined
                        ? isOnTrack
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-red-500/30 bg-red-500/5"
                        : isPast
                          ? "border-orange-500/30 bg-orange-500/5"
                          : "border-border"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {date.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Target: {checkpoint.targetValue} {outcome.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      {checkpoint.actualValue !== undefined ? (
                        <>
                          <p className="text-sm font-bold">
                            {checkpoint.actualValue} {outcome.unit}
                          </p>
                          <p className={`text-xs ${isOnTrack ? "text-green-600" : "text-red-600"}`}>
                            {isOnTrack ? "On track" : "Behind"}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {isPast ? "Not recorded" : "Upcoming"}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
