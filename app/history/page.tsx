"use client"

import { useState, useEffect } from "react"
import { ReviewCard } from "@/components/review-card"
import { useLanguage } from "@/providers/language-provider"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Book } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { Review } from "@/types/review"
import { useReviews } from "@/providers/reviews-provider"

interface ReviewWithUserInteraction extends Review {
  hasLiked?: boolean;
  hasDisliked?: boolean;
  _id: string;
  timestamp: string;
  comments: Comment[];
}

interface Comment {
  _id: string;
  comment: string;
  userName: string;
  userEmail?: string;
  createdAt: Date;
}

export default function History() {
  const { content } = useLanguage()
  const [userReviews, setUserReviews] = useState<ReviewWithUserInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const { toast } = useToast()
  const { handleLike, handleDislike } = useReviews()

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
        // Format reviews to match required interface
        const formattedReviews = data.reviews.map((review: any) => ({
          ...review,
          _id: review._id || review.id,
          timestamp: review.timestamp || review.createdAt,
          comments: review.comments || []
        }))
        setUserReviews(formattedReviews)
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

  const handleDelete = (deletedReviewId: string) => {
    setUserReviews(reviews => 
      reviews.filter(review => 
        (review.id !== deletedReviewId) && (review._id !== deletedReviewId)
      )
    );
  }

  const handleEdit = (reviewId: string, updatedReview: Review) => {
    setUserReviews(prevReviews => 
      prevReviews.map(review => 
        (review.id === reviewId || review._id === reviewId) 
          ? updatedReview
          : review
      )
    );
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
                key={review._id}
                review={review}
                likeAction={handleLike}
                dislikeAction={handleDislike}
                onDelete={handleDelete}
                onEdit={handleEdit}
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