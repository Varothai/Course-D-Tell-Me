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

  const handleSubmit = async () => {
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
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={({ value }: SuggestionsFetchRequestedParams) => onSuggestionsFetchRequested({ value }, 'courseno')}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              getSuggestionValue={(suggestion: any) => suggestion.courseno}
              renderSuggestion={(suggestion: any) => <div>{suggestion.courseno}</div>}
              inputProps={inputPropsCourseNo}
              onSuggestionSelected={onCourseNoSuggestionSelected}
            />
          </div>
          <div>
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={({ value }: SuggestionsFetchRequestedParams) => onSuggestionsFetchRequested({ value }, 'title_short_en')}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              getSuggestionValue={(suggestion: any) => suggestion.title_short_en}
              renderSuggestion={(suggestion: any) => <div>{suggestion.title_short_en}</div>}
              inputProps={inputPropsCourseName}
              onSuggestionSelected={onCourseNameSuggestionSelected}
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

