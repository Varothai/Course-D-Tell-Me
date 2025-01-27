"use client"

import { DetailedReview } from "@/types/review"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/providers/language-provider"
import { ReviewCard } from "@/components/review-card"
import type { Review } from "@/types/review"
import { useSearchParams } from "next/navigation"

interface ReviewListProps {
  reviews: Review[]
}

export function ReviewList({ reviews }: ReviewListProps) {
  const { content } = useLanguage()
  const searchParams = useSearchParams()
  const highlightedReviewId = searchParams?.get('reviewId') || null

  const handleLike = async (id: string) => {
    // ... existing like logic
  }

  const handleDislike = async (id: string) => {
    // ... existing dislike logic
  }

  const handleComment = async (id: string, comment: string) => {
    // ... existing comment logic
  }

  const handleBookmark = async (id: string) => {
    // ... existing bookmark logic
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          id={`review-${review.id}`}
          className={`transition-all duration-300 ${
            highlightedReviewId === review.id ? 'ring-2 ring-primary ring-offset-2' : ''
          }`}
        >
          <ReviewCard
            review={review}
            likeAction={handleLike}
            dislikeAction={handleDislike}
            commentAction={handleComment}
            bookmarkAction={handleBookmark}
          />
        </div>
      ))}
    </div>
  )
}

