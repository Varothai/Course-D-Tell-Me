"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import { Review } from "@/types/review"
import { useParams } from "next/navigation"
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Bookmark, Book } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ReviewDialog } from "@/components/review-dialog"
import { useReviews } from "@/providers/reviews-provider"
import { formatDistanceToNow, format } from 'date-fns'

interface ReviewWithUserInteraction extends Review {
  hasLiked?: boolean;
  hasDisliked?: boolean;
}

export default function FacultyReviewsPage() {
  const { content } = useLanguage()
  const params = useParams()
  const [reviews, setReviews] = useState<ReviewWithUserInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const faculty = params?.faculty ? decodeURIComponent(params.faculty as string) : ''
  const { handleLike, handleDislike } = useReviews()

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const encodedFaculty = encodeURIComponent(faculty)
        const response = await fetch(`/api/reviews/faculty/${encodedFaculty}/`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        if (data.success) {
          // Sort reviews by date, newest first
          const sortedReviews = data.reviews.sort((a: Review, b: Review) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          setReviews(sortedReviews)
        } else {
          throw new Error(data.error || 'Failed to fetch reviews')
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [faculty])

  const handleContentClick = (review: Review) => {
    setSelectedReview(review)
    setIsDialogOpen(true)
  }

  const handleLikeClick = async (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    await handleLike(reviewId, review.hasLiked, review.hasDisliked);
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? {
            ...review,
            likes: review.hasLiked ? review.likes - 1 : review.likes + 1,
            dislikes: review.hasDisliked ? review.dislikes - 1 : review.dislikes,
            hasLiked: !review.hasLiked,
            hasDisliked: false
          }
        : review
    ));
  };

  const handleDislikeClick = async (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    await handleDislike(reviewId, review.hasLiked, review.hasDisliked);
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? {
            ...review,
            dislikes: review.hasDisliked ? review.dislikes - 1 : review.dislikes + 1,
            likes: review.hasLiked ? review.likes - 1 : review.likes,
            hasDisliked: !review.hasDisliked,
            hasLiked: false
          }
        : review
    ));
  };

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
        <div className="container mx-auto px-4 py-8 relative">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {faculty}
          </h1>
          <p className="text-muted-foreground">
            {reviews.length} {content.language === 'en' ? 'Course Reviews' : 'รีวิวรายวิชา'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <Card 
                key={review.id} 
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800"
                onClick={() => handleContentClick(review)}
              >
                <div className="p-6">
                  {/* Course Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-mono text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {review.courseId}
                      </div>
                      <div className="text-sm text-muted-foreground">{review.courseName}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 transition-colors ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-8 h-8 border-2 border-purple-200 dark:border-purple-800">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                          {review.userName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-purple-700 dark:text-purple-300">
                          {review.userName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {review.timestamp ? format(new Date(review.timestamp), 'MMM d, yyyy') : ''}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.review}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLikeClick(review.id)
                      }}
                      className={`hover:bg-purple-50 dark:hover:bg-purple-900/30 ${
                        review.hasLiked ? "text-purple-600 dark:text-purple-400" : ""
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 mr-2 ${review.hasLiked ? "fill-current" : ""}`} />
                      {review.likes} {content.likes}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDislikeClick(review.id)
                      }}
                      className={`hover:bg-purple-50 dark:hover:bg-purple-900/30 ${
                        review.hasDisliked ? "text-purple-600 dark:text-purple-400" : ""
                      }`}
                    >
                      <ThumbsDown className={`w-4 h-4 mr-2 ${review.hasDisliked ? "fill-current" : ""}`} />
                      {review.dislikes} {content.dislikes}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="hover:bg-purple-50 dark:hover:bg-purple-900/30"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {review.comments?.length || 0} {content.comments}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`hover:bg-purple-50 dark:hover:bg-purple-900/30 ml-auto ${
                        review.isBookmarked ? "text-purple-600 dark:text-purple-400" : ""
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${review.isBookmarked ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <Book className="w-12 h-12 mx-auto mb-4 text-purple-500/50" />
              <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-muted-foreground">
                Be the first to review courses from this faculty!
              </p>
            </Card>
          )}
        </div>
      </div>

      {selectedReview && (
        <ReviewDialog 
          review={selectedReview}
          open={isDialogOpen}
          action={setIsDialogOpen}
        />
      )}
    </div>
  )
} 