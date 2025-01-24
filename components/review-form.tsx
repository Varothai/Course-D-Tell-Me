"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/providers/language-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useReviews } from "@/providers/review-provider"
import { Review } from "@/types/review"
import { facultyMajors } from "@/locales/content"

interface ReviewFormProps {
  courseId: string
  courseName: string
  action: (review: any) => void
  onClose?: () => void
}

export function ReviewForm({ courseId, courseName, action, onClose }: ReviewFormProps) {
  const { content, language } = useLanguage()
  const { addReview } = useReviews()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [verified, setVerified] = useState(false)
  const [formData, setFormData] = useState({
    courseNo: courseId,
    courseName: courseName,
    faculty: "",
    major: "",
    studyPlan: "",
    section: "",
    grade: "",
    readingAmount: 0,
    contentDifficulty: 0,
    teachingQuality: 0,
    review: "",
  })
  const [availableMajors, setAvailableMajors] = useState<Array<{value: string, label: string}>>([])

  const handleFacultyChange = (value: string) => {
    setFormData({ ...formData, faculty: value, major: "" })
    const majors = facultyMajors[value as keyof typeof facultyMajors] || []
    setAvailableMajors(majors.map(m => ({
      value: m.value,
      label: m.label[language as keyof typeof m.label]
    })))
  }

  const handleSubmit = async () => {
    try {
      const review = {
        courseId: formData.courseNo,
        courseName: formData.courseName,
        userName: "User",
        rating,
        review: formData.review,
        faculty: formData.faculty,
        major: formData.major,
        studyPlan: formData.studyPlan,
        section: formData.section,
        readingAmount: formData.readingAmount,
        contentDifficulty: formData.contentDifficulty,
        teachingQuality: formData.teachingQuality,
      }
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(review),
      })

      if (response.ok) {
        addReview(review)
        action(review)
        onClose?.()
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    }
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto px-4 -mx-4">
      <div className="space-y-6">
        <div className="bg-[#FFFAD7] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{content.writing}</h2>
          <Textarea
            placeholder={content.yourReview}
            value={formData.review}
            onChange={(e) => setFormData({ ...formData, review: e.target.value })}
            className="min-h-[150px] bg-transparent border-none resize-none focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((index) => (
              <Star
                key={index}
                className={`w-8 h-8 cursor-pointer ${
                  index <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                }`}
                onMouseEnter={() => setHoverRating(index)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(index)}
              />
            ))}
          </div>
          <span className="text-lg">{content.ratingStar}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              placeholder={content.courseNo}
              value={formData.courseNo}
              onChange={(e) => setFormData({ ...formData, courseNo: e.target.value })}
              className="bg-[#FFFAD7]"
            />
          </div>
          <div>
            <Input
              placeholder={content.courseName}
              value={formData.courseName}
              onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
              className="bg-[#FFFAD7]"
            />
          </div>
          <div>
            <Select
              value={formData.faculty}
              onValueChange={handleFacultyChange}
            >
              <SelectTrigger className="bg-[#FFFAD7]">
                <SelectValue placeholder={content.faculty} />
              </SelectTrigger>
              <SelectContent>
                {content.faculties.map((faculty) => (
                  <SelectItem key={faculty.value} value={faculty.value}>
                    {faculty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={formData.major}
              onValueChange={(value) => setFormData({ ...formData, major: value })}
              disabled={!formData.faculty}
            >
              <SelectTrigger className="bg-[#FFFAD7]">
                <SelectValue placeholder={content.major} />
              </SelectTrigger>
              <SelectContent>
                {availableMajors.map((major) => (
                  <SelectItem key={major.value} value={major.value}>
                    {major.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={formData.studyPlan}
              onValueChange={(value) => setFormData({ ...formData, studyPlan: value })}
            >
              <SelectTrigger className="bg-[#FFFAD7]">
                <SelectValue placeholder={content.programTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{content.normalProgram}</SelectItem>
                <SelectItem value="special">{content.specialProgram}</SelectItem>
                <SelectItem value="international">{content.internationalProgram}</SelectItem>
                <SelectItem value="bilingual">{content.bilingualProgram}</SelectItem>
                <SelectItem value="trilingual">{content.trilingualProgram}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              placeholder="Sec"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="bg-[#FFFAD7]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>{content.homeworkAmount}</Label>
            <div className="flex gap-2 mt-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  className={`rounded-full w-8 h-8 p-0 ${
                    formData.readingAmount === value ? "bg-red-500 text-white" : ""
                  }`}
                  onClick={() => setFormData({ ...formData, readingAmount: value })}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>{content.contentInterest}</Label>
            <div className="flex gap-2 mt-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  className={`rounded-full w-8 h-8 p-0 ${
                    formData.contentDifficulty === value ? "bg-red-500 text-white" : ""
                  }`}
                  onClick={() => setFormData({ ...formData, contentDifficulty: value })}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>{content.teachingQuality}</Label>
            <div className="flex gap-2 mt-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  className={`rounded-full w-8 h-8 p-0 ${
                    formData.teachingQuality === value ? "bg-green-500 text-white" : ""
                  }`}
                  onClick={() => setFormData({ ...formData, teachingQuality: value })}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label>
            {content.grade} (optional) *** {language === "en" ? "does not show when posting" : "ไม่แสดงตอนโพสต์"} ***
          </Label>
          <div className="flex gap-2 mt-2">
            {["A", "B+", "B", "C+", "C", "D+", "D", "F"].map((grade) => (
              <Button
                key={grade}
                variant="outline"
                size="sm"
                className={`${
                  formData.grade === grade ? "bg-yellow-200" : ""
                }`}
                onClick={() => setFormData({ ...formData, grade })}
              >
                {grade}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RadioGroup defaultValue="show">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="show" id="show" />
              <Label htmlFor="show">{content.showIdentity}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hide" id="hide" />
              <Label htmlFor="hide">{content.hideIdentity}</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
            className="rounded"
          />
          <Label className="text-sm text-red-500">
            {content.verifyContent}
          </Label>
        </div>

        <Button 
          className="w-full bg-green-500 hover:bg-green-600 text-white"
          disabled={!verified || !rating}
          onClick={handleSubmit}
        >
          {content.post}
        </Button>
      </div>
    </div>
  )
}

