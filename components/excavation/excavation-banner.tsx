'use client'

import { useEffect, useState } from 'react'
import { useExcavationStore } from '@/stores/excavation'
import { getThemeLabel } from '@/services/excavation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExcavationChat } from './excavation-chat'
import { Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ExcavationBanner() {
  const {
    todaysExcavation,
    loadTodaysExcavation,
    getTodaysTheme,
    isTodaysExcavationComplete,
  } = useExcavationStore()

  const [isOpen, setIsOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Load excavation state on mount
  useEffect(() => {
    const load = async () => {
      await loadTodaysExcavation()
      setHasLoaded(true)
    }
    load()
  }, [loadTodaysExcavation])

  // Don't show banner if:
  // - Still loading
  // - Already completed today's excavation
  // - User dismissed the banner for this session
  if (!hasLoaded || isTodaysExcavationComplete() || isDismissed) {
    return null
  }

  const theme = getTodaysTheme()
  const hasStarted = todaysExcavation !== null
  const progress = todaysExcavation?.currentPromptIndex ?? 0

  return (
    <>
      {/* Banner */}
      <div
        className={cn(
          'relative mx-4 mb-4 rounded-xl border bg-card p-4',
          'animate-in slide-in-from-top-2 duration-300'
        )}
      >
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              {hasStarted ? 'Continue your reflection' : 'Daily Excavation'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasStarted
                ? `${progress} questions answered · ${getThemeLabel(theme)}`
                : `Today's focus: ${getThemeLabel(theme)}`}
            </p>
          </div>
          <Button size="sm" onClick={() => setIsOpen(true)}>
            {hasStarted ? 'Continue' : 'Start'}
          </Button>
        </div>
      </div>

      {/* Full-screen dialog for excavation */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="text-center font-serif">
              Daily Excavation
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ExcavationChat onComplete={() => setIsOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
