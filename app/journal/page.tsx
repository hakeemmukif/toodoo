"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { AspectBadge } from "@/components/aspect-badge"
import { SentimentDot } from "@/components/sentiment-dot"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { useJournalStore } from "@/stores/journal"
import { getSentimentLabel } from "@/services/analysis"
import { BookOpen, Plus, Search, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function JournalPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formContent, setFormContent] = useState("")
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)

  const entries = useJournalStore((state) => state.entries)
  const addEntry = useJournalStore((state) => state.addEntry)
  const analyzeWithLLM = useJournalStore((state) => state.analyzeWithLLM)

  const { toast } = useToast()

  const filteredEntries = entries.filter(
    (entry) =>
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.detectedAspects.some((a) => a.includes(searchQuery.toLowerCase())),
  )

  const handleAddEntry = async () => {
    if (!formContent.trim()) return

    await addEntry(formContent)
    setFormContent("")
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
              <div className="py-4">
                <Textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="What's on your mind today? How did your day go? What progress did you make toward your goals?"
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
                      <SentimentDot sentiment={getSentimentLabel(entry.sentimentScore)} />
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
