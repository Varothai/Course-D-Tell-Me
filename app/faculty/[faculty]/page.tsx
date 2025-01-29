"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import { Review } from "@/types/review"
import { useParams } from "next/navigation"
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Bookmark } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ReviewDialog } from "@/components/review-dialog"

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
          setReviews(data.reviews)
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

  const handleLike = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      // If already liked, return
      if (review.hasLiked) return;

      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reviewId, 
          action: review.hasDisliked ? 'undislike-and-like' : 'like' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to like review');
      }

      const data = await response.json();
      if (data.success) {
        setReviews(reviews.map(review => 
          review.id === reviewId 
            ? {
                ...review,
                likes: review.likes + 1,
                dislikes: review.hasDisliked ? review.dislikes - 1 : review.dislikes,
                hasLiked: true,
                hasDisliked: false
              }
            : review
        ));
      }
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const handleDislike = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      // If already disliked, return
      if (review.hasDisliked) return;

      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reviewId, 
          action: review.hasLiked ? 'unlike-and-dislike' : 'dislike' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to dislike review');
      }

      const data = await response.json();
      if (data.success) {
        setReviews(reviews.map(review => 
          review.id === reviewId 
            ? {
                ...review,
                dislikes: review.dislikes + 1,
                likes: review.hasLiked ? review.likes - 1 : review.likes,
                hasDisliked: true,
                hasLiked: false
              }
            : review
        ));
      }
    } catch (error) {
      console.error('Error disliking review:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#E5E1FF] dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">{faculty}</h1>
        
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id} className="p-4 mb-4">
                <div 
                  className="flex gap-4 cursor-pointer"
                  onClick={() => handleContentClick(review)}
                >
                  <div className="flex-1">
                    <div className="font-mono text-lg font-bold">{review.courseId}</div>
                    <div className="text-sm text-muted-foreground">{review.courseName}</div>
                    <div className="flex mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "fill-primary text-primary"
                              : "fill-muted text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex-[2]">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback>{review.userName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{review.userName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{review.review}</p>
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(review.id);
                        }}
                        className={review.hasLiked ? "text-primary" : ""}
                      >
                        <ThumbsUp className={`w-4 h-4 mr-2 ${review.hasLiked ? "fill-primary" : ""}`} />
                        {review.likes} {content.likes}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDislike(review.id);
                        }}
                        className={review.hasDisliked ? "text-primary" : ""}
                      >
                        <ThumbsDown className={`w-4 h-4 mr-2 ${review.hasDisliked ? "fill-primary" : ""}`} />
                        {review.dislikes} {content.dislikes}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {review.comments?.length || 0} {content.comments}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Bookmark className={`w-4 h-4 ${review.isBookmarked ? "fill-primary" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-xl text-muted-foreground">
                No reviews available for this faculty.
              </p>
            </div>
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