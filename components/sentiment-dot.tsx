import type { Sentiment } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SentimentDotProps {
  sentiment: Sentiment
  className?: string
}

export function SentimentDot({ sentiment, className }: SentimentDotProps) {
  const colors = {
    positive: "bg-green-500",
    neutral: "bg-yellow-500",
    negative: "bg-red-500",
  }

  return <span className={cn("h-2 w-2 rounded-full", colors[sentiment], className)} />
}
