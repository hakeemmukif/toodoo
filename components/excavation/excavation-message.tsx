import { cn } from '@/lib/utils'

interface ExcavationMessageProps {
  type: 'question' | 'answer'
  content: string
  skipped?: boolean
}

export function ExcavationMessage({ type, content, skipped }: ExcavationMessageProps) {
  const isQuestion = type === 'question'

  return (
    <div
      className={cn(
        'flex',
        isQuestion ? 'justify-start' : 'justify-end'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3',
          isQuestion
            ? 'bg-muted text-foreground rounded-tl-sm'
            : 'bg-primary text-primary-foreground rounded-tr-sm',
          skipped && 'opacity-50 italic'
        )}
      >
        <p
          className={cn(
            'text-sm leading-relaxed whitespace-pre-wrap',
            isQuestion && 'font-medium'
          )}
        >
          {content}
        </p>
      </div>
    </div>
  )
}
