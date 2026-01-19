"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface AntiVisionSectionProps {
  statements: string[]
  summary?: string
  onSummaryChange: (value: string) => void
  isLoading?: boolean
}

export function AntiVisionSection({
  statements,
  summary,
  onSummaryChange,
  isLoading,
}: AntiVisionSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingSummary, setEditingSummary] = useState(false)
  const [localSummary, setLocalSummary] = useState(summary || "")

  const hasStatements = statements.length > 0
  const displayStatements = expanded ? statements : statements.slice(0, 3)

  const handleSaveSummary = () => {
    onSummaryChange(localSummary)
    setEditingSummary(false)
  }

  return (
    <section className="rounded-lg border border-border/60 bg-[#8B5A5A]/5 p-4">
      <h2 className="mb-3 font-mono text-xs font-medium uppercase tracking-wider text-[#8B5A5A]">
        The Life I Refuse to Live
      </h2>

      {!hasStatements && !summary && (
        <p className="text-sm text-muted-foreground/70 italic">
          Complete anti-vision excavations to build this section
        </p>
      )}

      {/* User-written summary */}
      {(summary || editingSummary) && (
        <div className="mb-4">
          {editingSummary ? (
            <div className="space-y-2">
              <Textarea
                value={localSummary}
                onChange={(e) => setLocalSummary(e.target.value)}
                placeholder="Summarize the life you refuse to live in one sentence..."
                className="min-h-[80px] resize-none border-[#8B5A5A]/30 bg-transparent text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingSummary(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveSummary}
                  disabled={isLoading}
                  className="bg-[#8B5A5A] text-white hover:bg-[#8B5A5A]/90 text-xs"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p
              className="cursor-pointer text-sm text-foreground/90 hover:text-foreground transition-colors"
              onClick={() => {
                setLocalSummary(summary || "")
                setEditingSummary(true)
              }}
              title="Click to edit"
            >
              {summary}
            </p>
          )}
        </div>
      )}

      {/* Raw statements from excavations */}
      {hasStatements && (
        <div className="space-y-2">
          {displayStatements.map((statement, i) => (
            <p
              key={i}
              className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-[#8B5A5A]/20"
            >
              {statement}
            </p>
          ))}

          {statements.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {expanded ? (
                <>
                  <ChevronUp className="mr-1 h-3 w-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-3 w-3" />
                  Show {statements.length - 3} more
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Add summary prompt */}
      {hasStatements && !summary && !editingSummary && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditingSummary(true)}
          className="mt-3 text-xs text-[#8B5A5A]/70 hover:text-[#8B5A5A]"
        >
          + Add one-sentence summary
        </Button>
      )}
    </section>
  )
}
