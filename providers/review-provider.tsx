"use client"

import { createContext, useContext, useState } from "react"
import { Review } from "@/types/review"

interface ReviewContextType {
  reviews: Review[]
  addReview: (review: Partial<Review>) => void
  clearReviews: () => void
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined)

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([])

  const clearReviews = () => setReviews([])

  const addReview = (reviewData: Partial<Review>) => {
    setReviews((prev) => [
      {
        ...reviewData,
        id: Math.random().toString(36).substr(2, 9),
        likes: 0,
        dislikes: 0,
        comments: [],
        isBookmarked: false,
      } as Review,
      ...prev,
    ])
  }

  return (
    <ReviewContext.Provider value={{ reviews, addReview, clearReviews }}>
      {children}
    </ReviewContext.Provider>
  )
}

export function useReviews() {
  const context = useContext(ReviewContext)
  if (context === undefined) {
    throw new Error("useReviews must be used within a ReviewProvider")
  }
  return context
} 