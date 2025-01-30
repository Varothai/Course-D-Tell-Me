"use client"

import { useState, useEffect } from "react"
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
import Papa from "papaparse"
import Autosuggest from "react-autosuggest"
import { useProtectedAction } from '@/hooks/use-protected-action'
import { useSession } from "next-auth/react"
import { useAuth } from "@/contexts/auth-context"

interface ReviewFormProps {
  courseId: string
  courseName: string
  action: (review: any) => void
  onClose?: () => void
}

interface SuggestionsFetchRequestedParams {
  value: string;
}

interface ReviewFormData {
  courseId: string;
  courseName: string;
  userName: string;
  rating: number;
  review: string;
  faculty: string;
  major: string;
  studyPlan: string;
  section: string;
  programType: string;
  electiveType: string;
  readingAmount: number;
  contentDifficulty: number;
  teachingQuality: number;
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
    customMajor: "",
    studyPlan: "",
    section: "",
    grade: "",
    readingAmount: 0,
    contentDifficulty: 0,
    teachingQuality: 0,
    review: "",
    electiveType: "none",
  })
  const [availableMajors, setAvailableMajors] = useState<Array<{value: string, label: string}>>([])
  const [courses, setCourses] = useState<Array<{ courseno: string; title_short_en: string }>>([])
  const [suggestions, setSuggestions] = useState<Array<{ courseno: string; title_short_en: string }>>([])
  const handleProtectedAction = useProtectedAction()
  const { data: session } = useSession()
  const { setShowAuthModal } = useAuth()

  useEffect(() => {
    if (!session) {
      setShowAuthModal(true)
      onClose?.()
    }
  }, [session, setShowAuthModal, onClose])

  if (!session) {
    return null
  }

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/courses/courses.csv");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const parsedData = Papa.parse(csvText, {
          header: true,
          dynamicTyping: false,
        });
        const coursesData = parsedData.data.map((course: any) => ({
          courseno: String(course.courseno),
          title_short_en: course.title_short_en,
        }));
        setCourses(coursesData as Array<{ courseno: string; title_short_en: string }>);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  const getSuggestions = (value: string, field: 'courseno' | 'title_short_en') => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? [] : courses.filter(course => {
      const fieldValue = String(course[field]);
      return fieldValue.toLowerCase().slice(0, inputLength) === inputValue;
    });
  }

  const onSuggestionsFetchRequested = (
    { value }: SuggestionsFetchRequestedParams,
    field: 'courseno' | 'title_short_en'
  ) => {
    setSuggestions(getSuggestions(value, field))
  }

  const onSuggestionsClearRequested = () => {
    setSuggestions([])
  }

  const onCourseNoChange = (event: any, { newValue }: { newValue: string }) => {
    setFormData({ ...formData, courseNo: newValue })
    const matchedCourse = courses.find(course => course.courseno === newValue)
    if (matchedCourse) {
      setFormData({ ...formData, courseName: matchedCourse.title_short_en })
    }
  }

  const onCourseNameChange = (event: any, { newValue }: { newValue: string }) => {
    setFormData({ ...formData, courseName: newValue })
    const matchedCourse = courses.find(course => course.title_short_en === newValue)
    if (matchedCourse) {
      setFormData({ ...formData, courseNo: matchedCourse.courseno })
    }
  }

  const onCourseNoSuggestionSelected = (event: any, { suggestion }: { suggestion: { courseno: string; title_short_en: string } }) => {
    setFormData({ ...formData, courseNo: suggestion.courseno, courseName: suggestion.title_short_en });
  }

  const onCourseNameSuggestionSelected = (event: any, { suggestion }: { suggestion: { courseno: string; title_short_en: string } }) => {
    setFormData({ ...formData, courseName: suggestion.title_short_en, courseNo: suggestion.courseno });
  }

  const inputPropsCourseNo = {
    placeholder: "Enter Course ID",
    value: formData.courseNo,
    onChange: onCourseNoChange,
    pattern: "\\d{6}", // Regex pattern to allow only 6 digit numbers
    title: "Course ID must be a 6 digit number",
    maxLength: 6, // Limit input to 6 characters
  }

  const inputPropsCourseName = {
    placeholder: "Enter Course Name",
    value: formData.courseName,
    onChange: onCourseNameChange,
  }

  const handleFacultyChange = (value: string) => {
    setFormData({ ...formData, faculty: value, major: "", customMajor: "" })
    const majors = facultyMajors[value as keyof typeof facultyMajors] || []
    setAvailableMajors(majors.map(m => ({
      value: m.value,
      label: m.label[language as keyof typeof m.label]
    })))
  }

  const handleMajorChange = (value: string) => {
    setFormData({ ...formData, major: value, customMajor: value === "Others" ? formData.customMajor : "" })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleProtectedAction(async () => {
      try {
        const review = {
          courseId: formData.courseNo,
          courseName: formData.courseName,
          userName: "User",
          rating,
          review: formData.review,
          faculty: formData.faculty,
          major: formData.major === "Others" ? formData.customMajor : formData.major,
          studyPlan: formData.studyPlan,
          section: formData.section,
          readingAmount: formData.readingAmount,
          contentDifficulty: formData.contentDifficulty,
          teachingQuality: formData.teachingQuality,
          programType: formData.studyPlan,
          electiveType: formData.electiveType,
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
    })
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto px-4 -mx-4">
      <div className="space-y-8">
        <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 opacity-50">
            <img
              src="/elephant-mascot.png"
              alt="Cute elephant mascot"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            {content.writing}
          </h2>
          <Textarea
            placeholder={content.yourReview}
            value={formData.review}
            onChange={(e) => setFormData({ ...formData, review: e.target.value })}
            className="min-h-[150px] bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 resize-none transition-all duration-300"
          />
        </div>

        <div className="flex items-center gap-4 bg-white/80 dark:bg-gray-800/80 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((index) => (
              <Star
                key={index}
                className={`w-8 h-8 cursor-pointer transition-all duration-300 transform hover:scale-110 ${
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
          <span className="text-lg text-purple-700 dark:text-purple-300 font-medium">
            {content.ratingStar}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={({ value }: SuggestionsFetchRequestedParams) => onSuggestionsFetchRequested({ value }, 'courseno')}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              getSuggestionValue={(suggestion: any) => suggestion.courseno}
              renderSuggestion={(suggestion: any) => <div>{suggestion.courseno}</div>}
              inputProps={inputPropsCourseNo}
              onSuggestionSelected={onCourseNoSuggestionSelected}
              theme={{
                container: 'relative',
                input: 'w-full px-4 py-2 rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 transition-all duration-300',
                suggestionsList: 'absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-h-60 overflow-auto',
                suggestion: 'px-4 py-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50',
                suggestionHighlighted: 'bg-purple-100 dark:bg-purple-800/50'
              }}
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={({ value }: SuggestionsFetchRequestedParams) => onSuggestionsFetchRequested({ value }, 'title_short_en')}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              getSuggestionValue={(suggestion: any) => suggestion.title_short_en}
              renderSuggestion={(suggestion: any) => <div>{suggestion.title_short_en}</div>}
              inputProps={inputPropsCourseName}
              onSuggestionSelected={onCourseNameSuggestionSelected}
              theme={{
                container: 'relative',
                input: 'w-full px-4 py-2 rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 transition-all duration-300',
                suggestionsList: 'absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-h-60 overflow-auto',
                suggestion: 'px-4 py-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50',
                suggestionHighlighted: 'bg-purple-100 dark:bg-purple-800/50'
              }}
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
              onValueChange={handleMajorChange}
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
            {formData.major === "Others" && (
              <Input
                type="text"
                value={formData.customMajor}
                onChange={(e) => setFormData({ ...formData, customMajor: e.target.value })}
                placeholder={content.majorSelection.placeholder}
                className="mt-2 bg-[#FFFAD7]"
              />
            )}
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
              type="text"
              placeholder="Sec"
              value={formData.section}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) {
                  setFormData({ ...formData, section: value });
                }
              }}
              className="bg-[#FFFAD7]"
            />
          </div>
          <div>
            <Label className="block mb-2">{content.electiveTypes}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className={`flex-1 ${
                  formData.electiveType === "free" 
                    ? "bg-primary text-primary-foreground" 
                    : ""
                }`}
                onClick={() => setFormData(prev => ({
                  ...prev,
                  electiveType: prev.electiveType === "free" ? "none" : "free"
                }))}
              >
                {content.freeElective}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={`flex-1 ${
                  formData.electiveType === "general" 
                    ? "bg-primary text-primary-foreground" 
                    : ""
                }`}
                onClick={() => setFormData(prev => ({
                  ...prev,
                  electiveType: prev.electiveType === "general" ? "none" : "general"
                }))}
              >
                {content.generalElective}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 backdrop-blur-sm">
            <Label className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-4 block">
              {content.homeworkAmount}
            </Label>
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                {[
                  { value: 1, emoji: "😟" },
                  { value: 2, emoji: "😕" },
                  { value: 3, emoji: "😐" },
                  { value: 4, emoji: "🙂" },
                  { value: 5, emoji: "😊" }
                ].map((item) => (
                  <Button
                    key={item.value}
                    variant="outline"
                    size="lg"
                    className={`w-12 h-12 rounded-full transform transition-all duration-300 hover:scale-110 ${
                      formData.readingAmount === item.value 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white shadow-lg" 
                        : "border-2 border-purple-200 dark:border-purple-800 hover:border-purple-500"
                    }`}
                    onClick={() => setFormData({ ...formData, readingAmount: item.value })}
                  >
                    <span className="text-xl">{item.emoji}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 backdrop-blur-sm">
            <Label className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-4 block">
              {content.contentInterest}
            </Label>
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                {[
                  { value: 1, emoji: "😟" },
                  { value: 2, emoji: "😕" },
                  { value: 3, emoji: "😐" },
                  { value: 4, emoji: "🙂" },
                  { value: 5, emoji: "😊" }
                ].map((item) => (
                  <Button
                    key={item.value}
                    variant="outline"
                    size="lg"
                    className={`w-12 h-12 rounded-full transform transition-all duration-300 hover:scale-110 ${
                      formData.contentDifficulty === item.value 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white shadow-lg" 
                        : "border-2 border-purple-200 dark:border-purple-800 hover:border-purple-500"
                    }`}
                    onClick={() => setFormData({ ...formData, contentDifficulty: item.value })}
                  >
                    <span className="text-xl">{item.emoji}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 backdrop-blur-sm">
            <Label className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-4 block">
              {content.teachingQuality}
            </Label>
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                {[
                  { value: 1, emoji: "😟" },
                  { value: 2, emoji: "😕" },
                  { value: 3, emoji: "😐" },
                  { value: 4, emoji: "🙂" },
                  { value: 5, emoji: "😊" }
                ].map((item) => (
                  <Button
                    key={item.value}
                    variant="outline"
                    size="lg"
                    className={`w-12 h-12 rounded-full transform transition-all duration-300 hover:scale-110 ${
                      formData.teachingQuality === item.value 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white shadow-lg" 
                        : "border-2 border-purple-200 dark:border-purple-800 hover:border-purple-500"
                    }`}
                    onClick={() => setFormData({ ...formData, teachingQuality: item.value })}
                  >
                    <span className="text-xl">{item.emoji}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 backdrop-blur-sm">
          <Label className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-4 block">
            {content.grade} 
            <span className="text-sm text-muted-foreground ml-2">
              (optional) *** {language === "en" ? "does not show when posting" : "ไม่แสดงตอนโพสต์"} ***
            </span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {["A", "B+", "B", "C+", "C", "D+", "D", "F"].map((grade) => (
              <Button
                key={grade}
                variant="outline"
                size="sm"
                className={`rounded-xl transition-all duration-300 hover:scale-105 ${
                  formData.grade === grade 
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-none" 
                    : "border-2 border-purple-200 dark:border-purple-800"
                }`}
                onClick={() => setFormData({ ...formData, grade })}
              >
                {grade}
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-purple-200 dark:border-purple-800 text-purple-600 focus:ring-purple-500"
            />
            <Label className="text-red-500 font-medium">
              {content.verifyContent}
            </Label>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white rounded-xl py-6 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            disabled={!verified || !rating}
            onClick={handleSubmit}
          >
            {content.post}
          </Button>
        </div>
      </div>
    </div>
  )
}

