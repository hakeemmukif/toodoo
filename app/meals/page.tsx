"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useMealsStore } from "@/stores/meals"
import { useRecipesStore } from "@/stores/recipes"
import { formatDate } from "@/db"
import type { MealType } from "@/lib/types"
import { Utensils, ChefHat, ShoppingBag, Check, Plus, CalendarIcon, Trash2 } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

const mealTypes: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
]

export default function MealsPage() {
  const [selectedType, setSelectedType] = useState<MealType>("breakfast")
  const [description, setDescription] = useState("")
  const [cooked, setCooked] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("")

  const meals = useMealsStore((state) => state.meals)
  const addMeal = useMealsStore((state) => state.addMeal)
  const deleteMeal = useMealsStore((state) => state.deleteMeal)
  const getMealsForDate = useMealsStore((state) => state.getMealsForDate)
  const getCookingStats = useMealsStore((state) => state.getCookingStats)

  const recipes = useRecipesStore((state) => state.recipes)

  const { toast } = useToast()

  const today = formatDate(new Date())
  const todayMeals = getMealsForDate(today)
  const stats = getCookingStats()

  // Pie chart data
  const pieData = [
    { name: "Home Cooked", value: stats.cookedMeals, color: "#22C55E" },
    { name: "Ordered Out", value: stats.orderedMeals, color: "#64748B" },
  ]

  // Get this week's meals count
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekMeals = meals.filter((m) => new Date(m.date) >= weekStart).length

  const handleLogMeal = async () => {
    if (!description.trim()) return

    await addMeal({
      type: selectedType,
      date: formatDate(selectedDate),
      description: description.trim(),
      cooked,
      recipeId: selectedRecipeId || undefined,
    })

    // Reset form
    setDescription("")
    setCooked(true)
    setSelectedDate(new Date())
    setSelectedRecipeId("")

    toast({
      title: "Meal logged",
      description: "Your meal has been recorded.",
    })
  }

  const handleDeleteMeal = async (id: string) => {
    await deleteMeal(id)
    toast({
      title: "Meal deleted",
      description: "The meal has been removed.",
    })
  }

  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipeId(recipeId)
    if (recipeId) {
      const recipe = recipes.find((r) => r.id === recipeId)
      if (recipe) {
        setDescription(recipe.title)
        setCooked(true)
      }
    }
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meals</h1>
          <p className="text-muted-foreground">Track your meals and maintain healthy eating habits</p>
        </div>

        {/* Today's Meals */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {mealTypes.map((meal) => {
                const logged = todayMeals.find((m) => m.type === meal.value)
                return (
                  <div
                    key={meal.value}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 ${
                      logged ? "border-green-500 bg-green-500/10" : "border-muted"
                    }`}
                  >
                    {logged ? (
                      <Check className="h-8 w-8 text-green-500" />
                    ) : (
                      <Utensils className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div className="text-center">
                      <div className="text-sm font-medium">{meal.label}</div>
                      {logged && (
                        <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {logged.description}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Log Meal Card */}
        <Card>
          <CardHeader>
            <CardTitle>Log Meal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meal-type">Meal Type</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as MealType)}>
                  <SelectTrigger id="meal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date)
                          setDatePickerOpen(false)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {recipes.length > 0 && (
              <div className="space-y-2">
                <Label>From Recipe (optional)</Label>
                <Select value={selectedRecipeId} onValueChange={handleRecipeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recipe..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No recipe</SelectItem>
                    {recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="description">What did you eat?</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your meal..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="cooked" className="cursor-pointer">
                Did you cook this meal?
              </Label>
              <Switch id="cooked" checked={cooked} onCheckedChange={setCooked} />
            </div>
            <Button className="w-full" onClick={handleLogMeal} disabled={!description.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Log Meal
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cooking Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.totalMeals > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-center">
                    <div className="text-3xl font-bold">{stats.cookingRatio}%</div>
                    <div className="text-sm text-muted-foreground">Home Cooked</div>
                  </div>
                </>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No meal data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                    <ChefHat className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium">Cooking Streak</div>
                    <div className="text-sm text-muted-foreground">Days in a row</div>
                  </div>
                </div>
                <div className="text-2xl font-bold">{stats.cookingStreak}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                    <Utensils className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium">Meals Logged</div>
                    <div className="text-sm text-muted-foreground">This week</div>
                  </div>
                </div>
                <div className="text-2xl font-bold">{weekMeals}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Meals */}
        {meals.length === 0 ? (
          <EmptyState
            icon={Utensils}
            title="No meals logged"
            description="Start tracking your meals to monitor your eating habits"
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Meals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {meals.slice(0, 10).map((meal) => {
                const date = new Date(meal.date)
                const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                const typeLabel = mealTypes.find((t) => t.value === meal.type)?.label

                return (
                  <div key={meal.id} className="group flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          meal.cooked ? "bg-green-500/20" : "bg-slate-500/20"
                        }`}
                      >
                        {meal.cooked ? (
                          <ChefHat className="h-5 w-5 text-green-500" />
                        ) : (
                          <ShoppingBag className="h-5 w-5 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{meal.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {typeLabel} - {dateStr}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleDeleteMeal(meal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
