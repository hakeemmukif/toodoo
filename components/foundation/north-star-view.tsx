"use client"

import { useEffect } from "react"
import { useVisionStore } from "@/stores/vision"
import { AntiVisionSection } from "./anti-vision-section"
import { VisionSection } from "./vision-section"
import { IdentitySection } from "./identity-section"
import { ConstraintsSection } from "./constraints-section"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"

export function NorthStarView() {
  const {
    emergentVision,
    isLoading,
    loadVision,
    aggregateFromExcavations,
    updateSummary,
    addConstraint,
    removeConstraint,
  } = useVisionStore()

  useEffect(() => {
    loadVision()
  }, [loadVision])

  const handleRefresh = async () => {
    await aggregateFromExcavations()
  }

  const hasVision = emergentVision !== null
  const excavationCount = emergentVision?.excavationCount || 0

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {hasVision
              ? `Built from ${excavationCount} excavation${excavationCount !== 1 ? "s" : ""}`
              : "Complete daily excavations to build your foundation"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="text-xs"
        >
          {isLoading ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3 w-3" />
          )}
          Refresh
        </Button>
      </div>

      {/* Vision sections */}
      <div className="space-y-4">
        <AntiVisionSection
          statements={emergentVision?.antiVisionStatements || []}
          summary={emergentVision?.antiVisionSummary}
          onSummaryChange={(value) => updateSummary("antiVisionSummary", value)}
          isLoading={isLoading}
        />

        <VisionSection
          statements={emergentVision?.visionStatements || []}
          summary={emergentVision?.visionSummary}
          onSummaryChange={(value) => updateSummary("visionSummary", value)}
          isLoading={isLoading}
        />

        <IdentitySection
          identityWins={emergentVision?.identityWins || []}
          identityStatement={emergentVision?.identityStatement}
          onStatementChange={(value) => updateSummary("identityStatement", value)}
          isLoading={isLoading}
        />

        <ConstraintsSection
          constraints={emergentVision?.constraints || []}
          brokenRules={emergentVision?.brokenRules || []}
          onAddConstraint={addConstraint}
          onRemoveConstraint={removeConstraint}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
