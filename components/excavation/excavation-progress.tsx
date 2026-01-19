import type { ExcavationTheme } from '@/lib/types'
import { getThemeLabel } from '@/services/excavation'

interface ExcavationProgressProps {
  current: number
  total: number
  theme: ExcavationTheme
}

export function ExcavationProgress({ current, total, theme }: ExcavationProgressProps) {
  const percentage = Math.min((current / total) * 100, 100)

  return (
    <div className="px-4 py-3 border-b">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {getThemeLabel(theme)}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.min(current, total)} / {total}
        </span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
