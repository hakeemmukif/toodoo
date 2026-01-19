"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCookingSessionStore } from "@/stores/cooking-session"
import { BatchPlanner } from "./batch-planner"
import { IngredientAutocomplete } from "@/components/air-fryer/ingredient-autocomplete"
import type { IngredientSuggestion } from "@/lib/types"
import {
  Plus,
  Trash2,
  Thermometer,
  Clock,
  RefreshCw,
  Sparkles,
  ChefHat,
  Layers,
  Zap,
} from "lucide-react"

export function SessionBuilder() {
  const {
    currentSession,
    createSession,
    addItem,
    removeItem,
    clearItems,
    optimizeSession,
  } = useCookingSessionStore()


  // Quick add form state
  const [name, setName] = useState("")
  const [temperature, setTemperature] = useState("180")
  const [timeMinutes, setTimeMinutes] = useState("15")
  const [shakeHalfway, setShakeHalfway] = useState(false)
  const [activeTab, setActiveTab] = useState("add")

  // Handle ingredient selection from autocomplete
  const handleIngredientSelect = useCallback((suggestion: IngredientSuggestion) => {
    setName(suggestion.ingredient)
    setTemperature(String(suggestion.temperature))
    setTimeMinutes(String(suggestion.timeMinutes))
    setShakeHalfway(suggestion.shakeHalfway)
  }, [])

  // Initialize session if none exists
  if (!currentSession) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
          <ChefHat className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Start a new cooking session</p>
          <Button onClick={createSession}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleAddItem = () => {
    if (!name.trim() || !temperature || !timeMinutes) return

    addItem({
      name: name.trim(),
      temperature: parseInt(temperature),
      timeMinutes: parseInt(timeMinutes),
      shakeHalfway,
    })

    // Reset form
    setName("")
    setTemperature("180")
    setTimeMinutes("15")
    setShakeHalfway(false)
  }


  const hasItems = currentSession.items.length > 0

  return (
    <div className="space-y-4">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Build Your Session</h2>
          <p className="text-sm text-muted-foreground">
            {currentSession.items.length} item{currentSession.items.length !== 1 ? "s" : ""} added
          </p>
        </div>
        {hasItems && (
          <Button variant="ghost" size="sm" onClick={clearItems}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Clear All
          </Button>
        )}
      </div>

      {/* Tabs: Add Items / Plan Batches */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Items
          </TabsTrigger>
          <TabsTrigger
            value="batches"
            className="flex items-center gap-2"
            disabled={!hasItems}
          >
            <Layers className="h-4 w-4" />
            Plan Batches
            {hasItems && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs">
                {currentSession.items.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Add Items Tab */}
        <TabsContent value="add" className="space-y-4 mt-4">
          {/* Items List */}
          {hasItems && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Items Added</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {currentSession.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Thermometer className="h-3 w-3" />
                            {item.temperature}C
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.timeMinutes}min
                          </span>
                          {item.shakeHalfway && (
                            <span className="flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" />
                              Shake
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}


          {/* Quick Add Form */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Quick Add Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="item-name">Item Name</Label>
                <IngredientAutocomplete
                  id="item-name"
                  value={name}
                  onChange={setName}
                  onSelect={handleIngredientSelect}
                  placeholder="e.g., Chicken breast, Potatoes"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    min="100"
                    max="250"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time (minutes)</Label>
                  <Input
                    id="time"
                    type="number"
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(e.target.value)}
                    min="1"
                    max="120"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="shake" className="cursor-pointer">
                  Shake/flip halfway?
                </Label>
                <Switch
                  id="shake"
                  checked={shakeHalfway}
                  onCheckedChange={setShakeHalfway}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleAddItem}
                disabled={!name.trim() || !temperature || !timeMinutes}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Quick optimize (auto mode) or go to batches */}
          {hasItems && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setActiveTab("batches")}
              >
                <Layers className="mr-2 h-4 w-4" />
                Plan Batches
              </Button>
              <Button
                className="flex-1"
                onClick={optimizeSession}
              >
                <Zap className="mr-2 h-4 w-4" />
                Quick Optimize
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Plan Batches Tab */}
        <TabsContent value="batches" className="mt-4">
          <BatchPlanner />
        </TabsContent>
      </Tabs>
    </div>
  )
}
