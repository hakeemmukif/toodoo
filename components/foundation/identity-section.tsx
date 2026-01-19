"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface IdentitySectionProps {
  identityWins: string[]
  identityStatement?: string
  onStatementChange: (value: string) => void
  isLoading?: boolean
}

export function IdentitySection({
  identityWins,
  identityStatement,
  onStatementChange,
  isLoading,
}: IdentitySectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingStatement, setEditingStatement] = useState(false)
  const [localStatement, setLocalStatement] = useState(identityStatement || "")

  const hasWins = identityWins.length > 0
  const displayWins = expanded ? identityWins : identityWins.slice(0, 5)

  const handleSaveStatement = () => {
    onStatementChange(localStatement)
    setEditingStatement(false)
  }

  return (
    <section className="rounded-lg border border-border/60 bg-[#C9B896]/10 dark:bg-[#C9B896]/5 p-4">
      <h2 className="mb-3 font-mono text-xs font-medium uppercase tracking-wider text-[#C9B896]">
        I Am Becoming Someone Who...
      </h2>

      {/* Identity statement */}
      <div className="mb-4">
        {editingStatement ? (
          <div className="space-y-2">
            <Textarea
              value={localStatement}
              onChange={(e) => setLocalStatement(e.target.value)}
              placeholder="I am the type of person who..."
              className="min-h-[80px] resize-none border-[#C9B896]/30 bg-transparent text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingStatement(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveStatement}
                disabled={isLoading}
                className="bg-[#C9B896] text-white hover:bg-[#C9B896]/90 text-xs"
              >
                Save
              </Button>
            </div>
          </div>
        ) : identityStatement ? (
          <p
            className="cursor-pointer text-sm font-medium text-foreground/90 hover:text-foreground transition-colors"
            onClick={() => {
              setLocalStatement(identityStatement)
              setEditingStatement(true)
            }}
            title="Click to edit"
          >
            {identityStatement}
          </p>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingStatement(true)}
            className="text-xs text-[#C9B896]/70 hover:text-[#C9B896] p-0 h-auto"
          >
            + Define your identity statement
          </Button>
        )}
      </div>

      {/* Recent identity wins */}
      {hasWins && (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Recent identity wins:</p>
          <div className="space-y-2">
            {displayWins.map((win, i) => (
              <p
                key={i}
                className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-[#C9B896]/20"
              >
                {win}
              </p>
            ))}

            {identityWins.length > 5 && (
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
                    Show {identityWins.length - 5} more
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {!hasWins && !identityStatement && (
        <p className="text-sm text-muted-foreground/70 italic">
          Complete identity excavations to build this section
        </p>
      )}
    </section>
  )
}
