'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Send, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExcavationInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onSkip?: () => void
  placeholder?: string
  minLength?: number
  isSubmitting: boolean
  isRequired: boolean
}

export function ExcavationInput({
  value,
  onChange,
  onSubmit,
  onSkip,
  placeholder,
  minLength,
  isSubmitting,
  isRequired,
}: ExcavationInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSubmit) {
        onSubmit()
      }
    }
  }

  const meetsMinLength = !minLength || value.length >= minLength
  const canSubmit = value.trim().length > 0 && meetsMinLength && !isSubmitting

  return (
    <div className="border-t bg-background px-4 py-3">
      {/* Min length hint */}
      {minLength && value.length > 0 && !meetsMinLength && (
        <p className="text-xs text-muted-foreground mb-2">
          {minLength - value.length} more characters needed
        </p>
      )}

      <div
        className={cn(
          'flex items-end gap-2 rounded-xl border bg-background p-2 transition-colors',
          isFocused && 'border-primary/50 ring-2 ring-primary/10'
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || 'Type your response...'}
          disabled={isSubmitting}
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-1 text-sm focus:outline-none disabled:opacity-50"
        />

        <div className="flex items-center gap-1">
          {/* Skip button (only for non-required questions) */}
          {onSkip && !isRequired && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onSkip}
              disabled={isSubmitting}
              title="Skip this question"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          )}

          {/* Submit button */}
          <Button
            size="icon-sm"
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {isRequired ? 'Required' : 'Optional'} · Press Enter to send
      </p>
    </div>
  )
}
