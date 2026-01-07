"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/components/ui/use-mobile"
import { usePlanningStore } from "@/stores/planning"
import { ASPECT_CONFIG } from "@/lib/constants"
import type { LifeAspect } from "@/lib/types"
import {
  Sparkles,
  MessageSquare,
  FileText,
  CheckCircle,
  AlertCircle,
  Send,
  RotateCcw,
  Target,
  Calendar,
  ListTodo,
  ChevronRight,
  X,
} from "lucide-react"

interface PlanningModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultAspect?: LifeAspect
}

type PlanningStep = "capture" | "generating" | "reviewing" | "refining" | "committing" | "success"

export function PlanningModal({ open, onOpenChange, defaultAspect }: PlanningModalProps) {
  const isMobile = useIsMobile()
  const { toast } = useToast()

  // Local state
  const [step, setStep] = useState<PlanningStep>("capture")
  const [userInput, setUserInput] = useState("")
  const [selectedAspect, setSelectedAspect] = useState<LifeAspect>(defaultAspect || "career")
  const [refinementInput, setRefinementInput] = useState("")
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat")

  // Planning store
  const {
    currentDraft,
    isAnalyzing,
    isRefining,
    isCommitting,
    isOllamaConnected,
    error,
    timeEstimate,
    validationResult,
    initializeContext,
    checkConnection,
    startNewPlan,
    refinePlan,
    commitPlan,
    resetPlan,
  } = usePlanningStore()

  // Initialize on open
  useEffect(() => {
    if (open) {
      initializeContext()
      checkConnection()
    }
  }, [open, initializeContext, checkConnection])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("capture")
      setUserInput("")
      setRefinementInput("")
      setMobileTab("chat")
    }
  }, [open])

  // Update step based on store state
  useEffect(() => {
    if (isAnalyzing) {
      setStep("generating")
    } else if (isRefining) {
      setStep("refining")
    } else if (isCommitting) {
      setStep("committing")
    } else if (currentDraft && step === "generating") {
      setStep("reviewing")
    }
  }, [isAnalyzing, isRefining, isCommitting, currentDraft, step])

  const handleStartPlanning = async () => {
    if (!userInput.trim()) return

    if (!isOllamaConnected) {
      toast({
        title: "Ollama not connected",
        description: "Please ensure Ollama is running at localhost:11434",
        variant: "destructive",
      })
      return
    }

    await startNewPlan(userInput.trim(), selectedAspect)
  }

  const handleRefine = async () => {
    if (!refinementInput.trim() || !currentDraft) return
    await refinePlan(refinementInput.trim())
    setRefinementInput("")
  }

  const handleCommit = async () => {
    try {
      const result = await commitPlan()
      setStep("success")
      toast({
        title: "Goal plan created",
        description: `Created ${result.monthlyGoalIds.length} monthly goals, ${result.weeklyGoalIds.length} weekly goals, and ${result.taskIds.length} tasks.`,
      })
    } catch (err) {
      toast({
        title: "Failed to commit plan",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleReset = () => {
    resetPlan()
    setStep("capture")
    setUserInput("")
    setRefinementInput("")
  }

  const handleClose = () => {
    if (currentDraft && step !== "success") {
      // Plan will be auto-saved
    }
    onOpenChange(false)
    if (step === "success") {
      handleReset()
    }
  }

  // Render content
  const renderContent = () => {
    // Connection check
    if (!isOllamaConnected && step === "capture") {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ollama Not Connected</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            AI-powered goal planning requires Ollama to be running locally.
          </p>
          <Button variant="outline" onClick={() => checkConnection()}>
            Retry Connection
          </Button>
        </div>
      )
    }

    // Success state
    if (step === "success") {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Plan Created</h3>
          <p className="text-muted-foreground mb-4">
            Your goal and all related milestones have been created.
          </p>
          <Button onClick={handleClose}>Close</Button>
        </div>
      )
    }

    // Loading states
    if (step === "generating" || step === "committing") {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Spinner className="h-8 w-8 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {step === "generating" ? "Analyzing your goal..." : "Creating your plan..."}
          </h3>
          <p className="text-muted-foreground">
            {step === "generating"
              ? "Breaking down your goal into actionable milestones"
              : "Saving goals and tasks to your tracker"}
          </p>
        </div>
      )
    }

    // Capture step
    if (step === "capture") {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>What do you want to achieve?</Label>
            <Textarea
              placeholder="e.g., I want to get in shape for a muay thai fight in 6 months, or I want to build a DJ set library with 50 tracks by end of year..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Life Aspect</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ASPECT_CONFIG).map(([aspect, config]) => {
                const Icon = config.icon
                return (
                  <Button
                    key={aspect}
                    variant={selectedAspect === aspect ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedAspect(aspect as LifeAspect)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {config.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <Button
            onClick={handleStartPlanning}
            disabled={!userInput.trim() || !isOllamaConnected}
            className="w-full"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Plan
          </Button>
        </div>
      )
    }

    // Review/Refine steps - Two column layout
    if (step === "reviewing" || step === "refining") {
      const conversationPanel = (
        <div className="flex flex-col h-full">
          {/* Conversation history */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {currentDraft?.conversationHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}

              {/* AI Analysis */}
              {currentDraft?.analysis && (
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <p className="text-sm">{currentDraft.analysis}</p>

                  {currentDraft.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Suggestions:
                      </p>
                      <ul className="text-sm space-y-1">
                        {currentDraft.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentDraft.warnings.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-amber-600 mb-1">
                        Challenges to consider:
                      </p>
                      <ul className="text-sm space-y-1">
                        {currentDraft.warnings.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-amber-700">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {isRefining && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Spinner className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Refinement input */}
          <div className="pt-4 border-t mt-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Refine the plan... e.g., 'Make it more aggressive' or 'Add more rest days'"
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <Button
                onClick={handleRefine}
                disabled={!refinementInput.trim() || isRefining}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )

      const previewPanel = (
        <div className="space-y-4">
          {/* Yearly Goal */}
          {currentDraft?.yearlyGoal && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Yearly Goal</h4>
              </div>
              <p className="font-medium">{currentDraft.yearlyGoal.title}</p>
              {currentDraft.yearlyGoal.description && (
                <p className="text-sm text-muted-foreground">
                  {currentDraft.yearlyGoal.description}
                </p>
              )}
              <p className="text-sm">
                <span className="text-muted-foreground">Success: </span>
                {currentDraft.yearlyGoal.successCriteria}
              </p>
              {currentDraft.yearlyGoal.identityStatement && (
                <Badge variant="secondary" className="text-xs">
                  {currentDraft.yearlyGoal.identityStatement}
                </Badge>
              )}
            </div>
          )}

          {/* Time estimate */}
          {timeEstimate && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Est. {timeEstimate.weeklyAverage}h/week</span>
              <span>{timeEstimate.totalHours}h total</span>
            </div>
          )}

          {/* Monthly Breakdown */}
          {currentDraft?.monthlyBreakdown && currentDraft.monthlyBreakdown.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <h4 className="font-medium text-sm">Monthly Milestones</h4>
                <Badge variant="outline" className="text-xs">
                  {currentDraft.monthlyBreakdown.length}
                </Badge>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {currentDraft.monthlyBreakdown.map((m, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0 w-16">
                        {m.month}
                      </span>
                      <span>{m.title}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Weekly Breakdown */}
          {currentDraft?.weeklyBreakdown && currentDraft.weeklyBreakdown.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <h4 className="font-medium text-sm">First Weeks</h4>
                <Badge variant="outline" className="text-xs">
                  {currentDraft.weeklyBreakdown.length}
                </Badge>
              </div>
              <ScrollArea className="h-24">
                <div className="space-y-2">
                  {currentDraft.weeklyBreakdown.slice(0, 4).map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0 w-20">
                        {w.week}
                      </span>
                      <span>{w.title}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Initial Tasks */}
          {currentDraft?.initialTasks && currentDraft.initialTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                <h4 className="font-medium text-sm">Initial Tasks</h4>
                <Badge variant="outline" className="text-xs">
                  {currentDraft.initialTasks.length}
                </Badge>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {currentDraft.initialTasks.map((t, i) => (
                    <div key={i} className="text-sm border-l-2 border-primary/20 pl-2">
                      <p>{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.scheduledDate} - {t.timePreference}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Validation errors */}
          {validationResult && !validationResult.valid && (
            <div className="text-sm text-destructive space-y-1">
              {validationResult.errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
            <Button
              onClick={handleCommit}
              disabled={!validationResult?.valid || isCommitting}
              className="flex-1"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </div>
        </div>
      )

      // Mobile: tabs
      if (isMobile) {
        return (
          <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as "chat" | "preview")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Refine
              </TabsTrigger>
              <TabsTrigger value="preview">
                <FileText className="mr-2 h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="h-[60vh]">
              {conversationPanel}
            </TabsContent>
            <TabsContent value="preview" className="h-[60vh] overflow-auto">
              {previewPanel}
            </TabsContent>
          </Tabs>
        )
      }

      // Desktop: two columns
      return (
        <div className="grid grid-cols-2 gap-6 h-[70vh]">
          <div className="border-r pr-6">{conversationPanel}</div>
          <ScrollArea className="h-full">{previewPanel}</ScrollArea>
        </div>
      )
    }

    return null
  }

  // Render error
  if (error) {
    return isMobile ? (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Plan with AI</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleReset}>Try Again</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    ) : (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Plan with AI</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleReset}>Try Again</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Main render
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Plan with AI
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">{renderContent()}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Plan with AI
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
