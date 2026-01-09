"use client"

import { useState, useCallback } from "react"
import { AppLayout } from "@/components/app-layout"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useInboxStore } from "@/stores/inbox"
import { useTasksStore } from "@/stores/tasks"
import type { LifeAspect, TimePreference, InboxItem, Task, TaskBreakdown, ParsedResult, SlotType } from "@/lib/types"
import { Inbox, Plus, ArrowRight, Trash2, CalendarIcon, Zap, Loader2, Sparkles, ChevronDown, ChevronRight } from "lucide-react"
import { formatDate } from "@/db"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { PrincipleTooltip } from "@/components/principle-tooltip"
import { ParsedPreview } from "@/components/inbox/parsed-preview"
import { OllamaStatusIndicator } from "@/components/inbox/ollama-status"
import { SlotClarificationDialog } from "@/components/inbox/slot-clarification-dialog"
import { DeepPromptFlow } from "@/components/inbox/deep-prompt-flow"
import { analyzeSlots } from "@/services/inbox-parser/slot-analyzer"
import { parseInboxItem } from "@/services/inbox-parser"
import { getQuestionsForAspect, inferDurationFromAnswers } from "@/services/inbox-parser/deep-prompts"
import { generateBreakdownFromAnswers } from "@/services/inbox-parser/breakdown-generator"

