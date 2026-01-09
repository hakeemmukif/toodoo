"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { AspectBadge } from "@/components/aspect-badge"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useTasksStore } from "@/stores/tasks"
import { useGoalsStore } from "@/stores/goals"
import { formatDate } from "@/db"
import type { LifeAspect, TimePreference, RecurrenceFrequency, RecurrenceTemplate } from "@/lib/types"
import { Repeat, Plus, Pencil, Trash2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
]

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string; description: string }[] = [
  { value: "daily", label: "Daily", description: "Every day" },
  { value: "weekly", label: "Weekly", description: "Specific days each week" },
  { value: "biweekly", label: "Biweekly", description: "Every other week" },
  { value: "monthly", label: "Monthly", description: "Once a month" },
]

export default function RecurringPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<RecurrenceTemplate | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<RecurrenceTemplate | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formAspect, setFormAspect] = useState<LifeAspect>("fitness")
  const [formFrequency, setFormFrequency] = useState<RecurrenceFrequency>("weekly")
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([1, 3, 5]) // Mon, Wed, Fri
  const [formDayOfMonth, setFormDayOfMonth] = useState("1")
  const [formTimePreference, setFormTimePreference] = useState<TimePreference>("morning")
  const [formHardScheduledTime, setFormHardScheduledTime] = useState("")
  const [formDuration, setFormDuration] = useState("30")
  const [formMinimumVersion, setFormMinimumVersion] = useState("")
  const [formLinkedGoalId, setFormLinkedGoalId] = useState<string>("")

  const recurrenceTemplates = useTasksStore((state) => state.recurrenceTemplates)
  const addRecurrenceTemplate = useTasksStore((state) => state.addRecurrenceTemplate)
  const updateRecurrenceTemplate = useTasksStore((state) => state.updateRecurrenceTemplate)
  const deleteRecurrenceTemplate = useTasksStore((state) => state.deleteRecurrenceTemplate)
  const generateRecurringTasks = useTasksStore((state) => state.generateRecurringTasks)

  const yearlyGoals = useGoalsStore((state) => state.yearlyGoals)
  const activeGoals = yearlyGoals.filter((g) => g.status === "active")

  const { toast } = useToast()

  // Reset form
  const resetForm = () => {
    setFormTitle("")
    setFormAspect("fitness")
    setFormFrequency("weekly")
    setFormDaysOfWeek([1, 3, 5])
    setFormDayOfMonth("1")
    setFormTimePreference("morning")
    setFormHardScheduledTime("")
    setFormDuration("30")
    setFormMinimumVersion("")
    setFormLinkedGoalId("")
    setEditingTemplate(null)
  }

  // Open dialog for adding new template
  const handleAddClick = () => {
    resetForm()
    setDialogOpen(true)
  }

  // Open dialog for editing template
  const handleEditClick = (template: RecurrenceTemplate) => {
    setEditingTemplate(template)
    setFormTitle(template.title)
    setFormAspect(template.aspect)
    setFormFrequency(template.frequency)
    setFormDaysOfWeek(template.daysOfWeek || [1, 3, 5])
    setFormDayOfMonth(String(template.dayOfMonth || 1))
    setFormTimePreference(template.timePreference)
    setFormHardScheduledTime(template.hardScheduledTime || "")
    setFormDuration(String(template.durationEstimate || 30))
    setFormMinimumVersion(template.minimumVersion || "")
    setFormLinkedGoalId(template.linkedGoalId || "")
    setDialogOpen(true)
  }

  // Handle save (add or update)
  const handleSave = async () => {
    if (!formTitle.trim()) return

    const templateData = {
      title: formTitle.trim(),
      aspect: formAspect,
      frequency: formFrequency,
      daysOfWeek: formFrequency === "weekly" || formFrequency === "biweekly" ? formDaysOfWeek : undefined,
      dayOfMonth: formFrequency === "monthly" ? parseInt(formDayOfMonth) || 1 : undefined,
      biweeklyStartDate: formFrequency === "biweekly" ? formatDate(new Date()) : undefined,
      timePreference: formTimePreference,
      hardScheduledTime: formHardScheduledTime || undefined,
      durationEstimate: parseInt(formDuration) || 30,
      minimumVersion: formMinimumVersion || undefined,
      linkedGoalId: formLinkedGoalId || undefined,
      isActive: true,
    }

    if (editingTemplate) {
      await updateRecurrenceTemplate(editingTemplate.id, templateData)
      toast({ title: "Template updated", description: `"${formTitle}" has been updated` })
    } else {
      await addRecurrenceTemplate(templateData)
      // Generate tasks immediately for new templates
      await generateRecurringTasks()
      toast({ title: "Template created", description: `"${formTitle}" will now generate tasks` })
    }

    setDialogOpen(false)
    resetForm()
  }

  // Handle toggle active
  const handleToggleActive = async (template: RecurrenceTemplate) => {
    await updateRecurrenceTemplate(template.id, { isActive: !template.isActive })
    if (!template.isActive) {
      // Reactivating - generate tasks
      await generateRecurringTasks()
    }
  }

  // Handle delete
  const handleDeleteClick = (template: RecurrenceTemplate) => {
    setTemplateToDelete(template)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (templateToDelete) {
      await deleteRecurrenceTemplate(templateToDelete.id)
      toast({ title: "Template deleted", description: `"${templateToDelete.title}" has been removed` })
    }
    setDeleteDialogOpen(false)
    setTemplateToDelete(null)
  }

  // Toggle day of week
  const toggleDayOfWeek = (day: number) => {
    setFormDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  // Calculate next occurrences for preview
  const getNextOccurrences = (template: RecurrenceTemplate, count: number = 3): string[] => {
    const dates: string[] = []
    const today = new Date()
    const current = new Date(today)
    let daysChecked = 0
    const maxDays = 60 // Check up to 60 days ahead

    while (dates.length < count && daysChecked < maxDays) {
      const dayOfWeek = current.getDay()
      const dayOfMonth = current.getDate()
      let shouldInclude = false

      switch (template.frequency) {
        case "daily":
          shouldInclude = true
          break
        case "weekly":
          shouldInclude = template.daysOfWeek?.includes(dayOfWeek) ?? false
          break
        case "biweekly":
          const anchor = template.biweeklyStartDate
            ? new Date(template.biweeklyStartDate)
            : new Date(template.createdAt)
          const daysSinceAnchor = Math.floor((current.getTime() - anchor.getTime()) / (24 * 60 * 60 * 1000))
          const weeksSinceAnchor = Math.floor(daysSinceAnchor / 7)
          shouldInclude = weeksSinceAnchor % 2 === 0 && (template.daysOfWeek?.includes(dayOfWeek) ?? false)
          break
        case "monthly":
          const targetDay = template.dayOfMonth ?? 1
          const lastDayOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
          const effectiveDay = Math.min(targetDay, lastDayOfMonth)
          shouldInclude = dayOfMonth === effectiveDay
          break
      }

      if (shouldInclude && current >= today) {
        dates.push(formatDate(current))
      }

      current.setDate(current.getDate() + 1)
      daysChecked++
    }

    return dates
  }

  // Format days of week for display
  const formatDaysOfWeek = (days?: number[]): string => {
    if (!days || days.length === 0) return ""
    if (days.length === 7) return "Every day"
    return days.map((d) => DAYS_OF_WEEK[d].label).join(", ")
  }

  // Group templates by aspect
  const templatesByAspect = recurrenceTemplates.reduce(
    (acc, template) => {
      if (!acc[template.aspect]) acc[template.aspect] = []
      acc[template.aspect].push(template)
      return acc
    },
    {} as Record<LifeAspect, RecurrenceTemplate[]>
  )

  return (
    <AppLayout>
      <div className="container max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recurring Tasks</h1>
            <p className="text-muted-foreground">Automate your regular routines</p>
          </div>
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add Template
          </Button>
        </div>

        {/* Templates List */}
        {recurrenceTemplates.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No recurring tasks"
            description="Create templates for tasks that happen regularly"
            actionLabel="Add Template"
            onAction={handleAddClick}
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(templatesByAspect).map(([aspect, templates]) => (
              <Card key={aspect}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AspectBadge aspect={aspect as LifeAspect} />
                    {ASPECT_CONFIG[aspect as LifeAspect].label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {templates.map((template) => {
                    const nextOccurrences = getNextOccurrences(template)
                    return (
                      <div
                        key={template.id}
                        className={`group flex items-start justify-between rounded-lg border p-4 transition-opacity ${
                          !template.isActive ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{template.title}</h4>
                            {!template.isActive && (
                              <span className="text-xs text-muted-foreground">(Paused)</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {template.frequency === "daily" && "Every day"}
                            {template.frequency === "weekly" && `Weekly: ${formatDaysOfWeek(template.daysOfWeek)}`}
                            {template.frequency === "biweekly" && `Biweekly: ${formatDaysOfWeek(template.daysOfWeek)}`}
                            {template.frequency === "monthly" && `Monthly on day ${template.dayOfMonth || 1}`}
                            {" - "}
                            {template.hardScheduledTime || template.timePreference}
                            {template.durationEstimate && ` - ${template.durationEstimate}m`}
                          </div>
                          {template.isActive && nextOccurrences.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Next: {nextOccurrences.slice(0, 3).map((d) => {
                                const date = new Date(d)
                                return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                              }).join(", ")}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.isActive}
                            onCheckedChange={() => handleToggleActive(template)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => handleEditClick(template)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => handleDeleteClick(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "New Recurring Task"}</DialogTitle>
              <DialogDescription>
                {editingTemplate
                  ? "Update the schedule for this recurring task"
                  : "Create a template that generates tasks automatically"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Morning workout"
                  autoFocus
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
                      {Object.entries(ASPECT_CONFIG).map(([aspect, config]) => {
                        const Icon = config.icon
                        return (
                          <SelectItem key={aspect} value={aspect}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" style={{ color: config.color }} />
                              {config.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={formFrequency} onValueChange={(v) => setFormFrequency(v as RecurrenceFrequency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Days of Week (for weekly/biweekly) */}
              {(formFrequency === "weekly" || formFrequency === "biweekly") && (
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDayOfWeek(day.value)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                          formDaysOfWeek.includes(day.value)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {day.label.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day of Month (for monthly) */}
              {formFrequency === "monthly" && (
                <div className="space-y-2">
                  <Label>Day of Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formDayOfMonth}
                    onChange={(e) => setFormDayOfMonth(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    If the month has fewer days, it will use the last day
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label>Specific Time (optional)</Label>
                  <Input
                    type="time"
                    value={formHardScheduledTime}
                    onChange={(e) => setFormHardScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link to Goal (optional)</Label>
                  <Select value={formLinkedGoalId} onValueChange={setFormLinkedGoalId}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {activeGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          <div className="flex items-center gap-2">
                            <AspectBadge aspect={goal.aspect} />
                            <span className="truncate">{goal.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fallback Version (optional)</Label>
                <Input
                  value={formMinimumVersion}
                  onChange={(e) => setFormMinimumVersion(e.target.value)}
                  placeholder="If I can't do the full task, I'll at least..."
                />
                <p className="text-xs text-muted-foreground">
                  The smallest version of this task that still counts
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!formTitle.trim()}>
                {editingTemplate ? "Save Changes" : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template?</AlertDialogTitle>
              <AlertDialogDescription>
                This will stop generating new tasks from "{templateToDelete?.title}". Existing tasks will not be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}
