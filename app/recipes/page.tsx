"use client"

import { useState } from "react"
import Link from "next/link"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/empty-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRecipesStore } from "@/stores/recipes"
import type { RecipeIngredient } from "@/lib/types"
import { BookMarked, Plus, Search, Clock, Users, Star, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const RECIPE_TAGS = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Quick",
  "Healthy",
  "High-Protein",
  "Vegetarian",
  "Meal-Prep",
]

export default function RecipesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formInstructions, setFormInstructions] = useState("")
  const [formPrepTime, setFormPrepTime] = useState("15")
  const [formCookTime, setFormCookTime] = useState("30")
  const [formServings, setFormServings] = useState("4")
  const [formTags, setFormTags] = useState<string[]>([])
  const [formIngredients, setFormIngredients] = useState<{ item: string; quantity: string; unit: string }[]>([
    { item: "", quantity: "", unit: "" },
  ])

  const recipes = useRecipesStore((state) => state.recipes)
  const addRecipe = useRecipesStore((state) => state.addRecipe)
  const deleteRecipe = useRecipesStore((state) => state.deleteRecipe)
  const searchRecipes = useRecipesStore((state) => state.searchRecipes)

  const { toast } = useToast()

  const filteredRecipes = searchQuery
    ? searchRecipes(searchQuery).filter(
        (recipe) => selectedTags.length === 0 || selectedTags.every((tag) => recipe.tags.includes(tag))
      )
    : recipes.filter(
        (recipe) => selectedTags.length === 0 || selectedTags.every((tag) => recipe.tags.includes(tag))
      )

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const toggleFormTag = (tag: string) => {
    setFormTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const addIngredientRow = () => {
    setFormIngredients([...formIngredients, { item: "", quantity: "", unit: "" }])
  }

  const removeIngredientRow = (index: number) => {
    setFormIngredients(formIngredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: string, value: string) => {
    const updated = [...formIngredients]
    updated[index] = { ...updated[index], [field]: value }
    setFormIngredients(updated)
  }

  const handleAddRecipe = async () => {
    if (!formTitle.trim() || !formInstructions.trim()) return

    const ingredients: RecipeIngredient[] = formIngredients
      .filter((i) => i.item.trim())
      .map((i) => ({
        item: i.item.trim(),
        quantity: parseFloat(i.quantity) || 1,
        unit: i.unit.trim() || "unit",
      }))

    await addRecipe({
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      instructions: formInstructions.trim(),
      prepTime: parseInt(formPrepTime) || 15,
      cookTime: parseInt(formCookTime) || 30,
      servings: parseInt(formServings) || 4,
      tags: formTags,
      ingredients,
    })

    // Reset form
    setFormTitle("")
    setFormDescription("")
    setFormInstructions("")
    setFormPrepTime("15")
    setFormCookTime("30")
    setFormServings("4")
    setFormTags([])
    setFormIngredients([{ item: "", quantity: "", unit: "" }])
    setDialogOpen(false)

    toast({
      title: "Recipe added",
      description: "Your recipe has been saved to your collection.",
    })
  }

  const handleDeleteRecipe = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    await deleteRecipe(id)
    toast({
      title: "Recipe deleted",
      description: "The recipe has been removed from your collection.",
    })
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
            <p className="text-muted-foreground">Your personal recipe collection</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Recipe</DialogTitle>
                <DialogDescription>Add a new recipe to your collection.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Recipe name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of the recipe"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Prep Time (min)</Label>
                    <Input
                      type="number"
                      value={formPrepTime}
                      onChange={(e) => setFormPrepTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cook Time (min)</Label>
                    <Input
                      type="number"
                      value={formCookTime}
                      onChange={(e) => setFormCookTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Servings</Label>
                    <Input
                      type="number"
                      value={formServings}
                      onChange={(e) => setFormServings(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {RECIPE_TAGS.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant={formTags.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleFormTag(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Ingredients</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addIngredientRow}>
                      <Plus className="mr-1 h-3 w-3" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formIngredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={ingredient.quantity}
                          onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                          placeholder="Qty"
                          className="w-20"
                        />
                        <Input
                          value={ingredient.unit}
                          onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                          placeholder="Unit"
                          className="w-20"
                        />
                        <Input
                          value={ingredient.item}
                          onChange={(e) => updateIngredient(index, "item", e.target.value)}
                          placeholder="Ingredient"
                          className="flex-1"
                        />
                        {formIngredients.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeIngredientRow(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    value={formInstructions}
                    onChange={(e) => setFormInstructions(e.target.value)}
                    placeholder="Step by step instructions..."
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRecipe} disabled={!formTitle.trim() || !formInstructions.trim()}>
                  Add Recipe
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recipes or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tag Filter */}
        <div className="flex flex-wrap gap-2">
          {RECIPE_TAGS.map((tag) => (
            <Button
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>

        {/* Recipe Grid */}
        {filteredRecipes.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="No recipes found"
            description={recipes.length === 0 ? "Add your first recipe to get started" : "Try adjusting your search or filters"}
            actionLabel="Add Recipe"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                <Card className="group h-full cursor-pointer transition-shadow hover:shadow-lg">
                  <CardContent className="relative p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => handleDeleteRecipe(e, recipe.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <h3 className="mb-3 pr-8 font-semibold leading-tight text-pretty">{recipe.title}</h3>
                    <div className="mb-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {recipe.prepTime + recipe.cookTime}m
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {recipe.servings}
                      </div>
                      {recipe.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          {recipe.rating}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recipe.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {tag}
                        </span>
                      ))}
                      {recipe.tags.length > 3 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">+{recipe.tags.length - 3}</span>
                      )}
                    </div>
                    {recipe.timesCooked > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Cooked {recipe.timesCooked} time{recipe.timesCooked > 1 ? "s" : ""}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
