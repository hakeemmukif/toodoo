"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTrainingStore } from "@/stores/training"
import { useMealsStore } from "@/stores/meals"
import { useToast } from "@/hooks/use-toast"
import { Plus, Dumbbell, UtensilsCrossed, X } from "lucide-react"
import type { TrainingType, MealType } from "@/lib/types"
import { cn } from "@/lib/utils"

interface QuickLogFABProps {
  className?: string
}

type LogMode = "training" | "meal" | null

export function QuickLogFAB({ className }: QuickLogFABProps) {
  const [expanded, setExpanded] = useState(false)
  const [logMode, setLogMode] = useState<LogMode>(null)

  // Training form state
  const [trainingType, setTrainingType] = useState<TrainingType>("muay-thai")
  const [duration, setDuration] = useState("60")
  const [intensity, setIntensity] = useState("7")

  // Meal form state
  const [mealName, setMealName] = useState("")
  const [mealType, setMealType] = useState<MealType>("dinner")
  const [cooked, setCooked] = useState(true)

  const { quickLogSession } = useTrainingStore()
  const { quickLogMeal } = useMealsStore()
  const { toast } = useToast()

  const handleTrainingSubmit = async () => {
    if (!duration || parseInt(duration) <= 0) {
      toast({ title: "Duration required", variant: "destructive" })
      return
    }

    await quickLogSession(
      trainingType,
      parseInt(duration),
      parseInt(intensity) || 5
    )

    toast({ title: "Session logged" })
    resetAndClose()
  }

  const handleMealSubmit = async () => {
    if (!mealName.trim()) {
      toast({ title: "Meal name required", variant: "destructive" })
      return
    }

    await quickLogMeal(mealName.trim(), cooked, mealType)

    toast({ title: cooked ? "Cooked meal logged" : "Meal logged" })
    resetAndClose()
  }

  const resetAndClose = () => {
    setLogMode(null)
    setExpanded(false)
    // Reset forms
    setTrainingType("muay-thai")
    setDuration("60")
    setIntensity("7")
    setMealName("")
    setMealType("dinner")
    setCooked(true)
  }

  const trainingTypes: { value: TrainingType; label: string }[] = [
    { value: "muay-thai", label: "Muay Thai" },
    { value: "cardio", label: "Cardio" },
    { value: "strength", label: "Strength" },
    { value: "flexibility", label: "Flexibility" },
    { value: "dj-practice", label: "DJ Practice" },
    { value: "other", label: "Other" },
  ]

  const mealTypes: { value: MealType; label: string }[] = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snack" },
  ]

  return (
    <>
      {/* FAB Container */}
      <div className={cn("fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3", className)}>
        {/* Expanded Options */}
        {expanded && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Button
              variant="secondary"
              size="lg"
              className="shadow-lg gap-2"
              onClick={() => {
                setLogMode("meal")
                setExpanded(false)
              }}
            >
              <UtensilsCrossed className="h-4 w-4" />
              Log Meal
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="shadow-lg gap-2"
              onClick={() => {
                setLogMode("training")
                setExpanded(false)
              }}
            >
              <Dumbbell className="h-4 w-4" />
              Log Training
            </Button>
          </div>
        )}

        {/* Main FAB */}
        <Button
          size="icon-lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-transform",
            expanded && "rotate-45"
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </div>

      {/* Training Quick Log Dialog */}
      <Dialog open={logMode === "training"} onOpenChange={(open) => !open && resetAndClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Quick Log Training
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={trainingType} onValueChange={(v) => setTrainingType(v as TrainingType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trainingTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  max="300"
                />
              </div>
              <div className="space-y-2">
                <Label>Intensity (1-10)</Label>
                <Input
                  type="number"
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value)}
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Quick log for activity tracking. Link to a goal later if needed.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button onClick={handleTrainingSubmit}>Log Session</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meal Quick Log Dialog */}
      <Dialog open={logMode === "meal"} onOpenChange={(open) => !open && resetAndClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Quick Log Meal
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>What did you eat?</Label>
              <Input
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g., Chicken rice, Nasi lemak"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
                  <SelectTrigger>
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
                <Label>Cooked or Ordered?</Label>
                <Select value={cooked ? "cooked" : "ordered"} onValueChange={(v) => setCooked(v === "cooked")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cooked">Cooked</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Quick log for cooking stats. All meals count toward your cooking ratio.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button onClick={handleMealSubmit}>Log Meal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
