"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useInterruptsStore } from "@/stores/interrupts"
import type { PatternInterrupt } from "@/lib/types"
import { cn } from "@/lib/utils"

interface InterruptSheetProps {
  interrupt: PatternInterrupt | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type AlignmentOption = PatternInterrupt["alignmentCheck"]

export function InterruptSheet({ interrupt, open, onOpenChange }: InterruptSheetProps) {
  const [response, setResponse] = useState("")
  const [alignment, setAlignment] = useState<AlignmentOption>(undefined)

  const respondToInterrupt = useInterruptsStore((s) => s.respondToInterrupt)
  const skipInterrupt = useInterruptsStore((s) => s.skipInterrupt)

  const handleSubmit = async () => {
    if (!interrupt) return

    if (response.trim()) {
      await respondToInterrupt(interrupt.id, response.trim(), alignment)
    } else {
      await skipInterrupt(interrupt.id)
    }

    setResponse("")
    setAlignment(undefined)
    onOpenChange(false)
  }

  const handleSkip = async () => {
    if (!interrupt) return
    await skipInterrupt(interrupt.id)
    setResponse("")
    setAlignment(undefined)
    onOpenChange(false)
  }

  if (!interrupt) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh]">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-lg text-foreground/90">
            Pause and reflect
          </SheetTitle>
          <SheetDescription className="text-base font-medium text-foreground pt-2">
            {interrupt.question}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pt-4">
          {/* Response textarea */}
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="What comes to mind..."
            className="min-h-[100px] resize-none"
            autoFocus
          />

          {/* Optional alignment check */}
          {response.trim() && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Where does this insight land you? (optional)
              </p>
              <div className="flex flex-wrap gap-2">
                <AlignmentChip
                  selected={alignment === "toward-vision"}
                  onClick={() =>
                    setAlignment(
                      alignment === "toward-vision" ? undefined : "toward-vision"
                    )
                  }
                  color="green"
                >
                  Toward vision
                </AlignmentChip>
                <AlignmentChip
                  selected={alignment === "neutral"}
                  onClick={() =>
                    setAlignment(alignment === "neutral" ? undefined : "neutral")
                  }
                  color="gray"
                >
                  Neutral
                </AlignmentChip>
                <AlignmentChip
                  selected={alignment === "toward-anti-vision"}
                  onClick={() =>
                    setAlignment(
                      alignment === "toward-anti-vision"
                        ? undefined
                        : "toward-anti-vision"
                    )
                  }
                  color="red"
                >
                  Away from vision
                </AlignmentChip>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              {response.trim() ? "Save reflection" : "Done"}
            </Button>
          </div>

          {/* Expand to journal hint */}
          {response.trim().length > 100 && (
            <p className="text-xs text-muted-foreground text-center">
              Long reflection? Consider expanding to a full journal entry.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function AlignmentChip({
  children,
  selected,
  onClick,
  color,
}: {
  children: React.ReactNode
  selected: boolean
  onClick: () => void
  color: "green" | "gray" | "red"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        selected
          ? color === "green"
            ? "bg-green-500/20 text-green-600 dark:text-green-400"
            : color === "red"
              ? "bg-red-500/20 text-red-600 dark:text-red-400"
              : "bg-muted text-foreground"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}
