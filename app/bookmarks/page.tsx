"use client"

import { useState } from "react"
import { ReviewCard } from "@/components/review-card"
import { useLanguage } from "@/providers/language-provider"

export default function Bookmarks() {
  const { content } = useLanguage()
  const [bookmarkedReviews, setBookmarkedReviews] = useState([])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{content.bookmarks}</h1>
      <div className="space-y-4">
        {bookmarkedReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
} 