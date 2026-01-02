"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { GoalWizard } from "@/components/goal-wizard"
import type { LifeAspect } from "@/lib/types"

interface GoalWizardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultAspect?: LifeAspect
}

export function GoalWizardModal({ open, onOpenChange, defaultAspect }: GoalWizardModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto p-8 sm:p-10">
        <VisuallyHidden>
          <DialogTitle>Add New Goal</DialogTitle>
        </VisuallyHidden>
        <GoalWizard
          mode="add-goal"
          defaultAspect={defaultAspect}
          includeOtherAspects={false}
          onComplete={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
