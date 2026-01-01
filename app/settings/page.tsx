"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useAppStore } from "@/stores/app"
import { checkOllamaConnection, getAvailableModels } from "@/services/ollama"
import { Moon, Sun, Download, Upload, Trash2, CheckCircle2, XCircle, Info, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const exportData = useAppStore((state) => state.exportData)
  const importData = useAppStore((state) => state.importData)
  const clearAllData = useAppStore((state) => state.clearAllData)

  const [ollamaUrl, setOllamaUrl] = useState("")
  const [ollamaModel, setOllamaModel] = useState("")
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // Initialize from settings
  useEffect(() => {
    if (settings) {
      setOllamaUrl(settings.ollamaUrl || "http://localhost:11434")
      setOllamaModel(settings.ollamaModel || "mistral")
    }
  }, [settings])

  const testConnection = async () => {
    setConnectionStatus("testing")
    try {
      // Save URL to settings first
      await updateSettings({ ollamaUrl })

      const isConnected = await checkOllamaConnection()
      if (isConnected) {
        setConnectionStatus("success")
        // Fetch available models
        const models = await getAvailableModels()
        setAvailableModels(models)
        if (models.length > 0 && !models.includes(ollamaModel)) {
          setOllamaModel(models[0])
          await updateSettings({ ollamaModel: models[0] })
        }
        toast({
          title: "Connected",
          description: `Found ${models.length} available model${models.length !== 1 ? "s" : ""}.`,
        })
      } else {
        setConnectionStatus("error")
      }
    } catch {
      setConnectionStatus("error")
    }
  }

  const handleSaveOllamaSettings = async () => {
    await updateSettings({ ollamaUrl, ollamaModel })
    toast({
      title: "Settings saved",
      description: "Ollama configuration has been updated.",
    })
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = await exportData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `life-tracker-export-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({
        title: "Export complete",
        description: "Your data has been downloaded as a JSON file.",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive",
      })
    }
    setIsExporting(false)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      await importData(text)
      toast({
        title: "Import complete",
        description: "Your data has been successfully imported.",
      })
      // Reload the page to refresh all stores
      window.location.reload()
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Invalid file format or corrupted data.",
        variant: "destructive",
      })
    }
    setIsImporting(false)
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClearData = async () => {
    try {
      await clearAllData()
      toast({
        title: "Data cleared",
        description: "All your data has been removed.",
      })
      // Reload the page to refresh all stores
      window.location.reload()
    } catch (error) {
      toast({
        title: "Clear failed",
        description: "There was an error clearing your data.",
        variant: "destructive",
      })
    }
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your app preferences and data</p>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
                </div>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
            </div>
          </CardContent>
        </Card>

        {/* Aspect Customization */}
        <Card>
          <CardHeader>
            <CardTitle>Life Aspects</CardTitle>
            <CardDescription>View and customize your life aspect categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(ASPECT_CONFIG).map(([aspect, config]) => {
                const Icon = config.icon
                return (
                  <div key={aspect} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: config.color }} />
                      </div>
                      <div>
                        <div className="font-medium">{config.label}</div>
                        <div className="text-sm text-muted-foreground">{aspect}</div>
                      </div>
                    </div>
                    <div
                      className="h-6 w-6 rounded-full border-2 border-muted"
                      style={{ backgroundColor: config.color }}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ollama Connection */}
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis</CardTitle>
            <CardDescription>Connect to Ollama for AI-powered insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ollama-url">Ollama Server URL</Label>
              <Input
                id="ollama-url"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={testConnection} disabled={connectionStatus === "testing"}>
                {connectionStatus === "testing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
              {connectionStatus === "success" && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected
                </div>
              )}
              {connectionStatus === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <XCircle className="h-4 w-4" />
                  Connection failed
                </div>
              )}
            </div>

            {connectionStatus === "success" && availableModels.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="ollama-model">Model</Label>
                <Select
                  value={ollamaModel}
                  onValueChange={async (value) => {
                    setOllamaModel(value)
                    await updateSettings({ ollamaModel: value })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {availableModels.length} model{availableModels.length !== 1 ? "s" : ""} available
                </p>
              </div>
            )}

            {connectionStatus === "error" && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>
                  Make sure Ollama is running and accessible at the specified URL. Install Ollama from ollama.ai to
                  enable AI analysis features.
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus === "success" && (
              <Button variant="outline" onClick={handleSaveOllamaSettings}>
                Save Ollama Settings
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export, import, or clear your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isImporting ? "Importing..." : "Import Data"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your goals, tasks, journal entries,
                    training sessions, meals, recipes, and shopping lists.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="font-medium text-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Built with</span>
              <span className="font-medium text-foreground">Next.js & TypeScript</span>
            </div>
            <div className="flex justify-between">
              <span>Storage</span>
              <span className="font-medium text-foreground">IndexedDB (Dexie.js)</span>
            </div>
            <div className="flex justify-between">
              <span>AI Integration</span>
              <span className="font-medium text-foreground">Ollama (Optional)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
