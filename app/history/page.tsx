"use client"

import { useState } from "react"
import { ReviewCard } from "@/components/review-card"
import { useLanguage } from "@/providers/language-provider"
import type { Review } from "@/types/review"

export default function History() {
  const { content } = useLanguage()
  const [userReviews, setUserReviews] = useState<Review[]>([])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{content.history}</h1>
      <div className="space-y-4">
        {userReviews.map((review) => (
          <ReviewCard 
            key={review.id} 
            review={review} 
            likeAction={() => {}}
            dislikeAction={() => {}}
            commentAction={() => {}}
            bookmarkAction={() => {}}
          />
        ))}
      </div>
    </div>
  )
} 