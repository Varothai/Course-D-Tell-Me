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

export default function CoursePage() {
  const params = useParams<{ id: string }>()
  const courseId = params?.id || ''
  const { content } = useLanguage()
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingData, setRatingData] = useState<Record<number, number>>({})
  const [gradeData, setGradeData] = useState<Record<string, number>>({})
  const [courseName, setCourseName] = useState("")
  const { data: session } = useSession()
  const isCMUUser = session?.user?.provider === 'cmu'

  useEffect(() => {
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
          // Filter reviews to ensure only this course's reviews are shown
          const courseReviews = data.reviews.filter((review: Review) => 
            review.courseId === courseId
          )
          setReviews(courseReviews)

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

    if (courseId) {
      fetchCourseAndReviews()
    }
  }, [courseId])

  function setShowReviewForm(arg0: boolean): void {
    throw new Error("Function not implemented.")
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
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
            <GradeDistribution reviews={reviews} />
          </div>
        </Card>
      </div>

      {/* Reviews Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-purple-700 dark:text-purple-300">
            {content.reviews}
          </h3>
        </div>

        <div className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="transform hover:scale-[1.02] transition-all duration-200">
                <ReviewCard
                  review={review}
                  likeAction={(id) => {/* ... */}}
                  dislikeAction={(id) => {/* ... */}}
                  commentAction={(id, comment) => {/* ... */}}
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
  )
} 