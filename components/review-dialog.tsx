"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Star } from "lucide-react"
import { Review } from "@/types/review"
import { useLanguage } from "@/providers/language-provider"

interface ReviewDialogProps {
  review: Review
  open: boolean
  action: (open: boolean) => void
}

export function ReviewDialog({ review, open, action }: ReviewDialogProps) {
  const { content } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={action}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
          <DialogTitle>{content.yourReview}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Review Text */}
          <div className="bg-[#FFFAD7] rounded-lg p-6">
            <p className="whitespace-pre-wrap">{review.review}</p>
          </div>

          {/* Rating Stars */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((index) => (
                <Star
                  key={index}
                  className={`w-6 h-6 ${
                    index <= review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Course Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">{content.courseNo}</label>
              <p className="font-medium">{review.courseId}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{content.courseName}</label>
              <p className="font-medium">{review.courseName}</p>
            </div>
            {review.faculty && (
              <div>
                <label className="text-sm text-muted-foreground">{content.faculty}</label>
                <p className="font-medium">{review.faculty}</p>
              </div>
            )}
            {review.major && (
              <div>
                <label className="text-sm text-muted-foreground">{content.major}</label>
                <p className="font-medium">{review.major}</p>
              </div>
            )}
            {review.programType && (
              <div>
                <label className="text-sm text-muted-foreground">{content.programTypes}</label>
                <p className="font-medium">
                  {review.programType === 'normal' && content.normalProgram}
                  {review.programType === 'special' && content.specialProgram}
                  {review.programType === 'international' && content.internationalProgram}
                  {review.programType === 'bilingual' && content.bilingualProgram}
                  {review.programType === 'trilingual' && content.trilingualProgram}
                </p>
              </div>
            )}
            {review.section && (
              <div>
                <label className="text-sm text-muted-foreground">Sec</label>
                <p className="font-medium">{review.section}</p>
              </div>
            )}
            {review.electiveType && review.electiveType !== 'none' && (
              <div>
                <label className="text-sm text-muted-foreground">{content.electiveTypes}</label>
                <p className="font-medium">
                  {review.electiveType === 'free' ? content.freeElective : content.generalElective}
                </p>
              </div>
            )}
          </div>

          {/* Ratings */}
          <div className="space-y-4">
            {review.readingAmount !== undefined && (
              <div>
                <label className="text-sm text-muted-foreground">{content.homeworkAmount}</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div
                      key={value}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        value <= review.readingAmount! ? "bg-red-500 text-white" : "bg-gray-100"
                      }`}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {review.contentDifficulty !== undefined && (
              <div>
                <label className="text-sm text-muted-foreground">{content.contentInterest}</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div
                      key={value}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        value <= review.contentDifficulty! ? "bg-red-500 text-white" : "bg-gray-100"
                      }`}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {review.teachingQuality !== undefined && (
              <div>
                <label className="text-sm text-muted-foreground">{content.teachingQuality}</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div
                      key={value}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        value <= review.teachingQuality! ? "bg-green-500 text-white" : "bg-gray-100"
                      }`}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 