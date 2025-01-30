"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { RatingChart } from "@/components/rating-chart"
import { GradeChart } from "@/components/grade-chart"
import { ReviewCard } from "@/components/review-card"
import { useLanguage } from "@/providers/language-provider"
import type { Review } from "@/types/review"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ReviewForm } from "@/components/review-form"

export default function CoursePage() {
  const params = useParams<{ id: string }>()
  const courseId = params?.id || ''
  const { content } = useLanguage()
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingData, setRatingData] = useState<Record<number, number>>({})
  const [gradeData, setGradeData] = useState<Record<string, number>>({})
  const [courseName, setCourseName] = useState("")
  const [showReviewForm, setShowReviewForm] = useState(false)
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

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">{courseId}</h1>
        <h2 className="text-xl mb-6">{courseName}</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-[300px]">
            <h3 className="text-lg font-semibold mb-4">{content.ratingDistribution}</h3>
            <RatingChart data={ratingData} />
          </div>
          
          <div className="h-[300px]">
            <h3 className="text-lg font-semibold mb-4">{content.gradeDistribution}</h3>
            <GradeChart data={gradeData} />
          </div>
        </div>
      </Card>

      <h3 className="text-xl font-semibold mb-4">{content.reviews}</h3>
      <div>
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            likeAction={async (id) => {/* implement like action */}}
            dislikeAction={async (id) => {/* implement dislike action */}}
            commentAction={async (id, comment) => {/* implement comment action */}}
            bookmarkAction={async (id) => {/* implement bookmark action */}}
          />
        ))}
      </div>

      {isCMUUser && (
        <>
          <Button onClick={() => setShowReviewForm(true)}>
            {content.writeReview}
          </Button>

          {showReviewForm && (
            <ReviewForm
              courseId={courseId}
              courseName={courseName}
              action={(review) => {
                setReviews([...reviews, review])
                setShowReviewForm(false)
              }}
              onClose={() => setShowReviewForm(false)}
            />
          )}
        </>
      )}
    </div>
  )
} 