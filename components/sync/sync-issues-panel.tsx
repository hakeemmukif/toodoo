"use client"

import { useEffect, useState } from "react"
import { useSyncStore } from "@/stores/sync"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SyncIssue, SyncIssueSeverity } from "@/lib/types"
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Link2,
  Unlink,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react"

interface SyncIssuesPanelProps {
  className?: string
  maxItems?: number
}

const severityConfig: Record<
  SyncIssueSeverity,
  { icon: typeof AlertCircle; color: string; label: string }
> = {
  critical: {
    icon: AlertCircle,
    color: "text-red-500 bg-red-500/10 border-red-500/30",
    label: "Critical",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
    label: "Warning",
  },
  info: {
    icon: Info,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    label: "Info",
  },
}

export function SyncIssuesPanel({
  className,
  maxItems = 10,
}: SyncIssuesPanelProps) {
  const [mounted, setMounted] = useState(false)
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)

  const issues = useSyncStore((state) => state.issues)
  const loadIssues = useSyncStore((state) => state.loadIssues)
  const resolveIssue = useSyncStore((state) => state.resolveIssue)
  const dismissIssue = useSyncStore((state) => state.dismissIssue)

  useEffect(() => {
    setMounted(true)
    loadIssues()
  }, [loadIssues])

  if (!mounted) return null

  if (issues.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
          <p className="text-sm font-medium">All Clear</p>
          <p className="text-xs text-muted-foreground">
            No sync issues detected
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort by severity (critical first) then by date
  const sortedIssues = [...issues]
    .sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 }
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    })
    .slice(0, maxItems)

  const handleResolve = async (
    issueId: string,
    resolution: "linked" | "unlinked" | "deleted"
  ) => {
    try {
      await resolveIssue(issueId, resolution)
    } catch (error) {
      console.error("Failed to resolve issue:", error)
    }
  }

  const handleDismiss = async (issueId: string) => {
    try {
      await dismissIssue(issueId)
    } catch (error) {
      console.error("Failed to dismiss issue:", error)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Sync Issues</span>
          <Badge variant="secondary" className="font-mono">
            {issues.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedIssues.map((issue) => (
          <IssueItem
            key={issue.id}
            issue={issue}
            isExpanded={expandedIssue === issue.id}
            onToggle={() =>
              setExpandedIssue(expandedIssue === issue.id ? null : issue.id)
            }
            onResolve={handleResolve}
            onDismiss={handleDismiss}
          />
        ))}

        {issues.length > maxItems && (
          <p className="text-center text-xs text-muted-foreground pt-2">
            + {issues.length - maxItems} more issues
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface IssueItemProps {
  issue: SyncIssue
  isExpanded: boolean
  onToggle: () => void
  onResolve: (
    issueId: string,
    resolution: "linked" | "unlinked" | "deleted"
  ) => void
  onDismiss: (issueId: string) => void
}

function IssueItem({
  issue,
  isExpanded,
  onToggle,
  onResolve,
  onDismiss,
}: IssueItemProps) {
  const config = severityConfig[issue.severity]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        config.color.split(" ").slice(1).join(" ")
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 text-left"
      >
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.color.split(" ")[0])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {issue.entityTitle}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Layer {issue.layer}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {issue.description}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3 pl-7">
          {issue.suggestion && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Suggestion:</span> {issue.suggestion}
            </p>
          )}

          {issue.suggestedGoalTitle && (
            <p className="text-xs">
              <span className="font-medium text-muted-foreground">
                Suggested link:
              </span>{" "}
              {issue.suggestedGoalTitle}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {issue.suggestedGoalId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResolve(issue.id, "linked")}
                className="h-7 text-xs gap-1"
              >
                <Link2 className="h-3 w-3" />
                Link to Suggested
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onResolve(issue.id, "unlinked")}
              className="h-7 text-xs gap-1"
            >
              <Unlink className="h-3 w-3" />
              Unlink
            </Button>

            {issue.severity !== "critical" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResolve(issue.id, "deleted")}
                className="h-7 text-xs gap-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
                Delete Entity
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(issue.id)}
              className="h-7 text-xs gap-1 text-muted-foreground"
            >
              <X className="h-3 w-3" />
              Ignore
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Detected: {new Date(issue.detectedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}

// Compact version for sidebar or small spaces
export function SyncIssuesBadge({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const issues = useSyncStore((state) => state.issues)
  const getCriticalIssues = useSyncStore((state) => state.getCriticalIssues)
  const getWarningIssues = useSyncStore((state) => state.getWarningIssues)
  const loadIssues = useSyncStore((state) => state.loadIssues)

  useEffect(() => {
    setMounted(true)
    loadIssues()
  }, [loadIssues])

  if (!mounted || issues.length === 0) return null

  const criticalCount = getCriticalIssues().length
  const warningCount = getWarningIssues().length

  if (criticalCount > 0) {
    return (
      <Badge variant="destructive" className={className}>
        {criticalCount}
      </Badge>
    )
  }

  if (warningCount > 0) {
    return (
      <Badge
        variant="outline"
        className={cn("border-yellow-500 bg-yellow-500/10 text-yellow-600", className)}
      >
        {warningCount}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className={className}>
      {issues.length}
    </Badge>
  )
}
