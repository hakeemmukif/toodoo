import type { LifeAspect } from "@/lib/types"
import { ASPECT_CONFIG } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface AspectBadgeProps {
  aspect: LifeAspect
  className?: string
  showIcon?: boolean
}

export function AspectBadge({ aspect, className, showIcon = false }: AspectBadgeProps) {
  const config = ASPECT_CONFIG[aspect]

  return (
    <span
      className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium", className)}
      style={{
        backgroundColor: `${config.color}30`,
        color: config.color,
      }}
      title={config.label}
    >
      {config.initial}
    </span>
  )
}
