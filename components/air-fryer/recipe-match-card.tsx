"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { RecipeMatch } from "@/lib/types"
import { Clock, Users, Thermometer, Check, X, ChefHat } from "lucide-react"

interface RecipeMatchCardProps {
  match: RecipeMatch
  onStartCooking: () => void
}

export function RecipeMatchCard({ match, onStartCooking }: RecipeMatchCardProps) {
  const { recipe, matchScore, canMakeNow, matchedIngredients, missingIngredients } = match

  const totalTime = recipe.prepTime + recipe.cookTime
  const missingRequired = missingIngredients.filter((i) => !i.isOptional)

  return (
    <Card className={`transition-shadow hover:shadow-md ${canMakeNow ? "border-green-500/30" : ""}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold leading-tight">{recipe.title}</h3>
            {recipe.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                {recipe.description}
              </p>
            )}
          </div>
          <Badge variant={canMakeNow ? "default" : "secondary"} className="ml-2 shrink-0">
            {Math.round(matchScore * 100)}%
          </Badge>
        </div>

        {/* Meta Info */}
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {totalTime}m
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {recipe.servings}
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className="h-4 w-4" />
            {recipe.airFryerSettings.temperature}°{recipe.airFryerSettings.temperatureUnit}
          </div>
          <Badge variant="outline" className="text-xs">
            {recipe.difficulty}
          </Badge>
        </div>

        {/* Ingredients Status */}
        <div className="mb-4 space-y-2">
          {/* Matched */}
          {matchedIngredients.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {matchedIngredients.slice(0, 4).map((ing) => (
                <span
                  key={ing.name}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                    ing.hasEnough
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  }`}
                >
                  <Check className="h-3 w-3" />
                  {ing.name}
                </span>
              ))}
              {matchedIngredients.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{matchedIngredients.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Missing */}
          {missingRequired.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {missingRequired.slice(0, 3).map((ing) => (
                <span
                  key={ing.name}
                  className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-700 dark:text-red-400"
                >
                  <X className="h-3 w-3" />
                  {ing.name}
                </span>
              ))}
              {missingRequired.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{missingRequired.length - 3} more needed
                </span>
              )}
            </div>
          )}
        </div>

        {/* Air Fryer Settings Preview */}
        {recipe.airFryerSettings.shakeHalfway && (
          <p className="mb-3 text-xs text-muted-foreground">
            Shake halfway through cooking
          </p>
        )}

        {/* Action */}
        <Button
          onClick={onStartCooking}
          className="w-full"
          variant={canMakeNow ? "default" : "secondary"}
        >
          <ChefHat className="mr-2 h-4 w-4" />
          {canMakeNow ? "Start Cooking" : "View Recipe"}
        </Button>
      </CardContent>
    </Card>
  )
}
