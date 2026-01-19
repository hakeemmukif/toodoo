'use client'

import { useEffect, useRef, useState } from 'react'
import { useExcavationStore } from '@/stores/excavation'
import { getPromptsForTheme, getThemeLabel } from '@/services/excavation'
import { ExcavationMessage } from './excavation-message'
import { ExcavationInput } from './excavation-input'
import { ExcavationProgress } from './excavation-progress'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

interface ExcavationChatProps {
  onComplete?: () => void
}

export function ExcavationChat({ onComplete }: ExcavationChatProps) {
  const {
    todaysExcavation,
    saveResponse,
    skipPrompt,
    completeExcavation,
    startTodaysExcavation,
    loadTodaysExcavation,
  } = useExcavationStore()

  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [insight, setInsight] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load or start excavation on mount
  useEffect(() => {
    const init = async () => {
      await loadTodaysExcavation()
      const state = useExcavationStore.getState()
      if (!state.todaysExcavation) {
        await startTodaysExcavation()
      }
    }
    init()
  }, [loadTodaysExcavation, startTodaysExcavation])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [todaysExcavation?.responses.length, todaysExcavation?.currentPromptIndex])

  if (!todaysExcavation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const prompts = getPromptsForTheme(todaysExcavation.theme)
  const currentPrompt = prompts[todaysExcavation.currentPromptIndex]
  const isAllPromptsAnswered = todaysExcavation.currentPromptIndex >= prompts.length
  const isComplete = todaysExcavation.isComplete

  const handleSubmit = async () => {
    if (!currentPrompt || !inputValue.trim()) return

    setIsSubmitting(true)
    await saveResponse(currentPrompt.id, currentPrompt.question, inputValue.trim())
    setInputValue('')
    setIsSubmitting(false)
  }

  const handleSkip = async () => {
    if (!currentPrompt || currentPrompt.isRequired) return
    await skipPrompt(currentPrompt.id, currentPrompt.question)
  }

  const handleComplete = async () => {
    await completeExcavation(insight.trim() || undefined)
    onComplete?.()
  }

  // Build conversation history
  const conversationItems: Array<{
    type: 'question' | 'answer'
    content: string
    skipped?: boolean
  }> = []

  // Add past Q&A pairs
  todaysExcavation.responses.forEach((response) => {
    const prompt = prompts.find((p) => p.id === response.promptId)
    if (prompt) {
      conversationItems.push({ type: 'question', content: prompt.question })
      if (!response.skipped) {
        conversationItems.push({ type: 'answer', content: response.answer })
      } else {
        conversationItems.push({ type: 'answer', content: '(skipped)', skipped: true })
      }
    }
  })

  // Add current unanswered question
  if (currentPrompt && !isAllPromptsAnswered) {
    conversationItems.push({ type: 'question', content: currentPrompt.question })
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with progress */}
      <ExcavationProgress
        current={todaysExcavation.currentPromptIndex}
        total={prompts.length}
        theme={todaysExcavation.theme}
      />

      {/* Chat messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      >
        {/* Theme intro */}
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Today's Focus
          </p>
          <p className="text-lg font-serif font-medium">
            {getThemeLabel(todaysExcavation.theme)}
          </p>
        </div>

        {conversationItems.map((item, index) => (
          <ExcavationMessage
            key={index}
            type={item.type}
            content={item.content}
            skipped={item.skipped}
          />
        ))}

        {/* Completion state */}
        {isAllPromptsAnswered && !isComplete && (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <CheckCircle className="w-5 h-5" />
              <span>All questions answered</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                One insight from this session (optional):
              </label>
              <textarea
                value={insight}
                onChange={(e) => setInsight(e.target.value)}
                placeholder="What's one thing you don't want to forget?"
                className="w-full px-4 py-3 rounded-xl border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={2}
              />
            </div>

            <Button onClick={handleComplete} className="w-full">
              Complete Today's Excavation
            </Button>
          </div>
        )}

        {isComplete && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-primary" />
            <p className="text-lg font-medium mb-1">Excavation Complete</p>
            <p className="text-sm text-muted-foreground">
              See you tomorrow for more reflection.
            </p>
          </div>
        )}
      </div>

      {/* Input area */}
      {!isAllPromptsAnswered && currentPrompt && (
        <ExcavationInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          onSkip={currentPrompt.isRequired ? undefined : handleSkip}
          placeholder={currentPrompt.placeholder}
          minLength={currentPrompt.minLength}
          isSubmitting={isSubmitting}
          isRequired={currentPrompt.isRequired}
        />
      )}
    </div>
  )
}
