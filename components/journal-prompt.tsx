"use client"

import type { JournalPrompt as JournalPromptType, PromptCategory } from "@/lib/types"
import { getPromptsForSelection, getCategoryDisplayName, getAllCategories } from "@/services/prompts"
import { cn } from "@/lib/utils"
import { RefreshCw, Lightbulb, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface JournalPromptProps {
  prompt: JournalPromptType | null
  onRefresh?: () => void
  onSelect?: (prompt: JournalPromptType) => void
  mode?: "single" | "picker"
  preferredCategories?: PromptCategory[]
  className?: string
}

export function JournalPromptCard({
  prompt,
  onRefresh,
  onSelect,
  mode = "single",
  preferredCategories = [],
  className,
}: JournalPromptProps) {
  if (mode === "picker") {
    const prompts = getPromptsForSelection(preferredCategories)
    const groupedByCategory = prompts.reduce(
      (acc, p) => {
        if (!acc[p.category]) acc[p.category] = []
        acc[p.category].push(p)
        return acc
      },
      {} as Record<PromptCategory, JournalPromptType[]>
    )

    return (
      <div className={cn("space-y-2", className)}>
        <h4 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Choose a Prompt
        </h4>
        <div className="space-y-1">
          {Object.entries(groupedByCategory).map(([category, categoryPrompts]) => (
            <Collapsible key={category}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2 text-sm hover:bg-foreground/[0.02]">
                <span>{getCategoryDisplayName(category as PromptCategory)}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-1">
                <div className="space-y-1 pl-2">
                  {categoryPrompts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelect?.(p)}
                      className="w-full rounded-lg border border-border/40 bg-background p-3 text-left text-sm transition-colors hover:border-border hover:bg-foreground/[0.02]"
                    >
                      {p.prompt}
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    )
  }

  if (!prompt) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border/60 bg-card p-4 text-center",
          className
        )}
      >
        <Lightbulb className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No prompt selected</p>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="mt-2"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Get a prompt
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card p-4",
        className
      )}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              backgroundColor: "oklch(0.65 0.09 85 / 0.15)",
              color: "oklch(0.55 0.09 85)",
            }}
          >
            {getCategoryDisplayName(prompt.category)}
          </span>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <p className="font-serif text-base leading-relaxed">{prompt.prompt}</p>
    </div>
  )
}

interface PromptCategorySelectorProps {
  selected: PromptCategory[]
  onChange: (categories: PromptCategory[]) => void
  className?: string
}

export function PromptCategorySelector({
  selected,
  onChange,
  className,
}: PromptCategorySelectorProps) {
  const allCategories = getAllCategories()

  const toggleCategory = (category: PromptCategory) => {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category))
    } else {
      onChange([...selected, category])
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Preferred Prompt Categories
      </h4>
      <div className="flex flex-wrap gap-2">
        {allCategories.map((category) => {
          const isSelected = selected.includes(category)
          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isSelected
                  ? "bg-foreground text-background"
                  : "border border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {getCategoryDisplayName(category)}
            </button>
          )
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-muted-foreground">
          All categories will be used when none are selected
        </p>
      )}
    </div>
  )
}
