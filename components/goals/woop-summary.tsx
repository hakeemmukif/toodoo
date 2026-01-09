"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { WOOPData } from "@/lib/types"
import { Sparkles, Eye, AlertTriangle, Zap, ChevronDown } from "lucide-react"

interface WOOPSummaryProps {
  woop: WOOPData
  ifThenPlans?: string[]
  identityStatement?: string
  compact?: boolean
}

export function WOOPSummary({
  woop,
  ifThenPlans,
  identityStatement,
  compact = false,
}: WOOPSummaryProps) {
  const [isOpen, setIsOpen] = useState(!compact)

  if (compact) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium">Your WOOP Plan</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <WOOPContent
            woop={woop}
            ifThenPlans={ifThenPlans}
            identityStatement={identityStatement}
          />
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Your WOOP Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <WOOPContent
          woop={woop}
          ifThenPlans={ifThenPlans}
          identityStatement={identityStatement}
        />
      </CardContent>
    </Card>
  )
}

function WOOPContent({
  woop,
  ifThenPlans,
  identityStatement,
}: {
  woop: WOOPData
  ifThenPlans?: string[]
  identityStatement?: string
}) {
  return (
    <div className="space-y-4">
      {/* Wish */}
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Wish</p>
          <p className="text-sm">{woop.wish}</p>
        </div>
      </div>

      {/* Outcome */}
      {woop.outcome && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <Eye className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Best Outcome</p>
            <p className="text-sm">{woop.outcome}</p>
          </div>
        </div>
      )}

      {/* Obstacle */}
      {woop.obstacle && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Main Obstacle</p>
            <p className="text-sm">{woop.obstacle}</p>
          </div>
        </div>
      )}

      {/* If-Then Plans */}
      {ifThenPlans && ifThenPlans.length > 0 && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
            <Zap className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">If-Then Plans</p>
            <ul className="mt-1 space-y-1">
              {ifThenPlans.map((plan, index) => (
                <li key={index} className="text-sm">
                  {plan}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Identity Statement */}
      {identityStatement && (
        <div className="mt-4 rounded-lg bg-primary/5 p-3">
          <p className="text-sm font-medium">I am becoming someone who...</p>
          <p className="mt-1 text-sm text-muted-foreground">{identityStatement}</p>
        </div>
      )}
    </div>
  )
}