export default function InboxPage() {
  const [captureText, setCaptureText] = useState("")
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [showParsedPreview, setShowParsedPreview] = useState(false)
  const [lastCapturedItemId, setLastCapturedItemId] = useState<string | null>(null)

  // Deep prompt state
  const [showDeepPrompts, setShowDeepPrompts] = useState(false)
  const [pendingParsed, setPendingParsed] = useState<ParsedResult | null>(null)
  const [pendingText, setPendingText] = useState<string>("")

  // Recently processed collapse state
  const [showProcessed, setShowProcessed] = useState(false)

  // Process form state
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formAspect, setFormAspect] = useState<LifeAspect>("career")
  const [formTimePreference, setFormTimePreference] = useState<TimePreference>("morning")
  const [formDate, setFormDate] = useState<Date>(new Date())
  const [formTime, setFormTime] = useState("") // Specific time like "19:00"
  const [formDuration, setFormDuration] = useState("30")
  const [formLocation, setFormLocation] = useState("")

  // Store state
  const items = useInboxStore((state) => state.items)
  const isParsing = useInboxStore((state) => state.isParsing)
  const currentParsed = useInboxStore((state) => state.currentParsed)
  const isEnhancing = useInboxStore((state) => state.isEnhancing)
  const enhancingItemId = useInboxStore((state) => state.enhancingItemId)
  const addItemWithParse = useInboxStore((state) => state.addItemWithParse)
  const processItem = useInboxStore((state) => state.processItem)
  const deleteItem = useInboxStore((state) => state.deleteItem)
  const setCurrentParsed = useInboxStore((state) => state.setCurrentParsed)
  const addTask = useTasksStore((state) => state.addTask)

  // Clarification state
  const clarificationState = useInboxStore((state) => state.clarificationState)
  const isClarifying = useInboxStore((state) => state.isClarifying)
  const isGeneratingQuestions = useInboxStore((state) => state.isGeneratingQuestions)
  const startClarification = useInboxStore((state) => state.startClarification)
  const updateClarificationAnswer = useInboxStore((state) => state.updateClarificationAnswer)
  const submitClarifications = useInboxStore((state) => state.submitClarifications)
  const cancelClarification = useInboxStore((state) => state.cancelClarification)
  const skipClarification = useInboxStore((state) => state.skipClarification)

  const unprocessedItems = items.filter((item) => !item.processedAt)
  const processedItems = items.filter((item) => item.processedAt)

  const handleCapture = useCallback(async () => {
    if (!captureText.trim()) return

    const text = captureText.trim()
    setCaptureText("")

    // Parse the text first
    const parsed = await parseInboxItem(text)

    // Analyze slots to check for missing required fields
    const analysis = analyzeSlots(parsed)

    if (analysis.canProceed) {
      // All slots filled - check if we should show deep prompts
      const aspect = parsed.intent?.value
      const aspectConfidence = parsed.intent?.confidence || 0

      // Show deep prompts if aspect is detected with decent confidence
      if (aspect && aspectConfidence >= 0.5) {
        const questions = getQuestionsForAspect(aspect)
        if (questions.length > 0) {
          // Store parsed result and show deep prompts
          setPendingParsed(parsed)
          setPendingText(text)
          setShowDeepPrompts(true)
          return
        }
      }

      // No deep prompts needed - proceed with normal flow
      const { id } = await addItemWithParse(text)
      setLastCapturedItemId(id)

      // Show parsed preview for quick confirm
      if (parsed) {
        setShowParsedPreview(true)
      }
    } else {
      // Missing required slots - start clarification flow
      await startClarification(text, parsed)
    }
  }, [captureText, addItemWithParse, startClarification])

  // Handle clarification submission
  const handleClarificationSubmit = useCallback(async () => {
    const { parsed, canProceed } = await submitClarifications()

    if (canProceed && clarificationState) {
      // All slots now filled - create the item and show preview
      const { id } = await addItemWithParse(clarificationState.originalText)
      setLastCapturedItemId(id)

      // Update the item's parsed data with the merged result
      const item = items.find(i => i.id === id)
      if (item) {
        item.parsed = parsed
      }

      setCurrentParsed(parsed)
      setShowParsedPreview(true)
    }
  }, [submitClarifications, addItemWithParse, clarificationState, items, setCurrentParsed])

  // Handle skipping clarification
  const handleSkipClarification = useCallback(async () => {
    const { id, parsed } = await skipClarification()
    if (id) {
      setLastCapturedItemId(id)
      if (parsed) {
        setShowParsedPreview(true)
      }
    }
  }, [skipClarification])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleCapture()
    }
  }

  const handleQuickConfirm = async (taskData: Partial<Task>, breakdown?: TaskBreakdown) => {
    if (!lastCapturedItemId) return

    // Create task with breakdown
    const taskId = await addTask({
      title: taskData.title || "Untitled Task",
      aspect: taskData.aspect || "chores",
      scheduledDate: taskData.scheduledDate || formatDate(new Date()),
      timePreference: taskData.timePreference || "anytime",
      hardScheduledTime: taskData.hardScheduledTime, // Include specific time
      status: "pending",
      deferCount: 0,
      description: taskData.description,
      durationEstimate: taskData.durationEstimate,
      location: taskData.location,
      weeklyGoalId: taskData.weeklyGoalId, // Include goal link
      who: taskData.who || "solo", // WHO - defaults to solo
      whoType: taskData.whoType || "solo", // WHO type
      breakdown,
    })

    // Mark inbox item as processed
    await processItem(lastCapturedItemId, "task", taskId)

    // Reset state
    setShowParsedPreview(false)
    setCurrentParsed(null)
    setLastCapturedItemId(null)
  }

  const handleDismissPreview = () => {
    setShowParsedPreview(false)
    setCurrentParsed(null)
    // Keep the item in inbox for manual processing
  }

  const handleEditFromPreview = () => {
    // Open the full form with pre-filled values
    const item = items.find((i) => i.id === lastCapturedItemId)
    if (item) {
      openProcessDialog(item)
    }
    setShowParsedPreview(false)
  }

  // Handle deep prompt completion - generate personalized breakdown
  const handleDeepPromptComplete = useCallback(async (answers: Record<string, string>) => {
    if (!pendingParsed || !pendingText) return

    const aspect = pendingParsed.intent?.value
    if (!aspect) {
      // Fallback to normal flow
      setShowDeepPrompts(false)
      const { id } = await addItemWithParse(pendingText)
      setLastCapturedItemId(id)
      setShowParsedPreview(true)
      setPendingParsed(null)
      setPendingText("")
      return
    }

    // Infer duration from answers if not explicitly set
    const inferredDuration = inferDurationFromAnswers(aspect, answers)

    // Generate personalized breakdown from answers
    const breakdown = generateBreakdownFromAnswers(aspect, answers, {
      time: pendingParsed.when?.time?.value,
      location: pendingParsed.where?.value,
      timePreference: pendingParsed.when?.timePreference?.value,
      totalDuration: pendingParsed.duration?.value || inferredDuration,
    })

    // Update parsed result with new breakdown and duration
    const enhancedParsed: ParsedResult = {
      ...pendingParsed,
      suggestedBreakdown: breakdown,
      suggestedTask: {
        ...pendingParsed.suggestedTask,
        durationEstimate: pendingParsed.duration?.value || inferredDuration,
      },
      duration: {
        value: pendingParsed.duration?.value || inferredDuration,
        confidence: pendingParsed.duration?.confidence || 0.8,
        source: "rule",
        rawMatch: pendingParsed.duration?.rawMatch || `${inferredDuration} min`,
      },
    }

    // Add to inbox with enhanced parsed data
    const { id } = await addItemWithParse(pendingText)
    setLastCapturedItemId(id)
    setCurrentParsed(enhancedParsed)

    // Hide deep prompts, show preview
    setShowDeepPrompts(false)
    setShowParsedPreview(true)
    setPendingParsed(null)
    setPendingText("")
  }, [pendingParsed, pendingText, addItemWithParse, setCurrentParsed])

  // Handle deep prompt skip - use default breakdown
  const handleDeepPromptSkip = useCallback(async () => {
    if (!pendingParsed || !pendingText) {
      setShowDeepPrompts(false)
      return
    }

    // Proceed with normal flow without personalized breakdown
    const { id } = await addItemWithParse(pendingText)
    setLastCapturedItemId(id)
    setCurrentParsed(pendingParsed)

    setShowDeepPrompts(false)
    setShowParsedPreview(true)
    setPendingParsed(null)
    setPendingText("")
  }, [pendingParsed, pendingText, addItemWithParse, setCurrentParsed])

  const openProcessDialog = (item: InboxItem) => {
    setSelectedItem(item)

    // Pre-fill form with parsed data if available
    if (item.parsed?.suggestedTask) {
      const suggested = item.parsed.suggestedTask
      setFormTitle(suggested.title || item.content)
      setFormAspect(suggested.aspect || "career")
      setFormTimePreference(suggested.timePreference || "morning")
      setFormDate(suggested.scheduledDate ? new Date(suggested.scheduledDate) : new Date())
      setFormTime(suggested.hardScheduledTime || "") // Specific time
      setFormDuration(String(suggested.durationEstimate || 30))
      setFormLocation(suggested.location || "")
    } else {
      setFormTitle(item.content)
      setFormAspect("career")
      setFormTimePreference("morning")
      setFormDate(new Date())
      setFormTime("")
      setFormDuration("30")
      setFormLocation("")
    }

    setFormDescription("")
    setProcessDialogOpen(true)
  }

  const handleProcessToTask = async () => {
    if (!selectedItem) return

    // Create task with location and specific time
    const taskId = await addTask({
      title: formTitle,
      description: formDescription || undefined,
      aspect: formAspect,
      timePreference: formTimePreference,
      hardScheduledTime: formTime || undefined, // Specific time like "19:00"
      scheduledDate: formatDate(formDate),
      durationEstimate: parseInt(formDuration) || 30,
      location: formLocation || undefined,
      status: "pending",
      deferCount: 0,
      breakdown: selectedItem.parsed?.suggestedBreakdown,
    })

    // Mark inbox item as processed
    await processItem(selectedItem.id, "task", taskId)

    setProcessDialogOpen(false)
    setSelectedItem(null)
  }

  const handleDelete = async (id: string) => {
    await deleteItem(id)
  }

  const handleDiscardItem = async () => {
    if (!selectedItem) return
    await processItem(selectedItem.id, "trash")
    setProcessDialogOpen(false)
    setSelectedItem(null)
  }

  // Get the last captured item for preview
  const lastCapturedItem = items.find((i) => i.id === lastCapturedItemId)

  return (
    <AppLayout>
      <div className="container max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
            <p className="text-muted-foreground">
              <PrincipleTooltip principle="start-small">
                Capture thoughts quickly, process them later
              </PrincipleTooltip>
            </p>
          </div>
          <OllamaStatusIndicator variant="badge" />
        </div>

        {/* Quick Capture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              Quick Capture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="training today at 7pm bunker kota damansara..."
                className="flex-1"
                disabled={isParsing}
              />
              <Button onClick={handleCapture} disabled={!captureText.trim() || isParsing}>
                {isParsing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Capture
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Try natural language: "meeting tomorrow morning at office" or "cook dinner tonight"
            </p>

            {/* Deep Prompt Flow - shows when aspect is detected */}
            {showDeepPrompts && pendingParsed?.intent?.value && (
              <DeepPromptFlow
                aspect={pendingParsed.intent.value}
                questions={getQuestionsForAspect(pendingParsed.intent.value)}
                onComplete={handleDeepPromptComplete}
                onSkip={handleDeepPromptSkip}
                className="mt-4"
              />
            )}

            {/* Parsed Preview - shows after capture (or after deep prompts) */}
            {showParsedPreview && currentParsed && lastCapturedItem && (
              <ParsedPreview
                parsed={currentParsed}
                originalText={lastCapturedItem.content}
                isEnhancing={isEnhancing && enhancingItemId === lastCapturedItemId}
                onConfirm={handleQuickConfirm}
                onEdit={handleEditFromPreview}
                onDismiss={handleDismissPreview}
                className="mt-4"
              />
            )}
          </CardContent>
        </Card>

        {/* Unprocessed Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              To Process
              {unprocessedItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unprocessedItems.length}
                </Badge>
              )}
            </h2>
          </div>

          {unprocessedItems.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Inbox Zero"
              description="All caught up! Capture new thoughts above."
            />
          ) : (
            <div className="space-y-2">
              {unprocessedItems.map((item) => (
                <Card key={item.id} className="group">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.content}</p>
                        {item.parsed?.parsingMethod === "hybrid" && (
                          <span title="AI enhanced">
                            <Sparkles className="h-3 w-3 text-purple-500" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.capturedAt), "PPp")}
                        </p>
                        {item.parsed && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              item.parsed.confidenceLevel === "high" && "border-green-500/50 text-green-700 dark:text-green-400",
                              item.parsed.confidenceLevel === "medium" && "border-yellow-500/50 text-yellow-700 dark:text-yellow-400",
                              item.parsed.confidenceLevel === "low" && "border-red-500/50 text-red-700 dark:text-red-400"
                            )}
                          >
                            {item.parsed.confidenceLevel} confidence
                          </Badge>
                        )}
                        {item.parsed?.intent?.value && (
                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                            style={{
                              backgroundColor: `${ASPECT_CONFIG[item.parsed.intent.value]?.color}20`,
                              color: ASPECT_CONFIG[item.parsed.intent.value]?.color,
                            }}
                          >
                            {ASPECT_CONFIG[item.parsed.intent.value]?.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openProcessDialog(item)}
                      >
                        <ArrowRight className="mr-1 h-4 w-4" />
                        Process
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recently Processed - Collapsible */}
        {processedItems.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowProcessed(!showProcessed)}
              className="flex w-full items-center gap-2 text-left text-muted-foreground hover:text-foreground transition-colors"
            >
              {showProcessed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                Recently Processed ({processedItems.length})
              </span>
            </button>
            {showProcessed && (
              <div className="space-y-2 pl-6">
                {processedItems.slice(0, 5).map((item) => (
                  <Card key={item.id} className="opacity-50">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <p className="text-sm line-through">{item.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.convertedToTaskId && "Converted to task"}
                          {item.trashedAt && "Discarded"}
                          {item.convertedToGoalId && "Converted to goal"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Process Dialog */}
        <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Process Inbox Item</DialogTitle>
              <DialogDescription>
                Convert this thought into an actionable task.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm italic text-muted-foreground">
                  "{selectedItem?.content}"
                </p>
                {selectedItem?.parsed && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        selectedItem.parsed.confidenceLevel === "high" && "border-green-500/50 text-green-700",
                        selectedItem.parsed.confidenceLevel === "medium" && "border-yellow-500/50 text-yellow-700",
                        selectedItem.parsed.confidenceLevel === "low" && "border-red-500/50 text-red-700"
                      )}
                    >
                      {Math.round(selectedItem.parsed.overallConfidence * 100)}% parsed
                    </Badge>
                    {selectedItem.parsed.parsingMethod === "hybrid" && (
                      <span className="flex items-center gap-1 text-xs text-purple-600">
                        <Sparkles className="h-3 w-3" />
                        AI enhanced
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="What's the next action?"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Additional context..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aspect</Label>
                  <Select value={formAspect} onValueChange={(v) => setFormAspect(v as LifeAspect)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ASPECT_CONFIG).map(([aspect, config]) => (
                        <SelectItem key={aspect} value={aspect}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Preference</Label>
                  <Select value={formTimePreference} onValueChange={(v) => setFormTimePreference(v as TimePreference)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="anytime">Anytime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Specific Time (optional)</Label>
                  <Input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="19:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formDate}
                        onSelect={(date) => {
                          if (date) {
                            setFormDate(date)
                            setDatePickerOpen(false)
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location (optional)</Label>
                <Input
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Where will this happen?"
                />
              </div>

              {/* Task Breakdown Preview */}
              {selectedItem?.parsed?.suggestedBreakdown && selectedItem.parsed.suggestedBreakdown.steps.length > 0 && (
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Task Breakdown
                  </p>
                  <div className="space-y-1">
                    {selectedItem.parsed.suggestedBreakdown.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="flex-1">{step.title}</span>
                        {step.duration && (
                          <span className="text-xs text-muted-foreground">{step.duration}min</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedItem.parsed.suggestedBreakdown.completionCriteria}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="ghost" onClick={handleDiscardItem} className="text-muted-foreground">
                Discard
              </Button>
              <div className="flex-1" />
              <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleProcessToTask} disabled={!formTitle}>
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Slot Clarification Dialog */}
        <SlotClarificationDialog
          open={isClarifying}
          state={clarificationState}
          isGenerating={isGeneratingQuestions}
          onAnswerChange={updateClarificationAnswer}
          onSubmit={handleClarificationSubmit}
          onCancel={cancelClarification}
          onSkip={handleSkipClarification}
        />
      </div>
    </AppLayout>
  )
}
