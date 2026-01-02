"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useInitializeData } from "@/hooks/use-data"
import { useAppStore } from "@/stores/app"

interface ProvidersProps {
  children: React.ReactNode
}

export function DataProvider({ children }: ProvidersProps) {
  const { isLoading, error } = useInitializeData()
  const [mounted, setMounted] = useState(false)
  const isDataLoaded = useAppStore((state) => state.isDataLoaded)
  const hasShownLoading = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything on server to avoid hydration issues with IndexedDB
  if (!mounted) {
    // Return a minimal placeholder to prevent layout shift
    return (
      <div className="min-h-screen bg-background" />
    )
  }

  // Only show loading spinner on first load, not on navigations
  if (isLoading && !isDataLoaded && !hasShownLoading.current) {
    hasShownLoading.current = true
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-destructive">Failed to load data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
