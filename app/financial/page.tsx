"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { useFinancialStore } from "@/stores/financial"
import { useGoalsStore } from "@/stores/goals"
import { formatDate } from "@/db"
import { Wallet, Plus, TrendingUp, TrendingDown, CheckCircle2, XCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FinancialPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [savingsBalance, setSavingsBalance] = useState("")
  const [monthlyTarget, setMonthlyTarget] = useState("")
  const [actualSaved, setActualSaved] = useState("")
  const [linkedGoalId, setLinkedGoalId] = useState("")
  const [onTrack, setOnTrack] = useState(true)
  const [notes, setNotes] = useState("")

  const snapshots = useFinancialStore((state) => state.snapshots)
  const addSnapshot = useFinancialStore((state) => state.addSnapshot)
  const deleteSnapshot = useFinancialStore((state) => state.deleteSnapshot)
  const getLatestSnapshot = useFinancialStore((state) => state.getLatestSnapshot)
  const calculateTrajectory = useFinancialStore((state) => state.calculateTrajectory)

  // Get financial goals
  const yearlyGoals = useGoalsStore((state) => state.yearlyGoals)
  const financialGoals = yearlyGoals.filter((g) => g.aspect === "financial" && g.status === "active")

  const { toast } = useToast()

  const latestSnapshot = getLatestSnapshot()

  // Calculate stats
  const onTrackCount = snapshots.filter((s) => s.onTrack).length
  const offTrackCount = snapshots.filter((s) => !s.onTrack).length
  const totalSaved = snapshots.reduce((sum, s) => sum + (s.actualSaved || 0), 0)

  const handleAddSnapshot = async () => {
    await addSnapshot({
      date: formatDate(new Date()),
      savingsBalance: savingsBalance ? parseFloat(savingsBalance) : undefined,
      monthlyTarget: monthlyTarget ? parseFloat(monthlyTarget) : undefined,
      actualSaved: actualSaved ? parseFloat(actualSaved) : undefined,
      linkedGoalId: linkedGoalId || undefined,
      onTrack,
      notes: notes || undefined,
    })

    // Reset form
    setSavingsBalance("")
    setMonthlyTarget("")
    setActualSaved("")
    setLinkedGoalId("")
    setOnTrack(true)
    setNotes("")
    setDialogOpen(false)

    toast({
      title: "Snapshot saved",
      description: "Your financial check-in has been recorded.",
    })
  }

  const handleDelete = async (id: string) => {
    await deleteSnapshot(id)
    toast({
      title: "Snapshot deleted",
      description: "The financial snapshot has been removed.",
    })
  }

  // Get trajectory for linked goal
  const trajectory = linkedGoalId ? calculateTrajectory(linkedGoalId) : null

  return (
    <AppLayout>
      <div className="container max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Check-in</h1>
            <p className="text-muted-foreground">Track your savings progress monthly</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Check-in
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Monthly Financial Check-in</DialogTitle>
                <DialogDescription>
                  Record your savings progress for this month.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current Savings Balance</Label>
                    <Input
                      type="number"
                      value={savingsBalance}
                      onChange={(e) => setSavingsBalance(e.target.value)}
                      placeholder="e.g., 15000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount Saved This Month</Label>
                    <Input
                      type="number"
                      value={actualSaved}
                      onChange={(e) => setActualSaved(e.target.value)}
                      placeholder="e.g., 1500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Target (optional)</Label>
                  <Input
                    type="number"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(e.target.value)}
                    placeholder="e.g., 2000"
                  />
                </div>
                {financialGoals.length > 0 && (
                  <div className="space-y-2">
                    <Label>Link to Goal (optional)</Label>
                    <Select value={linkedGoalId} onValueChange={setLinkedGoalId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a financial goal..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No linked goal</SelectItem>
                        {financialGoals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>On Track?</Label>
                    <p className="text-sm text-muted-foreground">
                      Are you on track to meet your financial goals?
                    </p>
                  </div>
                  <Switch checked={onTrack} onCheckedChange={setOnTrack} />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any context, wins, or setbacks this month..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSnapshot}>
                  Save Check-in
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <Wallet className="h-8 w-8 text-amber-500" />
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {latestSnapshot?.savingsBalance?.toLocaleString() || "—"}
                </div>
                <div className="text-xs text-muted-foreground">Current Balance</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="text-center">
                <div className="text-2xl font-bold">{totalSaved.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Saved</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div className="text-center">
                <div className="text-2xl font-bold">{onTrackCount}</div>
                <div className="text-xs text-muted-foreground">Months On Track</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="text-center">
                <div className="text-2xl font-bold">{offTrackCount}</div>
                <div className="text-xs text-muted-foreground">Months Off Track</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trajectory Card */}
        {trajectory && trajectory.projectedAmount !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Projected Year End
              </CardTitle>
              <CardDescription>Based on your average monthly savings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {trajectory.projectedAmount.toLocaleString()}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {trajectory.onTrackCount} months on track, {trajectory.offTrackCount} months off track
              </p>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {snapshots.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No financial check-ins"
            description="Start tracking your savings progress"
            actionLabel="Add Check-in"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Check-in History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshots.map((snapshot) => {
                const date = new Date(snapshot.date)
                const dateStr = date.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
                const linkedGoal = financialGoals.find((g) => g.id === snapshot.linkedGoalId)

                return (
                  <div
                    key={snapshot.id}
                    className="group flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          snapshot.onTrack ? "bg-green-500/20" : "bg-red-500/20"
                        }`}
                      >
                        {snapshot.onTrack ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{dateStr}</div>
                        <div className="text-sm text-muted-foreground">
                          {snapshot.actualSaved !== undefined && (
                            <span>Saved: {snapshot.actualSaved.toLocaleString()}</span>
                          )}
                          {snapshot.savingsBalance !== undefined && (
                            <span className="ml-2">
                              Balance: {snapshot.savingsBalance.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {linkedGoal && (
                          <div className="text-xs text-muted-foreground">
                            Goal: {linkedGoal.title}
                          </div>
                        )}
                        {snapshot.notes && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {snapshot.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleDelete(snapshot.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
