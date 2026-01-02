"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, ThumbsUp, Clock, ArrowRight } from "lucide-react"

interface CommitmentCheckModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (isHellYes: boolean) => void
  goalTitle: string
}

export function CommitmentCheckModal({
  open,
  onOpenChange,
  onConfirm,
  goalTitle,
}: CommitmentCheckModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Is this a hell yes?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You're about to commit to: <strong>"{goalTitle}"</strong>
            </p>
            <p>
              If you're not genuinely excited about this goal, consider passing.
              Every "yes" is a "no" to something else.
            </p>
            <p className="text-sm italic text-muted-foreground">
              A few committed priorities beat many half-hearted ones.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              onConfirm(false)
              onOpenChange(false)
            }}
          >
            <Clock className="mr-2 h-4 w-4" />
            Let me think
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              onConfirm(false)
              onOpenChange(false)
            }}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Add anyway
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              onConfirm(true)
              onOpenChange(false)
            }}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            Hell yes!
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
