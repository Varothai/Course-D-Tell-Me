"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { RatingChart } from "@/components/rating-chart"
import { GradeDistribution } from "@/components/grade-distribution"
import { ReviewCard } from "@/components/review-card"
import { useLanguage } from "@/providers/language-provider"
import type { Review } from "@/types/review"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { PenLine, ChartPie, Star, Users } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import dynamic from "next/dynamic"
const ReviewForm = dynamic(
  () => import("@/components/review-form").then(mod => mod.ReviewForm),
  { loading: () => <div className="p-4 text-center text-sm text-muted-foreground">Loading form...</div> }
)

interface ReviewWithUserInteraction extends Omit<Review, 'likes' | 'dislikes'> {
  likes: string[];
  dislikes: string[];
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

export default function CoursePage() {
  const params = useParams<{ id: string }>()
  const courseId = params?.id || ''
  const { content } = useLanguage()
  const [reviews, setReviews] = useState<ReviewWithUserInteraction[]>([])
  const [ratingData, setRatingData] = useState<Record<number, number>>({})
  const [gradeData, setGradeData] = useState<Record<string, number>>({})
  const [courseName, setCourseName] = useState("")
  const { data: session } = useSession()
  const isCMUUser = session?.user?.provider === 'cmu'
  const isGoogleUser = () => {
    return session?.user?.provider === 'google'
  }

  const fetchCourseAndReviews = async () => {
    try {
      // Fetch course name from CSV
      const courseResponse = await fetch('/courses/courses.csv')
      const courseText = await courseResponse.text()
      const courses = courseText.split('\n').map(line => {
        const [id, name] = line.split(',')
        return { id: id.trim(), name: name?.trim() }
      })
      const course = courses.find(c => c.id === courseId)
      if (course) {
        setCourseName(course.name)
      }

      // Fetch only reviews for this course
      const reviewResponse = await fetch(`/api/reviews?courseId=${courseId}`)
      const data = await reviewResponse.json()
      
      if (data.success) {
        // Filter and format reviews for this course
        const userId = session?.user?.email;
        const courseReviews = data.reviews
          .filter((review: Review) => review.courseId === courseId)
          .map((review: Review) => ({
            ...review,
            _id: review._id || review.id,
            timestamp: review.timestamp || review.createdAt,
            comments: review.comments || [],
            likes: Array.isArray(review.likes) ? review.likes : (typeof review.likes === 'number' ? [] : []),
            dislikes: Array.isArray(review.dislikes) ? review.dislikes : (typeof review.dislikes === 'number' ? [] : []),
            hasLiked: userId ? (Array.isArray(review.likes) ? review.likes.includes(userId) : false) : false,
            hasDisliked: userId ? (Array.isArray(review.dislikes) ? review.dislikes.includes(userId) : false) : false
          }));

        setReviews(courseReviews);

        // Calculate distributions only for this course's reviews
        const ratingCounts: Record<number, number> = {}
        const gradeCounts: Record<string, number> = {}

        courseReviews.forEach((review: Review) => {
          ratingCounts[review.rating] = (ratingCounts[review.rating] || 0) + 1
          if (review.grade) {
            gradeCounts[review.grade] = (gradeCounts[review.grade] || 0) + 1
          }
        })

        setRatingData(ratingCounts)
        setGradeData(gradeCounts)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    if (courseId) {
      fetchCourseAndReviews()
    }
  }, [courseId])

  const handleLike = async (reviewId: string, hasLiked?: boolean, hasDisliked?: boolean) => {
    try {
      const userId = session?.user?.email;
      if (!userId) return;

      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId, action: 'like', userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to like review');
      }

      const data = await response.json();
      if (data.success) {
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review._id === reviewId 
              ? {
                  ...review,
                  likes: Array.isArray(data.likes) ? data.likes : review.likes,
                  dislikes: Array.isArray(data.dislikes) ? data.dislikes : review.dislikes,
                  hasLiked: Array.isArray(data.likes) ? data.likes.includes(userId) : review.hasLiked,
                  hasDisliked: Array.isArray(data.dislikes) ? data.dislikes.includes(userId) : review.hasDisliked
                }
              : review
          )
        );
      }
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const handleDislike = async (reviewId: string, hasLiked?: boolean, hasDisliked?: boolean) => {
    try {
      const userId = session?.user?.email;
      if (!userId) return;

      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId, action: 'dislike', userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to dislike review');
      }

      const data = await response.json();
      if (data.success) {
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review._id === reviewId 
              ? {
                  ...review,
                  likes: Array.isArray(data.likes) ? data.likes : review.likes,
                  dislikes: Array.isArray(data.dislikes) ? data.dislikes : review.dislikes,
                  hasLiked: Array.isArray(data.likes) ? data.likes.includes(userId) : review.hasLiked,
                  hasDisliked: Array.isArray(data.dislikes) ? data.dislikes.includes(userId) : review.hasDisliked
                }
              : review
          )
        );
      }
    } catch (error) {
      console.error('Error disliking review:', error);
    }
  };

  const handleDelete = (deletedReviewId: string) => {
    setReviews(prevReviews => 
      prevReviews.filter(review => 
        (review.id !== deletedReviewId) && (review._id !== deletedReviewId)
      )
    );
  };

  const handleEdit = (reviewId: string, updatedReview: Review) => {
    setReviews(prevReviews => 
      prevReviews.map(review => 
        (review.id === reviewId || review._id === reviewId) 
          ? {
              ...review,
              ...updatedReview,
              _id: review._id,
              timestamp: review.timestamp,
              likes: Array.isArray(updatedReview.likes) ? updatedReview.likes : review.likes,
              dislikes: Array.isArray(updatedReview.dislikes) ? updatedReview.dislikes : review.dislikes,
              comments: review.comments || []
            }
          : review
      )
    );
  };

  const handleNewReview = (newReview: Review) => {
    // Convert Review to ReviewWithUserInteraction format
    const userId = session?.user?.email || '';
    const formattedReview: ReviewWithUserInteraction = {
      ...newReview,
      _id: newReview._id || newReview.id || '',
      userId: newReview.userId || userId,
      likes: Array.isArray(newReview.likes) ? newReview.likes : [],
      dislikes: Array.isArray(newReview.dislikes) ? newReview.dislikes : [],
      hasLiked: false,
      hasDisliked: false,
      isAnonymous: newReview.isAnonymous || false,
      timestamp: newReview.timestamp || new Date().toISOString(),
      comments: newReview.comments || [],
      createdAt: typeof newReview.createdAt === 'string' ? newReview.createdAt : new Date().toISOString()
    };
    // Add the new review to the beginning of the list and refresh data
    setReviews(prev => [formattedReview, ...prev])
    // Refresh the course data to update stats
    if (courseId) {
      fetchCourseAndReviews()
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50 dark:from-slate-950 dark:via-indigo-950/50 dark:to-purple-950/30 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/10 dark:to-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-400/20 dark:from-pink-600/10 dark:to-rose-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 dark:from-blue-600/10 dark:to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]" />
      </div>
      
      <div className="container mx-auto py-8 px-4 space-y-8 relative z-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white p-8 shadow-lg">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">{courseId}</h1>
          <h2 className="text-2xl font-light opacity-90">{courseName}</h2>
          
          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5" />
                <span>Average Rating</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {(Object.entries(ratingData).reduce((acc, [rating, count]) => 
                  acc + (Number(rating) * count), 0) / 
                  Object.values(ratingData).reduce((acc, count) => acc + count, 0)
                ).toFixed(2)} / 5.0
              </p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span>Total Reviews</span>
              </div>
              <p className="text-2xl font-bold mt-2">{reviews.length}</p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ChartPie className="w-5 h-5" />
                <span>Grade Reports</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {Object.keys(gradeData).length} Grades
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
          <h3 className="text-xl font-semibold mb-6 text-purple-700 dark:text-purple-300">
            {content.ratingDistribution}
          </h3>
          <div className="h-[300px]">
            <RatingChart data={ratingData} />
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
          <h3 className="text-xl font-semibold mb-6 text-purple-700 dark:text-purple-300">
            {content.gradeDistribution}
          </h3>
          <div className="h-[300px]">
            <GradeDistribution reviews={reviews as unknown as Review[]} />
          </div>
        </Card>
      </div>

      {/* Reviews Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-purple-700 dark:text-purple-300">
            {content.reviews}
          </h3>
          {!isGoogleUser() && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600 rounded-full px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  {content.writeReview}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl w-full mx-2 sm:mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-lg sm:rounded-xl">
                <ReviewForm
                  courseId={courseId}
                  courseName={courseName}
                  onClose={() => {
                    const closeButton = document.querySelector('[aria-label="Close"]') as HTMLButtonElement
                    closeButton?.click()
                  }}
                  action={handleNewReview}
                  onSubmitSuccess={() => {
                    // Refresh course data after successful submission
                    if (courseId) {
                      fetchCourseAndReviews()
                    }
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review._id} className="transition-all duration-200">
                <ReviewCard
                  key={review._id}
                  review={review as unknown as Review & { isAnonymous?: boolean; timestamp: string; _id: string; userId: string }}
                  likeAction={handleLike}
                  dislikeAction={handleDislike}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  bookmarkAction={(id) => {/* ... */}}
                />
              </div>
            ))
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <p>No reviews yet. Be the first to review this course!</p>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  )
} 