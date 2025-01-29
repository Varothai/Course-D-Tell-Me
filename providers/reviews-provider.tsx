"use client"

import { createContext, useContext, ReactNode } from 'react'

interface ReviewsContextType {
  handleLike: (reviewId: string, hasLiked?: boolean, hasDisliked?: boolean) => Promise<void>
  handleDislike: (reviewId: string, hasLiked?: boolean, hasDisliked?: boolean) => Promise<void>
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined)

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const handleLike = async (reviewId: string, hasLiked?: boolean, hasDisliked?: boolean) => {
    try {
      // If already liked, return
      if (hasLiked) return;

      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reviewId, 
          action: hasDisliked ? 'undislike-and-like' : 'like' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to like review');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to like review');
      }
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const handleDislike = async (reviewId: string, hasLiked?: boolean, hasDisliked?: boolean) => {
    try {
      // If already disliked, return
      if (hasDisliked) return;

      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reviewId, 
          action: hasLiked ? 'unlike-and-dislike' : 'dislike' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to dislike review');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to dislike review');
      }
    } catch (error) {
      console.error('Error disliking review:', error);
    }
  };

  return (
    <ReviewsContext.Provider value={{ handleLike, handleDislike }}>
      {children}
    </ReviewsContext.Provider>
  )
}

export function useReviews() {
  const context = useContext(ReviewsContext)
  if (context === undefined) {
    throw new Error('useReviews must be used within a ReviewsProvider')
  }
  return context
} 