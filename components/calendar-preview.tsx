"use client"

import { Card } from "@/components/ui/card"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect, TimePreference } from "@/lib/types"
import { formatDate } from "@/db"

interface CalendarPreviewProps {
  task: {
    title: string
    scheduledDate: string
    timePreference: TimePreference
    aspect: LifeAspect
  }
}

export function CalendarPreview({ task }: CalendarPreviewProps) {
  // Get 7 days starting from today
  const today = new Date()

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    return date
  })

  const todayStr = formatDate(today)
  const config = ASPECT_CONFIG[task.aspect]

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Your task will appear on the calendar
      </p>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {weekDays.map((date) => {
          const dateStr = formatDate(date)
          const isToday = dateStr === todayStr
          const hasTask = dateStr === task.scheduledDate

          return (
            <Card
              key={dateStr}
              className={`min-w-[90px] flex-1 p-3 ${
                isToday ? "border-primary" : ""
              } ${hasTask ? "bg-primary/5" : ""}`}
            >
              <div className="text-center">
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isToday ? "text-primary" : ""
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>

              {hasTask && (
                <div
                  className="mt-2 rounded border-l-4 bg-muted/50 p-2"
                  style={{ borderLeftColor: config.color }}
                >
                  <div className="text-xs font-medium line-clamp-2">
                    {task.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground capitalize">
                    {task.timePreference}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <p className="text-center text-sm font-medium">
        {task.scheduledDate === todayStr
          ? "Scheduled for today"
          : `Scheduled for ${new Date(task.scheduledDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`}
      </p>
    </div>
  )
}
