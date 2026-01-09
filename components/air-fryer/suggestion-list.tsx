"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { useAirFryerStore } from "@/stores/air-fryer"
import { useInventoryStore } from "@/stores/inventory"
import { RecipeMatchCard } from "./recipe-match-card"
import { GuidedCookMode } from "./guided-cook-mode"
import type { RecipeMatch } from "@/lib/types"
import { Sparkles, Package, RefreshCw } from "lucide-react"

export function SuggestionList() {
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeMatch | null>(null)
  const [isCooking, setIsCooking] = useState(false)

  const { suggestions, isSuggesting, getSuggestions } = useAirFryerStore()
  const { items: inventoryItems } = useInventoryStore()

  const handleStartCooking = (match: RecipeMatch) => {
    setSelectedRecipe(match)
    setIsCooking(true)
  }

  const handleFinishCooking = () => {
    setIsCooking(false)
    setSelectedRecipe(null)
    // Refresh suggestions after cooking
    getSuggestions()
  }

  // Show cooking mode
  if (isCooking && selectedRecipe) {
    return (
      <GuidedCookMode
        recipe={selectedRecipe.recipe}
        onComplete={handleFinishCooking}
        onCancel={() => setIsCooking(false)}
      />
    )
  }

  // Empty inventory
  if (inventoryItems.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Add ingredients first"
        description="Go to My Pantry to add ingredients you have at home, then come back for suggestions"
      />
    )
  }

  // No suggestions
  if (suggestions.length === 0 && !isSuggesting) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Suggestions</h2>
          <Button variant="outline" size="sm" onClick={() => getSuggestions()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <EmptyState
          icon={Sparkles}
          title="No matches found"
          description="Add more ingredients to your pantry to unlock recipe suggestions"
        />
      </div>
    )
  }

  // Split into can make now vs need more ingredients
  const canMakeNow = suggestions.filter((s) => s.canMakeNow)
  const needMore = suggestions.filter((s) => !s.canMakeNow && s.matchScore >= 0.5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Suggestions</h2>
          <p className="text-sm text-muted-foreground">
            Based on {inventoryItems.length} ingredient{inventoryItems.length !== 1 ? "s" : ""} in your pantry
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => getSuggestions()}
          disabled={isSuggesting}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isSuggesting ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {isSuggesting && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Finding recipes...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Can Make Now */}
      {canMakeNow.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            Ready to cook ({canMakeNow.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {canMakeNow.map((match) => (
              <RecipeMatchCard
                key={match.recipe.id}
                match={match}
                onStartCooking={() => handleStartCooking(match)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Need More Ingredients */}
      {needMore.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
            Need a few more ingredients ({needMore.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {needMore.map((match) => (
              <RecipeMatchCard
                key={match.recipe.id}
                match={match}
                onStartCooking={() => handleStartCooking(match)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
