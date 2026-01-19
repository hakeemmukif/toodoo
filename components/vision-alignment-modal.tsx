"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Task, YearlyGoal } from "@/lib/types"

interface VisionAlignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  linkedGoal?: YearlyGoal
  visionSnippet?: string | null
  onAligned: () => void
  onNotAligned: () => void
  onUncertain: () => void
}

export function VisionAlignmentModal({
  open,
  onOpenChange,
  task,
  linkedGoal,
  visionSnippet,
  onAligned,
  onNotAligned,
  onUncertain,
}: VisionAlignmentModalProps) {
  const hasVisionContext = visionSnippet || linkedGoal?.identityStatement

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            You&apos;ve deferred this {task.deferCount} times
          </DialogTitle>
          <DialogDescription className="pt-2">
            <span className="block font-medium text-foreground">
              &ldquo;{task.title}&rdquo;
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Is this task actually aligned with the life you&apos;re building?
            Or something you think you &ldquo;should&rdquo; do?
          </p>

          {/* Vision context box */}
          {hasVisionContext && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
              {visionSnippet && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-[#B8A068]">Your vision:</span>{" "}
                  {visionSnippet}
                </p>
              )}
              {linkedGoal?.identityStatement && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-[#C9B896]">Linked goal identity:</span>{" "}
                  {linkedGoal.identityStatement}
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                onAligned()
                onOpenChange(false)
              }}
            >
              <div>
                <span className="font-medium">Aligned, just resisting</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Keep task, I&apos;ll try a smaller version
                </span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                onNotAligned()
                onOpenChange(false)
              }}
            >
              <div>
                <span className="font-medium">Not actually aligned</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Archive this task with a note
                </span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                onUncertain()
                onOpenChange(false)
              }}
            >
              <div>
                <span className="font-medium">I don&apos;t know</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Add a note, suggest excavation to clarify
                </span>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
