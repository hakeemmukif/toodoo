"use client"

import { useEffect, useRef } from "react"
import { useInterruptsStore } from "@/stores/interrupts"

/**
 * Hook that checks for due pattern interrupts on a regular interval.
 * This runs in the foreground when the app is open.
 *
 * MVP implementation - foreground only.
 * Future: Could add service worker for background notifications.
 */
export function useInterruptTimer(intervalMs: number = 60000) {
  const ensureTodaysSchedule = useInterruptsStore((s) => s.ensureTodaysSchedule)
  const loadSchedule = useInterruptsStore((s) => s.loadSchedule)
  const checkForDueInterrupt = useInterruptsStore((s) => s.checkForDueInterrupt)
  const showInterrupt = useInterruptsStore((s) => s.showInterrupt)
  const schedule = useInterruptsStore((s) => s.schedule)

  const hasInitialized = useRef(false)

  // Initialize on mount
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Load schedule from localStorage
    loadSchedule()
  }, [loadSchedule])

  // Ensure today's schedule exists when schedule is enabled
  useEffect(() => {
    if (schedule.enabled) {
      ensureTodaysSchedule()
    }
  }, [schedule.enabled, ensureTodaysSchedule])

  // Check for due interrupts periodically
  useEffect(() => {
    if (!schedule.enabled) return

    const checkDue = () => {
      const dueInterrupt = checkForDueInterrupt()
      if (dueInterrupt) {
        showInterrupt(dueInterrupt.id)
      }
    }

    // Check immediately
    checkDue()

    // Then check on interval
    const interval = setInterval(checkDue, intervalMs)

    return () => clearInterval(interval)
  }, [schedule.enabled, checkForDueInterrupt, showInterrupt, intervalMs])
}
