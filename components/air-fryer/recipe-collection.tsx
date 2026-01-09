"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { useAirFryerStore } from "@/stores/air-fryer"
import type { AirFryerRecipe } from "@/lib/types"
import {
  Search,
  Clock,
  Users,
  Thermometer,
  Star,
  Trash2,
  BookOpen,
  ChefHat,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function RecipeCollection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)

  const { recipes, deleteRecipe, rateRecipe, searchRecipes } = useAirFryerStore()
  const { toast } = useToast()

  const filteredRecipes = searchQuery
    ? searchRecipes(searchQuery)
    : selectedDifficulty
    ? recipes.filter((r) => r.difficulty === selectedDifficulty)
    : recipes

  const handleDeleteRecipe = async (id: string, title: string) => {
    await deleteRecipe(id)
    toast({
      title: "Recipe deleted",
      description: `${title} has been removed.`,
    })
  }

  const handleRateRecipe = async (id: string, rating: number) => {
    await rateRecipe(id, rating)
    toast({
      title: "Rating saved",
      description: `Recipe rated ${rating} stars.`,
    })
  }

  // Stats
  const totalCooked = recipes.reduce((sum, r) => sum + r.timesCooked, 0)
  const avgRating = recipes.filter((r) => r.rating).length > 0
    ? (recipes.filter((r) => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) /
        recipes.filter((r) => r.rating).length).toFixed(1)
    : null

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Air Fryer Recipes</h2>
          <p className="text-sm text-muted-foreground">
            {recipes.length} recipe{recipes.length !== 1 ? "s" : ""}
            {totalCooked > 0 && ` - Cooked ${totalCooked} times`}
            {avgRating && ` - Avg rating: ${avgRating}`}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {["easy", "medium", "hard"].map((diff) => (
            <Button
              key={diff}
              variant={selectedDifficulty === diff ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSelectedDifficulty(selectedDifficulty === diff ? null : diff)
              }
              className="capitalize"
            >
              {diff}
            </Button>
          ))}
        </div>
      </div>

      {/* Recipe List */}
      {filteredRecipes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No recipes found"
          description={
            recipes.length === 0
              ? "Recipes will be added automatically"
              : "Try adjusting your search or filters"
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onDelete={() => handleDeleteRecipe(recipe.id, recipe.title)}
              onRate={(rating) => handleRateRecipe(recipe.id, rating)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface RecipeCardProps {
  recipe: AirFryerRecipe
  onDelete: () => void
  onRate: (rating: number) => void
}

function RecipeCard({ recipe, onDelete, onRate }: RecipeCardProps) {
  const totalTime = recipe.prepTime + recipe.cookTime

  return (
    <Card className="group relative">
      <CardContent className="p-4">
        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>

        {/* Title & Description */}
        <div className="mb-3 pr-8">
          <h3 className="font-semibold leading-tight">{recipe.title}</h3>
          {recipe.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Meta */}
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
        </div>

        {/* Tags */}
        <div className="mb-3 flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs capitalize">
            {recipe.difficulty}
          </Badge>
          {recipe.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onRate(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-5 w-5 ${
                  (recipe.rating || 0) >= star
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
          {recipe.timesCooked > 0 && (
            <span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
              <ChefHat className="h-3 w-3" />
              Cooked {recipe.timesCooked}x
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
