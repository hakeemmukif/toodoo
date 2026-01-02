import { create } from "zustand"
import { db, generateId, getWeekString } from "@/db"
import type { WeeklyReview } from "@/lib/types"

interface ReviewsState {
  reviews: WeeklyReview[]
  isLoading: boolean
  error: string | null

  // Actions
  loadReviews: () => Promise<void>
  addReview: (review: Omit<WeeklyReview, "id">) => Promise<string>
  updateReview: (id: string, updates: Partial<WeeklyReview>) => Promise<void>
  deleteReview: (id: string) => Promise<void>

  // Helpers
  getReviewForWeek: (week: string) => WeeklyReview | undefined
  getCurrentWeekReview: () => WeeklyReview | undefined
  getLastReview: () => WeeklyReview | undefined
  isReviewDue: () => boolean
}

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviews: [],
  isLoading: false,
  error: null,

  loadReviews: async () => {
    set({ isLoading: true, error: null })
    try {
      const reviews = await db.weeklyReviews.toArray()
      // Sort by completedAt descending (newest first)
      reviews.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      set({ reviews, isLoading: false })
    } catch (error) {
      set({ error: "Failed to load weekly reviews", isLoading: false })
    }
  },

  addReview: async (reviewData) => {
    const id = generateId()
    const review: WeeklyReview = {
      ...reviewData,
      id,
    }
    await db.weeklyReviews.add(review)
    set((state) => ({ reviews: [review, ...state.reviews] }))
    return id
  },

  updateReview: async (id, updates) => {
    await db.weeklyReviews.update(id, updates)
    set((state) => ({
      reviews: state.reviews.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }))
  },

  deleteReview: async (id) => {
    await db.weeklyReviews.delete(id)
    set((state) => ({
      reviews: state.reviews.filter((r) => r.id !== id),
    }))
  },

  getReviewForWeek: (week) => {
    return get().reviews.find((r) => r.weekOf === week)
  },

  getCurrentWeekReview: () => {
    const currentWeek = getWeekString(new Date())
    return get().getReviewForWeek(currentWeek)
  },

  getLastReview: () => {
    return get().reviews[0]
  },

  isReviewDue: () => {
    const currentWeek = getWeekString(new Date())
    const lastReview = get().getLastReview()

    // No reviews yet
    if (!lastReview) return true

    // Last review is not for current week
    if (lastReview.weekOf !== currentWeek) return true

    return false
  },
}))
