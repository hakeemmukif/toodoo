"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/empty-state"
import { useInventoryStore } from "@/stores/inventory"
import { suggestCategory } from "@/services/inventory"
import type { IngredientCategory, IngredientUnit } from "@/lib/types"
import { Plus, Package, Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const CATEGORIES: { value: IngredientCategory; label: string }[] = [
  { value: "protein", label: "Protein" },
  { value: "vegetable", label: "Vegetable" },
  { value: "fruit", label: "Fruit" },
  { value: "dairy", label: "Dairy" },
  { value: "grain", label: "Grain" },
  { value: "spice", label: "Spice" },
  { value: "sauce", label: "Sauce" },
  { value: "oil", label: "Oil" },
  { value: "other", label: "Other" },
]

const UNITS: { value: IngredientUnit; label: string }[] = [
  { value: "g", label: "grams (g)" },
  { value: "kg", label: "kilograms (kg)" },
  { value: "ml", label: "milliliters (ml)" },
  { value: "l", label: "liters (l)" },
  { value: "cup", label: "cups" },
  { value: "tbsp", label: "tablespoons" },
  { value: "tsp", label: "teaspoons" },
  { value: "piece", label: "pieces" },
  { value: "whole", label: "whole" },
  { value: "clove", label: "cloves" },
  { value: "slice", label: "slices" },
  { value: "bunch", label: "bunches" },
]

export function PantryManager() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formQuantity, setFormQuantity] = useState("")
  const [formUnit, setFormUnit] = useState<IngredientUnit>("g")
  const [formCategory, setFormCategory] = useState<IngredientCategory>("other")
  const [formExpiry, setFormExpiry] = useState("")

  const { items, addItem, deleteItem, getByCategory, getExpiringSoon } = useInventoryStore()
  const { toast } = useToast()

  const expiringSoon = getExpiringSoon(7)

  const handleNameChange = (name: string) => {
    setFormName(name)
    // Auto-suggest category when typing
    if (name.length > 2) {
      const suggested = suggestCategory(name)
      setFormCategory(suggested)
    }
  }

  const handleAddItem = async () => {
    if (!formName.trim() || !formQuantity) return

    await addItem({
      name: formName.trim(),
      quantity: parseFloat(formQuantity),
      unit: formUnit,
      category: formCategory,
      expiresAt: formExpiry || undefined,
    })

    // Reset form
    setFormName("")
    setFormQuantity("")
    setFormUnit("g")
    setFormCategory("other")
    setFormExpiry("")
    setDialogOpen(false)

    toast({
      title: "Added to pantry",
      description: `${formName} has been added to your pantry.`,
    })
  }

  const handleDeleteItem = async (id: string, name: string) => {
    await deleteItem(id)
    toast({
      title: "Removed from pantry",
      description: `${name} has been removed.`,
    })
  }

  // Group items by category
  const groupedItems = CATEGORIES.map((cat) => ({
    category: cat,
    items: getByCategory(cat.value),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="space-y-6">
      {/* Add Item Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My Pantry</h2>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Pantry</DialogTitle>
              <DialogDescription>
                Track what ingredients you have at home.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Ingredient Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Chicken breast"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="e.g., 500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={formUnit} onValueChange={(v) => setFormUnit(v as IngredientUnit)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as IngredientCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date (optional)</Label>
                <Input
                  type="date"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem} disabled={!formName.trim() || !formQuantity}>
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expiring Soon Alert */}
      {expiringSoon.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium text-yellow-700 dark:text-yellow-400">
                Expiring Soon
              </p>
              <p className="text-sm text-muted-foreground">
                {expiringSoon.map((i) => i.name).join(", ")} - use these first!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Pantry is empty"
          description="Add ingredients you have at home to get recipe suggestions"
          actionLabel="Add Ingredient"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        /* Grouped Items */
        <div className="space-y-4">
          {groupedItems.map((group) => (
            <Card key={group.category.value}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{group.category.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit}
                          {item.expiresAt && (
                            <span className="ml-2 text-xs">
                              (expires {item.expiresAt})
                            </span>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id, item.name)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
