"use client"

import { Button } from "@/components/ui/button"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect } from "@/lib/types"
import { ArrowRight } from "lucide-react"

const aspects = Object.keys(ASPECT_CONFIG) as LifeAspect[]

interface StepAspectProps {
  selectedAspect: LifeAspect | null
  onSelect: (aspect: LifeAspect) => void
  onNext: () => void
}

export function StepAspect({ selectedAspect, onSelect, onNext }: StepAspectProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">Which area matters most to you right now?</h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Pick your primary focus. We'll help you set up a complete goal chain for this area.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
        {aspects.map((aspect) => {
          const config = ASPECT_CONFIG[aspect]
          const Icon = config.icon
          const isSelected = selectedAspect === aspect

          return (
            <button
              key={aspect}
              onClick={() => onSelect(aspect)}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 transition-all sm:p-8 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <Icon
                className="h-10 w-10 sm:h-12 sm:w-12"
                style={{ color: isSelected ? config.color : undefined }}
              />
              <span className="text-sm font-medium sm:text-base">{config.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button size="lg" onClick={onNext} disabled={!selectedAspect}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
