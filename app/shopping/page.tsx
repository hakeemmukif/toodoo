"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useShoppingStore } from "@/stores/shopping"
import type { Priority } from "@/lib/types"
import { ShoppingCart, Plus, Trash2, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const CATEGORIES = [
  "Protein",
  "Vegetables",
  "Fruits",
  "Grains",
  "Dairy",
  "Supplements",
  "Kitchen",
  "Household",
  "Fitness",
  "Electronics",
  "Other",
]

const DEFAULT_STORES = ["Grocery Store", "Costco", "Amazon", "Trader Joe's", "Target"]

export default function ShoppingPage() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState("")
  const [newQuantity, setNewQuantity] = useState("")
  const [newCategory, setNewCategory] = useState("Other")
  const [newPriority, setNewPriority] = useState<Priority>("need")
  const [newStoreDialogOpen, setNewStoreDialogOpen] = useState(false)
  const [newStoreName, setNewStoreName] = useState("")

  const lists = useShoppingStore((state) => state.lists)
  const items = useShoppingStore((state) => state.items)
  const addList = useShoppingStore((state) => state.addList)
  const deleteList = useShoppingStore((state) => state.deleteList)
  const addItem = useShoppingStore((state) => state.addItem)
  const deleteItem = useShoppingStore((state) => state.deleteItem)
  const toggleItemBought = useShoppingStore((state) => state.toggleItemBought)
  const clearBoughtItems = useShoppingStore((state) => state.clearBoughtItems)

  const { toast } = useToast()

  // Auto-select first list if none selected
  const currentListId = selectedListId || lists[0]?.id
  const currentList = lists.find((l) => l.id === currentListId)

  // Get items for current list
  const listItems = currentListId ? items.filter((item) => item.listId === currentListId) : []
  const unboughtItems = listItems.filter((item) => item.status === "pending")
  const boughtItems = listItems.filter((item) => item.status === "bought")

  // Group items by category
  const itemsByCategory = unboughtItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, typeof unboughtItems>,
  )

  const priorityColors = {
    need: "text-red-500",
    want: "text-blue-500",
    someday: "text-muted-foreground",
  }

  const handleAddStore = async () => {
    if (!newStoreName.trim()) return
    const id = await addList(newStoreName.trim())
    setSelectedListId(id)
    setNewStoreName("")
    setNewStoreDialogOpen(false)
    toast({
      title: "Store added",
      description: `Created shopping list for ${newStoreName}.`,
    })
  }

  const handleDeleteStore = async (listId: string) => {
    await deleteList(listId)
    if (selectedListId === listId) {
      setSelectedListId(lists.find((l) => l.id !== listId)?.id || null)
    }
    toast({
      title: "Store deleted",
      description: "Shopping list has been removed.",
    })
  }

  const handleAddItem = async () => {
    if (!newItem.trim() || !currentListId) return

    await addItem({
      listId: currentListId,
      item: newItem.trim(),
      category: newCategory,
      quantity: newQuantity.trim() || undefined,
      priority: newPriority,
      status: "pending",
    })

    setNewItem("")
    setNewQuantity("")
    toast({
      title: "Item added",
      description: "Added to your shopping list.",
    })
  }

  const handleToggleItem = async (id: string) => {
    await toggleItemBought(id)
  }

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id)
    toast({
      title: "Item removed",
      description: "Item has been removed from the list.",
    })
  }

  const handleClearBought = async () => {
    if (!currentListId) return
    await clearBoughtItems(currentListId)
    toast({
      title: "Cleared",
      description: "All bought items have been removed.",
    })
  }

  const handleQuickAddStore = async (storeName: string) => {
    const existingList = lists.find((l) => l.store === storeName)
    if (existingList) {
      setSelectedListId(existingList.id)
      return
    }
    const id = await addList(storeName)
    setSelectedListId(id)
    toast({
      title: "Store added",
      description: `Created shopping list for ${storeName}.`,
    })
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shopping Lists</h1>
            <p className="text-muted-foreground">Organize your shopping by store</p>
          </div>
          <Dialog open={newStoreDialogOpen} onOpenChange={setNewStoreDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Store className="mr-2 h-4 w-4" />
                Add Store
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Store</DialogTitle>
                <DialogDescription>Create a new shopping list for a store.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Store Name</Label>
                  <Input
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    placeholder="e.g., Whole Foods"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Quick Add</Label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_STORES.filter((s) => !lists.some((l) => l.store === s)).map((store) => (
                      <Button
                        key={store}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleQuickAddStore(store)
                          setNewStoreDialogOpen(false)
                        }}
                      >
                        {store}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewStoreDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStore} disabled={!newStoreName.trim()}>
                  Add Store
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Store Tabs */}
        {lists.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {lists.map((list) => {
              const count = items.filter((item) => item.listId === list.id && item.status === "pending").length
              return (
                <div key={list.id} className="group relative">
                  <Button
                    variant={currentListId === list.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedListId(list.id)}
                  >
                    {list.store}
                    {count > 0 && (
                      <span className="ml-2 rounded-full bg-primary-foreground px-2 py-0.5 text-xs text-primary">
                        {count}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteStore(list.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Store className="mb-3 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-sm text-muted-foreground">No shopping lists yet</p>
              <Button onClick={() => setNewStoreDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First List
              </Button>
            </CardContent>
          </Card>
        )}

        {currentList && (
          <>
            {/* Add Item */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Item to {currentList.store}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Item name..."
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  />
                  <Input
                    placeholder="Qty"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-24"
                  />
                  <Button onClick={handleAddItem} disabled={!newItem.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Priority)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="need">Need</SelectItem>
                      <SelectItem value="want">Want</SelectItem>
                      <SelectItem value="someday">Someday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Shopping List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Items to Buy</CardTitle>
                {boughtItems.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleClearBought}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Bought ({boughtItems.length})
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.keys(itemsByCategory).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No items in this list</p>
                  </div>
                ) : (
                  Object.entries(itemsByCategory).map(([category, categoryItems]) => (
                    <div key={category}>
                      <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">{category}</h3>
                      <div className="space-y-2">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="group flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                          >
                            <div className="flex flex-1 items-center gap-3">
                              <Checkbox
                                checked={item.status === "bought"}
                                onCheckedChange={() => handleToggleItem(item.id)}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{item.item}</div>
                                {item.quantity && (
                                  <div className="text-sm text-muted-foreground">{item.quantity}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn("text-xs font-medium uppercase", priorityColors[item.priority])}>
                                {item.priority}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Bought Items */}
            {boughtItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Bought Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {boughtItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 rounded-lg p-2 opacity-50 transition-opacity hover:opacity-75"
                    >
                      <Checkbox
                        checked
                        onCheckedChange={() => handleToggleItem(item.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium line-through">{item.item}</div>
                        {item.quantity && (
                          <div className="text-sm text-muted-foreground">{item.quantity}</div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
