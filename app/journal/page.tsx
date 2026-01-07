"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { AspectBadge } from "@/components/aspect-badge"
import { SentimentDot } from "@/components/sentiment-dot"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useJournalStore } from "@/stores/journal"
import { useAppStore } from "@/stores/app"
import { getSentimentLabel } from "@/services/analysis"
import { getRandomPrompt, getPromptsForSelection, getCategoryDisplayName } from "@/services/prompts"
import type { JournalPrompt, PromptCategory } from "@/lib/types"
import { BookOpen, Plus, Search, Sparkles, Lightbulb, RefreshCw, Battery, Moon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const ENERGY_LEVELS = [
  { value: 1, label: "Very Low" },
  { value: 2, label: "Low" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "Good" },
  { value: 5, label: "Great" },
]

const SLEEP_QUALITY = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Fair" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Excellent" },
]

export default function JournalPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formContent, setFormContent] = useState("")
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)

  // Energy and sleep tracking
  const [energyLevel, setEnergyLevel] = useState<string>("")
  const [sleepQuality, setSleepQuality] = useState<string>("")
  const [sleepHours, setSleepHours] = useState("")

  // Prompt state
  const [currentPrompt, setCurrentPrompt] = useState<JournalPrompt | null>(null)
  const [showPromptPicker, setShowPromptPicker] = useState(false)

  const entries = useJournalStore((state) => state.entries)
  const addEntry = useJournalStore((state) => state.addEntry)
  const analyzeWithLLM = useJournalStore((state) => state.analyzeWithLLM)
  const settings = useAppStore((state) => state.settings)

  const { toast } = useToast()

  // Get a random prompt when dialog opens
  useEffect(() => {
    if (dialogOpen && settings?.journalPromptMode === "rotating") {
      const recentIds = entries.slice(0, 5).map((e) => e.promptUsed).filter(Boolean) as string[]
      const prompt = getRandomPrompt(
        settings?.preferredPromptCategories || [],
        recentIds,
        "daily"
      )
      setCurrentPrompt(prompt)
    }
  }, [dialogOpen, settings, entries])

  const handleRefreshPrompt = () => {
    const recentIds = entries.slice(0, 5).map((e) => e.promptUsed).filter(Boolean) as string[]
    const prompt = getRandomPrompt(
      settings?.preferredPromptCategories || [],
      recentIds,
      "daily"
    )
    setCurrentPrompt(prompt)
  }

  const filteredEntries = entries.filter(
    (entry) =>
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.detectedAspects.some((a) => a.includes(searchQuery.toLowerCase())),
  )

  const handleAddEntry = async () => {
    if (!formContent.trim()) return

    await addEntry({
      content: formContent,
      promptUsed: currentPrompt?.id,
      promptCategory: currentPrompt?.category,
      energyLevel: energyLevel ? parseInt(energyLevel) : undefined,
      sleepQuality: sleepQuality ? parseInt(sleepQuality) : undefined,
      sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
    })

    // Reset form
    setFormContent("")
    setEnergyLevel("")
    setSleepQuality("")
    setSleepHours("")
    setCurrentPrompt(null)
    setDialogOpen(false)

    toast({
      title: "Journal entry saved",
      description: "Your entry has been analyzed and saved.",
    })
  }

  const handleAnalyze = async (id: string) => {
    await analyzeWithLLM(id)
    toast({
      title: "Analysis complete",
      description: "AI analysis has been added to the entry.",
    })
  }

  const selectedEntry = selectedEntryId ? entries.find((e) => e.id === selectedEntryId) : null

  // Get prompts for picker
  const availablePrompts = getPromptsForSelection(
    settings?.preferredPromptCategories || [],
    "daily"
  )

  return (
    <AppLayout>
      <div className="container max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
            <p className="text-muted-foreground">Reflect on your daily progress and insights</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>New Journal Entry</DialogTitle>
                <DialogDescription>
                  Write about your day, thoughts, and progress. Aspects and sentiment will be detected automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Energy and Sleep Tracking */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Battery className="h-3.5 w-3.5" />
                      Energy
                    </Label>
                    <Select value={energyLevel} onValueChange={setEnergyLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="How's your energy?" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENERGY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value.toString()}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Moon className="h-3.5 w-3.5" />
                      Sleep Quality
                    </Label>
                    <Select value={sleepQuality} onValueChange={setSleepQuality}>
                      <SelectTrigger>
                        <SelectValue placeholder="How'd you sleep?" />
                      </SelectTrigger>
                      <SelectContent>
                        {SLEEP_QUALITY.map((quality) => (
                          <SelectItem key={quality.value} value={quality.value.toString()}>
                            {quality.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hours Slept</Label>
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      placeholder="~7"
                    />
                  </div>
                </div>

                {/* Journal Prompt */}
                {settings?.journalPromptMode !== "none" && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Today's Prompt
                      </div>
                      <div className="flex items-center gap-1">
                        {settings?.journalPromptMode === "pick" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setShowPromptPicker(!showPromptPicker)}
                          >
                            Pick different
                          </Button>
                        )}
                        {settings?.journalPromptMode === "rotating" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleRefreshPrompt}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {currentPrompt ? (
                      <p className="text-sm italic text-muted-foreground">
                        "{currentPrompt.prompt}"
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click refresh for a prompt, or just write freely.
                      </p>
                    )}

                    {/* Prompt Picker */}
                    {showPromptPicker && (
                      <div className="mt-3 max-h-40 space-y-1 overflow-y-auto border-t pt-3">
                        {availablePrompts.map((prompt) => (
                          <button
                            key={prompt.id}
                            className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                            onClick={() => {
                              setCurrentPrompt(prompt)
                              setShowPromptPicker(false)
                            }}
                          >
                            {prompt.prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Content */}
                <Textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={currentPrompt?.prompt || "What's on your mind today? How did your day go? What progress did you make toward your goals?"}
                  rows={10}
                  className="resize-none"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEntry} disabled={!formContent.trim()}>
                  Save Entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Entry Detail Dialog */}
        <Dialog open={!!selectedEntryId} onOpenChange={(open) => !open && setSelectedEntryId(null)}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedEntry && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>
                      {new Date(selectedEntry.timestamp).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <SentimentDot sentiment={getSentimentLabel(selectedEntry.sentimentScore)} />
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Energy/Sleep display */}
                  {(selectedEntry.energyLevel || selectedEntry.sleepQuality) && (
                    <div className="flex gap-4 text-sm">
                      {selectedEntry.energyLevel && (
                        <div className="flex items-center gap-1.5">
                          <Battery className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Energy: {ENERGY_LEVELS.find(e => e.value === selectedEntry.energyLevel)?.label}</span>
                        </div>
                      )}
                      {selectedEntry.sleepQuality && (
                        <div className="flex items-center gap-1.5">
                          <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Sleep: {SLEEP_QUALITY.find(s => s.value === selectedEntry.sleepQuality)?.label}</span>
                          {selectedEntry.sleepHours && <span>({selectedEntry.sleepHours}h)</span>}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedEntry.content}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.detectedAspects.map((aspect) => (
                      <AspectBadge key={aspect} aspect={aspect} />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Goal alignment: <span className="capitalize">{selectedEntry.goalAlignment}</span>
                  </div>
                  {selectedEntry.llmAnalysis && (
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="h-4 w-4" />
                        AI Analysis
                      </h4>
                      <p className="text-sm text-muted-foreground">{selectedEntry.llmAnalysis}</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  {!selectedEntry.llmAnalysis && (
                    <Button variant="outline" onClick={() => handleAnalyze(selectedEntry.id)}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze with AI
                    </Button>
                  )}
                  <Button onClick={() => setSelectedEntryId(null)}>Close</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No journal entries"
            description="Start writing to track your thoughts and progress"
            actionLabel="New Entry"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => {
              const date = new Date(entry.timestamp)
              const dateStr = date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

              return (
                <Card
                  key={entry.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => setSelectedEntryId(entry.id)}
                >
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium">{dateStr}</div>
                        <div className="text-xs text-muted-foreground">{timeStr}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.energyLevel && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Battery className="h-3 w-3" />
                            {entry.energyLevel}/5
                          </div>
                        )}
                        <SentimentDot sentiment={getSentimentLabel(entry.sentimentScore)} />
                      </div>
                    </div>
                    <p className="mb-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">{entry.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.detectedAspects.map((aspect) => (
                        <AspectBadge key={aspect} aspect={aspect} />
                      ))}
                    </div>
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
