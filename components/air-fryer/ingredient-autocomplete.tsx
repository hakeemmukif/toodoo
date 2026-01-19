"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { recognizeIngredientsSync } from "@/services/ingredient-recognition"
import type { IngredientSuggestion, AirFryerCategory } from "@/lib/types"
import { Beef, Carrot, Snowflake, Croissant, Cookie, HelpCircle, Thermometer, Clock } from "lucide-react"

interface IngredientAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: IngredientSuggestion) => void
  placeholder?: string
  id?: string
  className?: string
}

// Category icons mapping
const categoryIcons: Record<AirFryerCategory, React.ReactNode> = {
  protein: <Beef className="h-4 w-4 text-red-400" />,
  vegetable: <Carrot className="h-4 w-4 text-green-500" />,
  frozen: <Snowflake className="h-4 w-4 text-blue-400" />,
  bread: <Croissant className="h-4 w-4 text-amber-500" />,
  snack: <Cookie className="h-4 w-4 text-orange-400" />,
  other: <HelpCircle className="h-4 w-4 text-gray-400" />,
}

export function IngredientAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "e.g., Chicken breast, Potatoes",
  id,
  className,
}: IngredientAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search
  const searchIngredients = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!query || query.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      const results = recognizeIngredientsSync(query, {
        maxResults: 5,
        minConfidence: 0.5,
      })
      setSuggestions(results)
      setIsOpen(results.length > 0)
      setActiveIndex(-1)
    }, 150) // 150ms debounce
  }, [])

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    searchIngredients(newValue)
  }, [onChange, searchIngredients])

  // Handle suggestion selection
  const handleSelect = useCallback((suggestion: IngredientSuggestion) => {
    onChange(suggestion.ingredient)
    onSelect(suggestion)
    setSuggestions([])
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }, [onChange, onSelect])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelect(suggestions[activeIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
        break
    }
  }, [isOpen, suggestions, activeIndex, handleSelect])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        inputRef.current &&
        !inputRef.current.contains(target) &&
        listRef.current &&
        !listRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" })
      }
    }
  }, [activeIndex])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
      />

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.ingredient}-${index}`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-accent focus:bg-accent outline-none",
                index === activeIndex && "bg-accent",
                index === 0 && "rounded-t-md",
                index === suggestions.length - 1 && "rounded-b-md"
              )}
              role="option"
              aria-selected={index === activeIndex}
            >
              {/* Category icon */}
              <span className="shrink-0">
                {categoryIcons[suggestion.category]}
              </span>

              {/* Ingredient name */}
              <span className="flex-1 font-medium truncate">
                {suggestion.ingredient}
              </span>

              {/* Cooking params preview */}
              <span className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                <span className="flex items-center gap-0.5">
                  <Thermometer className="h-3 w-3" />
                  {suggestion.temperature}C
                </span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {suggestion.timeMinutes}m
                </span>
              </span>

              {/* Confidence indicator */}
              {suggestion.confidence < 0.9 && (
                <span className="text-[10px] text-muted-foreground/60 shrink-0">
                  ~{Math.round(suggestion.confidence * 100)}%
                </span>
              )}
            </button>
          ))}

          {/* Manual entry hint */}
          <div className="border-t px-3 py-1.5 text-[11px] text-muted-foreground">
            Press Enter to use &quot;{value}&quot; with custom values
          </div>
        </div>
      )}
    </div>
  )
}
