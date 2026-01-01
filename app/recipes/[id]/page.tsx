"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRecipesStore } from "@/stores/recipes"
import { useMealsStore } from "@/stores/meals"
import { useShoppingStore } from "@/stores/shopping"
import { formatDate } from "@/db"
import { Clock, Users, Star, ArrowLeft, UtensilsCrossed, ShoppingCart, Trash2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [rating, setRating] = useState<number | null>(null)

  const getRecipeById = useRecipesStore((state) => state.getRecipeById)
  const markAsCooked = useRecipesStore((state) => state.markAsCooked)
  const rateRecipe = useRecipesStore((state) => state.rateRecipe)
  const deleteRecipe = useRecipesStore((state) => state.deleteRecipe)

  const addMeal = useMealsStore((state) => state.addMeal)
  const addItem = useShoppingStore((state) => state.addItem)
  const lists = useShoppingStore((state) => state.lists)

  const recipe = getRecipeById(id)

  if (!recipe) {
    return (
      <AppLayout>
        <div className="container max-w-4xl p-4 md:p-6 lg:p-8">
          <Link href="/recipes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Recipes
            </Button>
          </Link>
          <div className="mt-8 text-center text-muted-foreground">Recipe not found</div>
        </div>
      </AppLayout>
    )
  }

  const handleCookRecipe = async () => {
    await markAsCooked(id)
    await addMeal({
      type: "dinner",
      date: formatDate(new Date()),
      description: recipe.title,
      cooked: true,
      recipeId: id,
    })
    toast({
      title: "Recipe cooked!",
      description: "Added to your meals for today.",
    })
  }

  const handleRate = async (newRating: number) => {
    setRating(newRating)
    await rateRecipe(id, newRating)
    toast({
      title: "Rating saved",
      description: `You rated this recipe ${newRating}/5 stars.`,
    })
  }

  const handleAddToShopping = async () => {
    // Get or create a default list
    let listId = lists[0]?.id
    if (!listId) {
      // Would need to create a list first - for now show message
      toast({
        title: "No shopping list",
        description: "Create a shopping list first to add ingredients.",
      })
      return
    }

    for (const ingredient of recipe.ingredients) {
      await addItem({
        listId,
        item: ingredient.item,
        category: "Groceries",
        quantity: `${ingredient.quantity} ${ingredient.unit}`,
        priority: "need",
        status: "pending",
      })
    }

    toast({
      title: "Ingredients added",
      description: `Added ${recipe.ingredients.length} items to your shopping list.`,
    })
  }

  const handleDelete = async () => {
    await deleteRecipe(id)
    toast({
      title: "Recipe deleted",
      description: "The recipe has been removed from your collection.",
    })
    router.push("/recipes")
  }

  const currentRating = rating ?? recipe.rating ?? 0

  return (
    <AppLayout>
      <div className="container max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Back Button */}
        <Link href="/recipes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Button>
        </Link>

        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-balance">{recipe.title}</h1>
            <Button variant="outline" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          {recipe.description && (
            <p className="text-muted-foreground">{recipe.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <div>
                <div className="text-sm font-medium text-foreground">{recipe.prepTime + recipe.cookTime} minutes</div>
                <div className="text-xs">
                  Prep: {recipe.prepTime}m - Cook: {recipe.cookTime}m
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <div>
                <div className="text-sm font-medium text-foreground">{recipe.servings} servings</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-foreground">
                Cooked {recipe.timesCooked} time{recipe.timesCooked !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => handleRate(star)} className="focus:outline-none">
                  <Star
                    className={`h-5 w-5 transition-colors ${
                      star <= currentRating
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground hover:text-yellow-500"
                    }`}
                  />
                </button>
              ))}
            </div>
            {currentRating > 0 && (
              <span className="text-sm font-medium">{currentRating}/5</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex-1" size="lg" onClick={handleCookRecipe}>
            <UtensilsCrossed className="mr-2 h-5 w-5" />
            Cook This Recipe
          </Button>
          <Button variant="outline" size="lg" onClick={handleAddToShopping}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Shopping
          </Button>
        </div>

        {/* Ingredients */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span className="text-sm leading-relaxed">
                    {ingredient.quantity} {ingredient.unit} {ingredient.item}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Instructions</h2>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {recipe.instructions.split("\n").map((step, index) => (
                <p key={index} className="mb-3 text-sm leading-relaxed">
                  {step}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nutrition */}
        {recipe.nutrition && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Nutrition Information</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {recipe.nutrition.calories && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{recipe.nutrition.calories}</div>
                    <div className="text-xs text-muted-foreground">Calories</div>
                  </div>
                )}
                {recipe.nutrition.protein && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{recipe.nutrition.protein}g</div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                )}
                {recipe.nutrition.carbs && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{recipe.nutrition.carbs}g</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                )}
                {recipe.nutrition.fat && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{recipe.nutrition.fat}g</div>
                    <div className="text-xs text-muted-foreground">Fat</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {recipe.notes && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Notes</h2>
              <p className="text-sm text-muted-foreground">{recipe.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Source */}
        {recipe.sourceUrl && (
          <div className="text-center text-sm text-muted-foreground">
            <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              View Original Recipe
            </a>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
