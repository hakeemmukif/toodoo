"use client"

import { useState } from "react"
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
import { Inbox, Plus, ArrowRight, Trash2, CalendarIcon, Zap } from "lucide-react"
import { formatDate } from "@/db"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { PrincipleTooltip } from "@/components/principle-tooltip"

export default function InboxPage() {
  const [captureText, setCaptureText] = useState("")
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Process form state
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formAspect, setFormAspect] = useState<LifeAspect>("career")
  const [formTimePreference, setFormTimePreference] = useState<TimePreference>("morning")
  const [formDate, setFormDate] = useState<Date>(new Date())
  const [formDuration, setFormDuration] = useState("30")

  const items = useInboxStore((state) => state.items)
  const addItem = useInboxStore((state) => state.addItem)
  const processItem = useInboxStore((state) => state.processItem)
  const deleteItem = useInboxStore((state) => state.deleteItem)
  const addTask = useTasksStore((state) => state.addTask)

  const unprocessedItems = items.filter((item) => !item.processedAt)
  const processedItems = items.filter((item) => item.processedAt)

  const handleCapture = async () => {
    if (!captureText.trim()) return
    await addItem(captureText.trim())
    setCaptureText("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleCapture()
    }
  }

  const openProcessDialog = (item: InboxItem) => {
    setSelectedItem(item)
    setFormTitle(item.content)
    setFormDescription("")
    setFormAspect("career")
    setFormTimePreference("morning")
    setFormDate(new Date())
    setFormDuration("30")
    setProcessDialogOpen(true)
  }

  const handleProcessToTask = async () => {
    if (!selectedItem) return

    // Create task
    const taskId = await addTask({
      title: formTitle,
      description: formDescription || undefined,
      aspect: formAspect,
      timePreference: formTimePreference,
      scheduledDate: formatDate(formDate),
      durationEstimate: parseInt(formDuration) || 30,
      status: "pending",
      deferCount: 0,
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
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              Quick Capture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's on your mind? Press Enter to capture..."
                className="flex-1"
              />
              <Button onClick={handleCapture} disabled={!captureText.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Capture
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Don't overthink it - just get it out of your head.
            </p>
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
                      <p className="font-medium">{item.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.capturedAt), "PPp")}
                      </p>
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

        {/* Recently Processed */}
        {processedItems.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-muted-foreground">
              Recently Processed
            </h2>
            <div className="space-y-2">
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
          </div>
        )}

        {/* Process Dialog */}
        <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
          <DialogContent>
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
