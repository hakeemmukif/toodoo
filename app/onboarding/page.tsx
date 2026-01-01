"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useGoalsStore } from "@/stores/goals"
import { useAppStore } from "@/stores/app"
import type { LifeAspect } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const aspects = Object.keys(ASPECT_CONFIG) as LifeAspect[]

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [goals, setGoals] = useState<Record<LifeAspect, { goal: string; criteria: string; skip: boolean }>>({
    fitness: { goal: "", criteria: "", skip: false },
    nutrition: { goal: "", criteria: "", skip: false },
    career: { goal: "", criteria: "", skip: false },
    financial: { goal: "", criteria: "", skip: false },
    "side-projects": { goal: "", criteria: "", skip: false },
    chores: { goal: "", criteria: "", skip: false },
  })

  const addYearlyGoal = useGoalsStore((state) => state.addYearlyGoal)
  const updateSettings = useAppStore((state) => state.updateSettings)

  const currentAspect = aspects[currentStep]
  const config = currentAspect ? ASPECT_CONFIG[currentAspect] : null
  const Icon = config?.icon
  const progress = ((currentStep + 1) / (aspects.length + 1)) * 100

  const handleNext = () => {
    if (currentStep < aspects.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Show summary
      setCurrentStep(aspects.length)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    if (currentAspect) {
      setGoals({
        ...goals,
        [currentAspect]: { ...goals[currentAspect], skip: true },
      })
    }
    handleNext()
  }

  const handleFinish = async () => {
    setIsSaving(true)
    const currentYear = new Date().getFullYear()

    try {
      // Save all non-skipped goals to the database
      const goalsToSave = Object.entries(goals).filter(
        ([_, data]) => !data.skip && data.goal.trim()
      )

      for (const [aspect, data] of goalsToSave) {
        await addYearlyGoal({
          aspect: aspect as LifeAspect,
          year: currentYear,
          title: data.goal,
          description: data.criteria,
          successCriteria: data.criteria,
          status: "active",
          progress: 0,
        })
      }

      // Mark onboarding as completed
      await updateSettings({ onboardingCompleted: true })

      toast({
        title: "Setup complete!",
        description: `Created ${goalsToSave.length} yearly goal${goalsToSave.length !== 1 ? "s" : ""}.`,
      })

      // Redirect to dashboard
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your goals. Please try again.",
        variant: "destructive",
      })
      setIsSaving(false)
    }
  }

  if (currentStep >= aspects.length) {
    // Summary screen
    const goalsSet = Object.entries(goals).filter(([_, data]) => !data.skip && data.goal)
    const skipped = Object.entries(goals).filter(([_, data]) => data.skip)

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">You're All Set!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Goals Set ({goalsSet.length})</h3>
              {goalsSet.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No goals set. You can always add goals later from the Goals page.
                </p>
              ) : (
                goalsSet.map(([aspect, data]) => {
                  const aspectConfig = ASPECT_CONFIG[aspect as LifeAspect]
                  const AspectIcon = aspectConfig.icon
                  return (
                    <div key={aspect} className="rounded-lg border border-border p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <AspectIcon className="h-5 w-5" style={{ color: aspectConfig.color }} />
                        <span className="font-medium">{aspectConfig.label}</span>
                      </div>
                      <p className="text-sm">{data.goal}</p>
                      {data.criteria && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Success: {data.criteria}
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            {skipped.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Skipped: {skipped.map(([aspect]) => ASPECT_CONFIG[aspect as LifeAspect].label).join(", ")}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setCurrentStep(0)}
                disabled={isSaving}
              >
                Start Over
              </Button>
              <Button className="flex-1" size="lg" onClick={handleFinish} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Step {currentStep + 1} of {aspects.length}
            </p>
          </div>
          <CardTitle className="flex items-center justify-center gap-3 text-2xl">
            {Icon && <Icon className="h-8 w-8" style={{ color: config?.color }} />}
            {config?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="goal">What's your {config?.label} goal for this year?</Label>
            <Input
              id="goal"
              placeholder={
                currentAspect === "fitness"
                  ? "e.g., Train 4x per week consistently"
                  : currentAspect === "nutrition"
                    ? "e.g., Cook 80% of my meals at home"
                    : currentAspect === "career"
                      ? "e.g., Get promoted to senior role"
                      : currentAspect === "financial"
                        ? "e.g., Save 20% of income each month"
                        : currentAspect === "side-projects"
                          ? "e.g., Launch my side project"
                          : "e.g., Keep home organized weekly"
              }
              value={goals[currentAspect]?.goal || ""}
              onChange={(e) =>
                setGoals({
                  ...goals,
                  [currentAspect]: { ...goals[currentAspect], goal: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="criteria">How will you know you've achieved it?</Label>
            <Textarea
              id="criteria"
              placeholder={
                currentAspect === "fitness"
                  ? "e.g., Complete 200+ training sessions by year end"
                  : currentAspect === "nutrition"
                    ? "e.g., Average 5+ home-cooked meals per week"
                    : currentAspect === "career"
                      ? "e.g., Receive promotion with 20% salary increase"
                      : currentAspect === "financial"
                        ? "e.g., Have $10,000+ in savings account"
                        : currentAspect === "side-projects"
                          ? "e.g., 1000+ users signed up"
                          : "e.g., Complete weekly cleaning routine 90% of weeks"
              }
              rows={3}
              value={goals[currentAspect]?.criteria || ""}
              onChange={(e) =>
                setGoals({
                  ...goals,
                  [currentAspect]: { ...goals[currentAspect], criteria: e.target.value },
                })
              }
            />
          </div>
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button variant="outline" className="flex-1 bg-transparent" onClick={handleSkip}>
              Skip
            </Button>
            <Button
              className="flex-1"
              onClick={handleNext}
              disabled={!goals[currentAspect]?.goal || !goals[currentAspect]?.criteria}
            >
              {currentStep === aspects.length - 1 ? "Review" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
