"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { MasteryGoal, SkillLevel } from "@/lib/types"
import { TrendingUp, Check, Circle, Clock } from "lucide-react"

interface MasteryTrackerProps {
  mastery: MasteryGoal
  onLevelUp?: (levelId: string) => void
}

export function MasteryTracker({ mastery, onLevelUp }: MasteryTrackerProps) {
  const currentLevelIndex = mastery.currentLevel
  const nextLevel = mastery.skillLevels.find((l) => l.order === currentLevelIndex + 1)
  const totalLevels = mastery.skillLevels.length
  const progress = ((currentLevelIndex + 1) / totalLevels) * 100

  // Sort levels by order
  const sortedLevels = [...mastery.skillLevels].sort((a, b) => a.order - b.order)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          Skill Progression
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Level</p>
            <p className="text-xl font-bold">
              {sortedLevels[currentLevelIndex]?.title || "Starting"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="text-xl font-bold">
              {currentLevelIndex + 1} / {totalLevels}
            </p>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="relative h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
          {/* Level markers */}
          {sortedLevels.map((level, index) => (
            <div
              key={level.id}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background"
              style={{
                left: `${((index + 1) / totalLevels) * 100}%`,
                backgroundColor: level.achieved ? "rgb(16 185 129)" : "rgb(229 231 235)",
              }}
            />
          ))}
        </div>

        {/* Skill Levels List */}
        <div className="space-y-3">
          {sortedLevels.map((level, index) => {
            const isAchieved = level.achieved
            const isCurrent = index === currentLevelIndex
            const isNext = index === currentLevelIndex + 1

            return (
              <div
                key={level.id}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                  isCurrent
                    ? "border-primary bg-primary/5"
                    : isAchieved
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border"
                }`}
              >
                <div className="mt-0.5">
                  {isAchieved ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                      <Circle className="h-3 w-3 fill-white text-white" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                      <Circle className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{level.title}</p>
                    {isNext && onLevelUp && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onLevelUp(level.id)}
                      >
                        Mark Achieved
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{level.criteria}</p>
                  {level.achievedAt && (
                    <p className="mt-1 text-xs text-emerald-600">
                      Achieved {new Date(level.achievedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Next Level Preview */}
        {nextLevel && (
          <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
            <p className="text-sm font-medium">Next milestone:</p>
            <p className="mt-1 text-lg font-semibold">{nextLevel.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{nextLevel.criteria}</p>
          </div>
        )}

        {/* Practice Log Summary */}
        {mastery.practiceLog && mastery.practiceLog.length > 0 && (
          <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {mastery.practiceLog.reduce((sum, e) => sum + e.durationMinutes, 0)} minutes logged
              </p>
              <p className="text-xs text-muted-foreground">
                {mastery.practiceLog.length} practice sessions
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
