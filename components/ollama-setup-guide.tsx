"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ExternalLink,
  Terminal,
  ChevronDown,
  Copy,
  Check,
  Sparkles,
  HardDrive,
  Cpu,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OllamaSetupGuideProps {
  variant?: "compact" | "full"
  className?: string
}

const RECOMMENDED_MODELS = [
  {
    name: "mistral",
    size: "4.1GB",
    description: "Best balance of speed and quality",
    recommended: true,
  },
  {
    name: "llama3.2",
    size: "2.0GB",
    description: "Smaller, faster, good for basic tasks",
    recommended: false,
  },
  {
    name: "gemma2",
    size: "5.4GB",
    description: "Google's model, great reasoning",
    recommended: false,
  },
]

export function OllamaSetupGuide({
  variant = "full",
  className,
}: OllamaSetupGuideProps) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(variant === "full")

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedCommand(id)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  const CommandBlock = ({
    command,
    id,
    label,
  }: {
    command: string
    id: string
    label?: string
  }) => (
    <div className="group relative">
      {label && (
        <span className="text-xs text-muted-foreground mb-1 block">{label}</span>
      )}
      <div className="flex items-center gap-2 rounded-md bg-muted/50 dark:bg-muted/30 px-3 py-2 font-mono text-sm">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <code className="flex-1 text-foreground">{command}</code>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => copyToClipboard(command, id)}
        >
          {copiedCommand === id ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  )

  if (variant === "compact") {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("w-full justify-between", className)}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Enable AI Features
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Install Ollama to enable AI-powered model lookup and smart suggestions.
            </p>
            <CommandBlock command="brew install ollama" id="brew-compact" />
            <CommandBlock command="ollama pull mistral" id="pull-compact" />
            <a
              href="https://ollama.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Or download from ollama.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-purple-500" />
          Enable AI Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Ollama runs AI models locally on your machine. Once set up, the app can
          look up air fryer specs, enhance inbox parsing, and provide smarter
          suggestions.
        </p>

        {/* System requirements */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <HardDrive className="h-3 w-3" />
            ~4-8GB disk
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Cpu className="h-3 w-3" />
            8GB+ RAM recommended
          </Badge>
        </div>

        {/* Installation steps */}
        <div className="space-y-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Step 1: Install Ollama</h4>
            <CommandBlock
              command="brew install ollama"
              id="brew-install"
              label="Via Homebrew (recommended)"
            />
            <a
              href="https://ollama.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Or download directly from ollama.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Step 2: Pull a model</h4>
            <div className="space-y-2">
              {RECOMMENDED_MODELS.map((model) => (
                <div
                  key={model.name}
                  className={cn(
                    "flex items-center justify-between rounded-md border p-2",
                    model.recommended && "border-primary/50 bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium">{model.name}</code>
                    <span className="text-xs text-muted-foreground">
                      {model.size}
                    </span>
                    {model.recommended && (
                      <Badge variant="default" className="text-[10px] h-4">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      copyToClipboard(`ollama pull ${model.name}`, model.name)
                    }
                  >
                    {copiedCommand === model.name ? (
                      <Check className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    Copy
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Step 3: Start Ollama</h4>
            <p className="text-xs text-muted-foreground">
              Ollama runs as a menu bar app on macOS. After installation, it
              should start automatically. Look for the llama icon in your menu bar.
            </p>
            <CommandBlock
              command="ollama serve"
              id="serve"
              label="Or start manually in terminal"
            />
          </div>
        </div>

        <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
          <strong>Note:</strong> All AI processing happens locally on your machine.
          No data is sent to external servers. The app works fully offline once
          Ollama is set up.
        </div>
      </CardContent>
    </Card>
  )
}
