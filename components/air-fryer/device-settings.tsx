"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAirFryerStore } from "@/stores/air-fryer"
import { Settings, ChevronDown, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Common air fryer capacities for reference
const CAPACITY_MARKERS = [
  { value: 2, label: "2L", description: "Compact" },
  { value: 3.5, label: "3.5L", description: "Standard" },
  { value: 5.5, label: "5.5L", description: "Family" },
  { value: 7, label: "7L", description: "XL" },
  { value: 10, label: "10L", description: "XXL" },
]

export function DeviceSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [capacity, setCapacity] = useState(3.5)
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C")
  const [hasChanges, setHasChanges] = useState(false)

  const { device, loadDevice, saveDevice } = useAirFryerStore()
  const { toast } = useToast()

  // Load device settings on mount
  useEffect(() => {
    loadDevice()
  }, [loadDevice])

  // Sync form state with loaded device
  useEffect(() => {
    if (device) {
      setName(device.name || "")
      setCapacity(device.capacityLiters)
      setTempUnit(device.temperatureUnit)
      setHasChanges(false)
    }
  }, [device])

  const handleSave = async () => {
    await saveDevice({
      name: name.trim() || undefined,
      capacityLiters: capacity,
      temperatureUnit: tempUnit,
    })
    setHasChanges(false)
    toast({
      title: "Settings saved",
      description: "Your air fryer settings have been updated.",
    })
  }

  const handleCapacityChange = (value: number[]) => {
    setCapacity(value[0])
    setHasChanges(true)
  }

  const handleTempUnitChange = (unit: "C" | "F") => {
    setTempUnit(unit)
    setHasChanges(true)
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setHasChanges(true)
  }

  // Calculate portion comparison text
  const getPortionComparison = () => {
    const standard = 3.5
    if (capacity === standard) return null
    const ratio = capacity / standard
    if (ratio > 1) {
      return `Fits ~${ratio.toFixed(1)}x portions of a standard 3.5L`
    }
    return `Fits ~${(ratio * 100).toFixed(0)}% of a standard 3.5L recipe`
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">
            {device ? `${device.capacityLiters}L · °${device.temperatureUnit}` : "Setup"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Air Fryer Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Device Name */}
            <div className="space-y-2">
              <Label htmlFor="device-name">Device Model (optional)</Label>
              <Input
                id="device-name"
                placeholder="e.g., Philips XXL, Ninja AF101"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                For your reference only
              </p>
            </div>

            {/* Capacity Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Basket Capacity</Label>
                <span className="text-lg font-semibold">{capacity}L</span>
              </div>
              <Slider
                value={[capacity]}
                onValueChange={handleCapacityChange}
                min={1}
                max={10}
                step={0.5}
                className="py-4"
              />
              {/* Capacity markers */}
              <div className="flex justify-between text-xs text-muted-foreground">
                {CAPACITY_MARKERS.map((marker) => (
                  <button
                    key={marker.value}
                    onClick={() => {
                      setCapacity(marker.value)
                      setHasChanges(true)
                    }}
                    className={cn(
                      "flex flex-col items-center transition-colors hover:text-foreground",
                      capacity === marker.value && "text-foreground font-medium"
                    )}
                  >
                    <span>{marker.label}</span>
                    <span className="text-[10px]">{marker.description}</span>
                  </button>
                ))}
              </div>
              {/* Portion comparison */}
              {getPortionComparison() && (
                <p className="text-sm text-muted-foreground text-center">
                  {getPortionComparison()}
                </p>
              )}
            </div>

            {/* Temperature Unit Toggle */}
            <div className="space-y-2">
              <Label>Temperature Unit</Label>
              <div className="flex gap-2">
                <Button
                  variant={tempUnit === "C" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTempUnitChange("C")}
                  className="flex-1"
                >
                  Celsius (°C)
                </Button>
                <Button
                  variant={tempUnit === "F" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTempUnitChange("F")}
                  className="flex-1"
                >
                  Fahrenheit (°F)
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="w-full"
            >
              <Check className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
