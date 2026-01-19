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
import type { LifeAspect, TimePreference, InboxItem } from "@/lib/types"
import { Inbox, Plus, ArrowRight, Trash2, CalendarIcon, Zap, Loader2, Sparkles, ChevronDown, ChevronRight, CheckCircle2, Archive } from "lucide-react"
import { formatDate } from "@/db"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { PrincipleTooltip } from "@/components/principle-tooltip"
import { OllamaStatusIndicator } from "@/components/inbox/ollama-status"

export default function InboxPage() {
  const [captureText, setCaptureText] = useState("")
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

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
  const addItemWithParse = useInboxStore((state) => state.addItemWithParse)
  const processItem = useInboxStore((state) => state.processItem)
  const deleteItem = useInboxStore((state) => state.deleteItem)
  const addTask = useTasksStore((state) => state.addTask)

  const unprocessedItems = items.filter((item) => !item.processedAt)
  const processedItems = items.filter((item) => item.processedAt)

  // GTD-style capture: just parse and add to inbox list
  // Processing (deep prompts, preview, task creation) happens when user clicks "Process"
  const handleCapture = useCallback(async () => {
    if (!captureText.trim()) return
    const text = captureText.trim()
    setCaptureText("")

    // Parse and add to inbox - item stays as unprocessed for later processing
    await addItemWithParse(text)
  }, [captureText, addItemWithParse])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleCapture()
    }
  }

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

  return (
    <AppLayout>
      <div className="container max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground">
            <PrincipleTooltip principle="start-small">
              Capture thoughts quickly, process them later
            </PrincipleTooltip>
          </p>
        </div>

        {/* Quick Capture */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4" />
                Quick Capture
              </CardTitle>
              <OllamaStatusIndicator variant="badge" />
            </div>
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
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <Inbox className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{unprocessedItems.length}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{processedItems.length}</div>
                  <div className="text-xs text-muted-foreground">Processed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{items.length}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Unprocessed Items */}
        {unprocessedItems.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Inbox Zero"
            description="All caught up! Capture new thoughts above."
          />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>To Process</CardTitle>
                <Badge variant="secondary">
                  {unprocessedItems.length} item{unprocessedItems.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {unprocessedItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Inbox className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.content}</span>
                        {item.parsed?.parsingMethod === "hybrid" && (
                          <Sparkles className="h-3 w-3 shrink-0 text-purple-500" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(item.capturedAt), "MMM d, h:mm a")}
                        </span>
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
                            {item.parsed.confidenceLevel}
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
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recently Processed - Collapsible */}
        {processedItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <button
                onClick={() => setShowProcessed(!showProcessed)}
                className="flex w-full items-center justify-between text-left"
              >
                <CardTitle className="text-base">Recently Processed</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {processedItems.length}
                  </Badge>
                  {showProcessed ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>
            </CardHeader>
            {showProcessed && (
              <CardContent className="space-y-2 pt-0">
                {processedItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                      {item.convertedToTaskId ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : item.trashedAt ? (
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Archive className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground line-through truncate">
                        {item.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.convertedToTaskId && "Converted to task"}
                        {item.trashedAt && "Discarded"}
                        {item.convertedToGoalId && "Converted to goal"}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
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
                      <Sparkles className="h-3 w-3 text-purple-500" />
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
      </div>
    </AppLayout>
  )
}
