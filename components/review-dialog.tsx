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
      <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900/50 mx-2 sm:mx-auto">
        <DialogHeader className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 pb-3 sm:pb-4 rounded-xl mb-4 sm:mb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {content.yourReview}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-8 px-1 sm:px-2">
          {/* Mascot and Review Text */}
          <div className="relative bg-white/90 dark:bg-gray-800/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-sm border-2 border-purple-100 dark:border-purple-800">
            <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-16 h-16 sm:w-20 sm:h-20">
              <img
                src="/elephant-mascot.png"
                alt="Cute elephant mascot"
                className="w-full h-full object-contain animate-bounce-gentle"
              />
            </div>
            <p className="whitespace-pre-wrap text-sm sm:text-lg leading-relaxed">
              {review.review}
            </p>
          </div>

          {/* Rating Stars */}
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm flex items-center gap-3 sm:gap-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((index) => (
                <Star
                  key={index}
                  className={`w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-300 ${
                    index <= review.rating
                      ? "fill-yellow-400 text-yellow-400 scale-110"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-base sm:text-lg font-medium bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              {review.rating}/5
            </span>
          </div>

          {/* Course Details */}
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            <div className="col-span-1 sm:col-span-2">
              <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 sm:mb-4">
                Course Information
              </h3>
            </div>
            {[
              { label: content.courseNo, value: review.courseId },
              { label: content.courseName, value: review.courseName },
              { label: content.faculty, value: review.faculty && getFacultyLabel(review.faculty) },
              { label: content.major, value: review.major && getMajorLabel(review.faculty || '', review.major) },
              { label: content.programTypes, value: review.programType && {
                'normal': content.normalProgram,
                'special': content.specialProgram,
                'international': content.internationalProgram,
                'bilingual': content.bilingualProgram,
                'trilingual': content.trilingualProgram
              }[review.programType] },
              { label: 'Sec', value: review.section },
              { label: content.electiveTypes, value: review.electiveType && review.electiveType !== 'none' && 
                (review.electiveType === 'free' ? content.freeElective : content.generalElective) }
            ].filter(item => item.value).map((item, index) => (
              <div key={index} className="bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-3 sm:p-4">
                <label className="text-xs sm:text-sm text-purple-600 dark:text-purple-300 block mb-1">
                  {item.label}
                </label>
                <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Ratings with Emojis */}
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ratings
            </h3>
            {[
              { label: content.homeworkAmount, value: review.readingAmount },
              { label: content.contentInterest, value: review.contentDifficulty },
              { label: content.teachingQuality, value: review.teachingQuality }
            ].filter(item => item.value !== undefined).map((item, index) => (
              <div key={index} className="bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-3 sm:p-4">
                <label className="text-xs sm:text-sm text-purple-600 dark:text-purple-300 block mb-2 sm:mb-3">
                  {item.label}
                </label>
                <div className="flex gap-2 sm:gap-4">
                  {[
                    { value: 1, emoji: "😟" },
                    { value: 2, emoji: "😕" },
                    { value: 3, emoji: "😐" },
                    { value: 4, emoji: "🙂" },
                    { value: 5, emoji: "😊" }
                  ].map((emoji) => (
                    <div
                      key={emoji.value}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        emoji.value === item.value 
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 transform scale-110 shadow-lg" 
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <span className="text-base sm:text-xl">{emoji.emoji}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 