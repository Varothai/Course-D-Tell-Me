"use client"

import { useState, useEffect } from "react"
import { ReviewCard } from "@/components/review-card"
import { useLanguage } from "@/providers/language-provider"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Book } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { Review } from "@/types/review"

export default function History() {
  const { content } = useLanguage()
  const [userReviews, setUserReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const { toast } = useToast()

  useEffect(() => {
    fetchUserReviews()
  }, [session])

  const fetchUserReviews = async () => {
    if (!session) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/reviews/history')
      const data = await response.json()
      
      if (data.success) {
        setUserReviews(data.reviews)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch your reviews",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching user reviews:", error)
      toast({
        title: "Error",
        description: "Failed to fetch your reviews",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (reviewId: string) => {
    // Implement like functionality
  }

  const handleDislike = async (reviewId: string) => {
    // Implement dislike functionality
  }

  const handleComment = async (reviewId: string, comment: string) => {
    // Implement comment functionality
  }

  const handleBookmark = async (reviewId: string) => {
    // Implement bookmark functionality
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-4">
              Please Sign In
            </h2>
            <p className="text-muted-foreground">
              You need to be signed in to view your review history
            </p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-lg transition-all duration-300 mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {content.history}
          </h1>
          <p className="text-muted-foreground mt-2">
            {userReviews.length} {userReviews.length === 1 ? 'Review' : 'Reviews'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
          </div>
        ) : userReviews.length > 0 ? (
          <div className="space-y-6">
            {userReviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review}
                likeAction={handleLike}
                dislikeAction={handleDislike}
                commentAction={handleComment}
                bookmarkAction={handleBookmark}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <Book className="w-12 h-12 mx-auto mb-4 text-purple-500/50" />
            <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300 mb-2">
              No Reviews Yet
            </h3>
            <p className="text-muted-foreground">
              You haven't posted any reviews yet
            </p>
          </Card>
        )}
      </div>
    </div>
  )
} 