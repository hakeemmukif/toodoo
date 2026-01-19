"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { TaskItem } from "@/components/task-item"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useTasksStore } from "@/stores/tasks"
import type { LifeAspect, TaskStatus, TimePreference } from "@/lib/types"
import { ListTodo, Plus, Filter, CalendarIcon } from "lucide-react"
import { formatDate } from "@/db"
import { format } from "date-fns"
import { QuickAddInput } from "@/components/tasks/quick-add-input"

export default function TasksPage() {
  const [selectedAspect, setSelectedAspect] = useState<LifeAspect | "all">("all")
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "all">("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formAspect, setFormAspect] = useState<LifeAspect>("fitness")
  const [formTimePreference, setFormTimePreference] = useState<TimePreference>("morning")
  const [formDate, setFormDate] = useState<Date>(new Date())
  const [formDuration, setFormDuration] = useState("30")
  const [formMinimumVersion, setFormMinimumVersion] = useState("")

  const tasks = useTasksStore((state) => state.tasks)
  const addTask = useTasksStore((state) => state.addTask)

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (selectedAspect !== "all" && task.aspect !== selectedAspect) return false
    if (selectedStatus !== "all" && task.status !== selectedStatus) return false
    return true
  })

  // Group tasks by date
  const tasksByDate = filteredTasks.reduce(
    (acc, task) => {
      if (!acc[task.scheduledDate]) acc[task.scheduledDate] = []
      acc[task.scheduledDate].push(task)
      return acc
    },
    {} as Record<string, typeof filteredTasks>,
  )

  const sortedDates = Object.keys(tasksByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const handleAddTask = async () => {
    await addTask({
      title: formTitle,
      description: formDescription || undefined,
      aspect: formAspect,
      timePreference: formTimePreference,
      scheduledDate: formatDate(formDate),
      durationEstimate: parseInt(formDuration) || 30,
      minimumVersion: formMinimumVersion || undefined,
      status: "pending",
      deferCount: 0,
    })

    // Reset form
    setFormTitle("")
    setFormDescription("")
    setFormDuration("30")
    setFormMinimumVersion("")
    setDialogOpen(false)
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">Manage your daily tasks and routines</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogDescription>Create a new task to add to your schedule.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="What needs to be done?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Additional details..."
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
                <Button onClick={handleAddTask} disabled={!formTitle}>
                  Add Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Add */}
        <QuickAddInput />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium">Aspect</label>
                <Select value={selectedAspect} onValueChange={(v) => setSelectedAspect(v as LifeAspect | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Aspects</SelectItem>
                    {Object.entries(ASPECT_CONFIG).map(([aspect, config]) => (
                      <SelectItem key={aspect} value={aspect}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as TaskStatus | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                    <SelectItem value="deferred">Deferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks found"
            description="Try adjusting your filters or create a new task"
            actionLabel="Add Task"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              const dateTasks = tasksByDate[date]
              const dateObj = new Date(date)
              const dateLabel = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

              return (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle className="text-base">{dateLabel}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dateTasks.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
