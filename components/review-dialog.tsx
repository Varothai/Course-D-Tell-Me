"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Star } from "lucide-react"
import { Review } from "@/types/review"
import { useLanguage } from "@/providers/language-provider"
import { facultyMajors } from "@/locales/content"

interface ReviewDialogProps {
  review: Review
  open: boolean
  action: (open: boolean) => void
}

export function ReviewDialog({ review, open, action }: ReviewDialogProps) {
  const { content, language } = useLanguage()

  const getFacultyLabel = (facultyValue: string) => {
    const faculty = content.faculties.find(f => f.value === facultyValue)
    return faculty?.label || facultyValue
  }

  const getMajorLabel = (facultyValue: string, majorValue: string) => {
    const faculty = facultyMajors[facultyValue as keyof typeof facultyMajors]
    const major = faculty?.find(m => m.value === majorValue)
    return major?.label[language as keyof typeof major.label] || majorValue
  }

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
                <p className="font-medium">{getFacultyLabel(review.faculty)}</p>
              </div>
            )}
            {review.major && (
              <div>
                <label className="text-sm text-muted-foreground">{content.major}</label>
                <p className="font-medium">
                  {getMajorLabel(review.faculty || '', review.major)}
                </p>
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
                  {[
                    { value: 1, emoji: "😟" },
                    { value: 2, emoji: "😕" },
                    { value: 3, emoji: "😐" },
                    { value: 4, emoji: "🙂" },
                    { value: 5, emoji: "😊" }
                  ].map((item) => (
                    <div
                      key={item.value}
                      className={`w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center ${
                        item.value === review.readingAmount ? "border-primary bg-primary text-white" : "bg-gray-50"
                      }`}
                    >
                      {item.emoji}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {review.contentDifficulty !== undefined && (
              <div>
                <label className="text-sm text-muted-foreground">{content.contentInterest}</label>
                <div className="flex gap-2 mt-1">
                  {[
                    { value: 1, emoji: "😟" },
                    { value: 2, emoji: "😕" },
                    { value: 3, emoji: "😐" },
                    { value: 4, emoji: "🙂" },
                    { value: 5, emoji: "😊" }
                  ].map((item) => (
                    <div
                      key={item.value}
                      className={`w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center ${
                        item.value === review.contentDifficulty ? "border-primary bg-primary text-white" : "bg-gray-50"
                      }`}
                    >
                      {item.emoji}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {review.teachingQuality !== undefined && (
              <div>
                <label className="text-sm text-muted-foreground">{content.teachingQuality}</label>
                <div className="flex gap-2 mt-1">
                  {[
                    { value: 1, emoji: "😟" },
                    { value: 2, emoji: "😕" },
                    { value: 3, emoji: "😐" },
                    { value: 4, emoji: "🙂" },
                    { value: 5, emoji: "😊" }
                  ].map((item) => (
                    <div
                      key={item.value}
                      className={`w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center ${
                        item.value === review.teachingQuality ? "border-primary bg-primary text-white" : "bg-gray-50"
                      }`}
                    >
                      {item.emoji}
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