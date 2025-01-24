"use client"

import { useState } from "react"
import { Bookmark, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ReviewForm } from "@/components/review-form"
import { ReviewList } from "@/components/review-list"
import { GradeChart } from "@/components/grade-chart"
import { RatingChart } from "@/components/rating-chart"
import { useLanguage } from "@/providers/language-provider"
import { QAFormDialog } from "@/components/qa-form-dialog"

// Mock data
const courseData = {
  id: "271001",
  name: "CRITICAL THINKING",
  stats: {
    averageRating: 5,
    totalReviews: 50,
    gradeDistribution: {
      "A": 30,
      "B+": 10,
      "B": 5,
      "C+": 3,
      "C": 2,
    },
    ratingDistribution: {
      5: 30,
      4: 15,
      3: 3,
      2: 1,
      1: 1,
    }
  },
  reviews: [
    {
      id: "1",
      courseId: "271001",
      courseName: "CRITICAL THINKING",
      rating: 5,
      userName: "ผู้ใช้ 1",
      review: "เนื้อหาเข้าใจง่าย อาจารย์สอนดี...",
      timestamp: "25 ธ.ค. 2567 14:25 น.",
      likes: 10,
      dislikes: 0,
      comments: [],
      isBookmarked: false,
      readingAmount: 4,
      contentDifficulty: 3,
      teachingQuality: 5,
      grade: "A",
      major: "วิศวกรรมศาสตร์ (ISNE)"
    },
    // Add more reviews...
  ]
}

export default function CourseDetail() {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const { content } = useLanguage()
  const [isQADialogOpen, setIsQADialogOpen] = useState(false)

  const handleQuestionSubmit = async (question: string) => {
    try {
      console.log("Question submitted:", question)
      // Optionally refresh the Q&A list here
      // You could add the new question to local state or refetch all questions
    } catch (error) {
      console.error("Error handling question submission:", error)
    }
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
          <ReviewList reviews={courseData.reviews} />
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

