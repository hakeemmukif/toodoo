"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, MoreHorizontal, Eye, Trash2 } from "lucide-react"
import { AspectBadge } from "@/components/aspect-badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import type { Goal } from "@/lib/types"
import { cn } from "@/lib/utils"

interface GoalCardProps {
  goal: Goal
  children?: Goal[]
  level?: number
  onDelete?: (id: string) => void
}

export function GoalCard({ goal, children = [], level = 0, onDelete }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const hasChildren = children.length > 0

  const handleDelete = () => {
    if (onDelete) {
      onDelete(goal.id)
    }
    setDeleteDialogOpen(false)
  }

  return (
    <div className={cn("space-y-2", level > 0 && "ml-6")}>
      <div className="group rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-2">
              {hasChildren && (
                <button onClick={() => setExpanded(!expanded)} className="mt-1 text-muted-foreground">
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              <div className="flex-1 space-y-2">
                <Link href={`/goals/${goal.id}`} className="hover:underline">
                  <h3 className="font-semibold leading-tight text-pretty">{goal.title}</h3>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <AspectBadge aspect={goal.aspect} />
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">{goal.level}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-pretty">{goal.successCriteria}</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
          </div>

          {/* Actions dropdown - only for top-level goals */}
          {level === 0 && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/goals/${goal.id}`} className="flex items-center">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="space-y-2">
          {children.map((child) => (
            <GoalCard key={child.id} goal={child} level={level + 1} />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{goal.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this goal and all its linked monthly and weekly goals.
              Tasks linked to this goal will be unlinked but not deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
