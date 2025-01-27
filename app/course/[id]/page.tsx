"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Bookmark, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ReviewForm } from "@/components/review-form"
import { ReviewList } from "@/components/review-list"
import { GradeChart } from "@/components/grade-chart"
import { RatingChart } from "@/components/rating-chart"
import { useLanguage } from "@/providers/language-provider"
import { QAFormDialog } from "@/components/qa-form-dialog"

interface CourseData {
  id: string;
  name: string;
  stats: {
    averageRating: number;
    totalReviews: number;
    gradeDistribution: Record<string, number>;
    ratingDistribution: Record<number, number>;
  };
  reviews: Array<{
    id: string;
    courseId: string;
    courseName: string;
    rating: number;
    userName: string;
    review: string;
    timestamp: string;
    likes: number;
    dislikes: number;
    comments: string[];
    isBookmarked: boolean;
    readingAmount: number;
    contentDifficulty: number;
    teachingQuality: number;
    grade: string;
    major: string;
  }>;
}

export default function CourseDetail() {
  const params = useParams();
  const id = params?.id as string;
  const searchParams = useSearchParams();
  const reviewId = searchParams?.get('reviewId') || null;
  const [courseData, setCourseData] = useState<CourseData | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const { content } = useLanguage()
  const [isQADialogOpen, setIsQADialogOpen] = useState(false)
  const reviewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (id) {
      const fetchCourseData = async () => {
        try {
          const response = await fetch(`/api/courses/${id}`)
          if (!response.ok) {
            throw new Error('Failed to fetch course data')
          }
          const data = await response.json()
          setCourseData(data)
        } catch (error) {
          console.error('Error fetching course data:', error)
        }
      }
      fetchCourseData()
    }
  }, [id])

  useEffect(() => {
    if (reviewId && courseData) {
      setTimeout(() => {
        const element = document.getElementById(`review-${reviewId}`)
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
          element.classList.add('bg-secondary/50')
          setTimeout(() => {
            element.classList.remove('bg-secondary/50')
          }, 2000)
        }
      }, 100)
    }
  }, [reviewId, courseData])

  const handleQuestionSubmit = async (question: string) => {
    try {
      console.log("Question submitted:", question)
      // Optionally refresh the Q&A list here
    } catch (error) {
      console.error("Error handling question submission:", error)
    }
  }

  if (!courseData) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">
            {courseData === null ? 'Loading course data...' : 'Course not found'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-4xl font-bold font-mono">{courseData.id}</div>
            <div className="text-2xl text-muted-foreground">{courseData.name}</div>
            <div className="flex items-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < courseData.stats.averageRating
                      ? "fill-primary text-primary"
                      : "fill-muted text-muted-foreground"
                  }`}
                />
              ))}
              <span className="ml-2 text-2xl font-bold">
                {courseData.stats.averageRating.toFixed(1)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            <Bookmark
              className={`w-6 h-6 ${isBookmarked ? "fill-primary" : ""}`}
            />
          </Button>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="h-[300px]">
            <h3 className="text-lg font-semibold mb-4">{content.ratingDistribution}</h3>
            <RatingChart data={courseData.stats.ratingDistribution} />
          </div>
          <div className="h-[300px]">
            <h3 className="text-lg font-semibold mb-4">{content.gradeDistribution}</h3>
            <GradeChart data={courseData.stats.gradeDistribution} />
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{content.reviews}</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-[#90EE90] text-black hover:bg-[#7FDF7F]">
                  {content.writeReview}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ReviewForm 
                  courseId={courseData.id}
                  courseName={courseData.name}
                  action={(review) => {
                    // Handle the review submission
                    console.log(review)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          <div ref={reviewRef}>
            <ReviewList reviews={courseData.reviews} />
          </div>
        </div>

        {/* Add Ask Question Button */}
        <Button 
          onClick={() => setIsQADialogOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {content.askQuestion}
        </Button>

        {/* Q&A Form Dialog */}
        <QAFormDialog
          open={isQADialogOpen}
          action={setIsQADialogOpen}
          submitAction={handleQuestionSubmit}
        />
      </div>
    </div>
  )
}

