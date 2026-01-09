"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  animate?: boolean
  className?: string
}

export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  color = "#3B82F6",
  label,
  animate = true,
  className,
}: ProgressRingProps) {
  const [mounted, setMounted] = useState(false)
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const initialProgressRef = useRef(progress)

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const displayProgress = animate ? animatedProgress : progress
  const offset = circumference - (displayProgress / 100) * circumference

  // Mount animation - only runs once
  useEffect(() => {
    setMounted(true)
    if (animate) {
      // Small delay for stagger effect when multiple rings
      const timer = setTimeout(() => {
        setAnimatedProgress(initialProgressRef.current)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [animate])

  // Update animated progress when progress prop changes (after mount)
  useEffect(() => {
    if (mounted && animate) {
      setAnimatedProgress(progress)
    }
  }, [progress, mounted, animate])

  const ariaLabel = label || `Progress: ${Math.round(progress)}%`

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <svg
        className="rotate-[-90deg]"
        width={size}
        height={size}
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
        {Math.round(progress)}%
      </div>
    </div>
  )
}
