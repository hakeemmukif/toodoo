"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, Plus, ChevronDown, ChevronUp } from "lucide-react"

interface ConstraintsSectionProps {
  constraints: string[]
  brokenRules: string[]
  onAddConstraint: (constraint: string) => void
  onRemoveConstraint: (index: number) => void
  isLoading?: boolean
}

export function ConstraintsSection({
  constraints,
  brokenRules,
  onAddConstraint,
  onRemoveConstraint,
  isLoading,
}: ConstraintsSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [newConstraint, setNewConstraint] = useState("")
  const [showAddInput, setShowAddInput] = useState(false)

  const hasConstraints = constraints.length > 0
  const hasBrokenRules = brokenRules.length > 0
  const displayBrokenRules = expanded ? brokenRules : brokenRules.slice(0, 3)

  const handleAdd = () => {
    if (newConstraint.trim()) {
      onAddConstraint(newConstraint.trim())
      setNewConstraint("")
      setShowAddInput(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    } else if (e.key === "Escape") {
      setShowAddInput(false)
      setNewConstraint("")
    }
  }

  return (
    <section className="rounded-lg border border-border/60 bg-muted/30 p-4">
      <h2 className="mb-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
        My Rules
      </h2>

      {/* User-defined constraints */}
      {hasConstraints && (
        <div className="mb-4 space-y-2">
          {constraints.map((constraint, i) => (
            <div
              key={i}
              className="group flex items-center justify-between rounded-md bg-background/50 px-3 py-2"
            >
              <span className="text-sm">{constraint}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveConstraint(i)}
                disabled={isLoading}
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new constraint */}
      {showAddInput ? (
        <div className="mb-4 flex gap-2">
          <Input
            value={newConstraint}
            onChange={(e) => setNewConstraint(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., No alcohol on weeknights"
            className="text-sm"
            autoFocus
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newConstraint.trim() || isLoading}
          >
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowAddInput(false)
              setNewConstraint("")
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddInput(true)}
          className="mb-4 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add rule
        </Button>
      )}

      {/* Broken rules from excavations - informative */}
      {hasBrokenRules && (
        <div className="border-t border-border/40 pt-4">
          <p className="mb-2 text-xs text-muted-foreground">
            Rules you noticed breaking (from excavations):
          </p>
          <div className="space-y-2">
            {displayBrokenRules.map((rule, i) => (
              <p
                key={i}
                className="text-xs text-muted-foreground/70 leading-relaxed pl-3 border-l border-muted-foreground/20"
              >
                {rule}
              </p>
            ))}

            {brokenRules.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="mr-1 h-3 w-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-3 w-3" />
                    Show {brokenRules.length - 3} more
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {!hasConstraints && !hasBrokenRules && (
        <p className="text-sm text-muted-foreground/70 italic">
          Define your rules - the things you won&apos;t sacrifice
        </p>
      )}
    </section>
  )
}
