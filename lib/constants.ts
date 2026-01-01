import type { LifeAspect } from "./types"
import { Dumbbell, Utensils, Briefcase, DollarSign, Code, Home } from "lucide-react"

export const ASPECT_CONFIG: Record<LifeAspect, { color: string; label: string; icon: any; initial: string }> = {
  fitness: { color: "oklch(0.56 0.10 25)", label: "Fitness", icon: Dumbbell, initial: "F" },
  nutrition: { color: "oklch(0.58 0.08 145)", label: "Nutrition", icon: Utensils, initial: "N" },
  career: { color: "oklch(0.52 0.06 250)", label: "Career", icon: Briefcase, initial: "C" },
  financial: { color: "oklch(0.65 0.09 85)", label: "Financial", icon: DollarSign, initial: "$" },
  "side-projects": { color: "oklch(0.54 0.06 310)", label: "Side Projects", icon: Code, initial: "S" },
  chores: { color: "oklch(0.58 0.02 50)", label: "Chores", icon: Home, initial: "H" },
}
