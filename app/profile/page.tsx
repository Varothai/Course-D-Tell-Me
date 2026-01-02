"use client"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Book } from "lucide-react"
import { Review } from "@/types/review"
import { useToast } from "@/components/ui/use-toast"
import { ReviewCard } from "@/components/review-card"
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

export default function ProfilePage() {
  const { data: session } = useSession()
  const { content } = useLanguage()
  const [userReviews, setUserReviews] = useState<ReviewWithUserInteraction[]>([])
  const [loading, setLoading] = useState(true)
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

  const handleComment = async (reviewId: string, comment: string) => {
    // Implement comment functionality
  }

  const handleBookmark = async (reviewId: string) => {
    // Implement bookmark functionality
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="relative mb-12">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl" />
          
          <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl border-2 border-purple-200 dark:border-purple-800 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-purple-200 dark:border-purple-800 shadow-lg">
                <AvatarImage src={session.user?.image || ''} />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-2xl text-white">
                  {session.user?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {session.user?.name}
                </h1>
                <p className="text-muted-foreground">{session.user?.email}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* User's Reviews */}
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-lg transition-all duration-300">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {content.yourReviews}
            </h2>
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
                Start sharing your course experiences!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 