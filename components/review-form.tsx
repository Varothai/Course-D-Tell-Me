"use client"

import React, { useState, useEffect } from "react"
import { Star, Loader2, ChevronUp, ChevronDown, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/providers/language-provider"
import * as SelectPrimitive from "@radix-ui/react-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useReviews } from "@/providers/review-provider"
import { Review } from "@/types/review"
import { facultyMajors } from "@/locales/content"
import Papa from "papaparse"
import Autosuggest from "react-autosuggest"
import { useProtectedAction } from '@/hooks/use-protected-action'
import { useSession } from "next-auth/react"
import { useAuth } from "@/contexts/auth-context"
import { Switch } from "@/components/ui/switch"
import { analyzeText } from '@/utils/text-analysis'
import { toast } from "@/components/ui/use-toast"

interface ReviewFormProps {
  courseId?: string
  courseName?: string
  action?: (review: any) => void
  onClose?: () => void
  initialData?: Review
  isEditing?: boolean
  onEditComplete?: (review: Review) => void
  onCancel?: () => void
  onSubmitSuccess?: () => void
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
  grade?: string;
}

// Custom SelectContent without Portal for faculty dropdown (works like in Modal, avoids Dialog Portal issues)
const FacultySelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Content
    ref={ref}
    className={cn(
      "z-[200] max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    position="item-aligned"
    onPointerDownOutside={(e) => {
      // Prevent closing when clicking on other Select triggers
      const target = e.target as HTMLElement
      const clickedSelectTrigger = target.closest('button[role="combobox"]')
      if (clickedSelectTrigger) {
        e.preventDefault()
      }
    }}
    {...props}
  >
    <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
    <SelectPrimitive.Viewport className="p-1">
      {children}
    </SelectPrimitive.Viewport>
    <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  </SelectPrimitive.Content>
))
FacultySelectContent.displayName = SelectPrimitive.Content.displayName

export function ReviewForm({ 
  courseId, 
  courseName, 
  action, 
  onClose,
  initialData,
  isEditing,
  onEditComplete,
  onCancel,
  onSubmitSuccess,
}: ReviewFormProps) {
  const { content, language } = useLanguage()
  const { addReview } = useReviews()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [verified, setVerified] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [formData, setFormData] = useState({
    courseNo: courseId || "",
    courseName: courseName || "",
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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<{
    isInappropriate: boolean;
    confidence: number;
    severity: 'low' | 'medium' | 'high';
    inappropriateWords: string[];
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{
    improvements: string[];
    suggestions: string[];
    completeness: {
      missing: string[];
      score: number;
    };
  } | null>(null)
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false)
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)

  // Note: Auth check is now handled at the button level, so this effect is no longer needed
  // The dialog will only open if the user is authenticated

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

  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        courseNo: initialData.courseId,
        courseName: initialData.courseName,
        faculty: initialData.faculty,
        major: initialData.major,
        studyPlan: initialData.studyPlan,
        section: initialData.section,
        grade: initialData.grade || "",
        readingAmount: initialData.readingAmount,
        contentDifficulty: initialData.contentDifficulty,
        teachingQuality: initialData.teachingQuality,
        review: initialData.review,
        electiveType: initialData.electiveType,
        customMajor: "",
      })
      setRating(initialData.rating)
      
      // Populate majors when editing with a faculty
      if (initialData.faculty) {
        const majors = facultyMajors[initialData.faculty as keyof typeof facultyMajors] || []
        setAvailableMajors(majors.map(m => ({
          value: m.value,
          label: m.label[language as keyof typeof m.label]
        })))
      }
    }
  }, [initialData, isEditing, language])

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

  const handleGetAiSuggestions = async () => {
    if (!formData.review.trim()) {
      toast({
        title: "No review text",
        description: "Please write some review content first",
        variant: "destructive"
      })
      return
    }

    setIsLoadingAiSuggestions(true)
    try {
      const response = await fetch('/api/ai/review-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentReview: formData.review,
          courseName: formData.courseName,
          courseId: formData.courseNo,
          rating
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAiSuggestions(data.suggestions)
          setShowAiSuggestions(true)
        }
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error)
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingAiSuggestions(false)
    }
  }

  const handleSubmit = async () => {
    if (!verified || !rating) return
    
    setIsSubmitting(true)
    setIsAnalyzing(true)
    
    try {
      const analysis = await analyzeText(formData.review)
      
      if (analysis.isInappropriate) {
        setAnalysisResult(analysis)
        setIsAnalyzing(false)
        return
      }
      
      setAnalysisResult(null)
      
      const reviewData = {
        courseId: formData.courseNo,
        courseName: formData.courseName,
        userName: isAnonymous ? "Anonymous" : session?.user?.name || "User",
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
        isAnonymous,
        grade: formData.grade || undefined,
        timestamp: new Date().toISOString(),
      }

      if (isEditing && initialData) {
        const response = await fetch(`/api/reviews/${initialData._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reviewData),
        })

        if (!response.ok) {
          throw new Error('Failed to update review')
        }

        const data = await response.json()
        if (data.success) {
          onEditComplete?.(data.review)
          toast({
            title: "Success",
            description: "Review updated successfully",
          })
        }
      } else {
        const response = await fetch('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reviewData),
        })

        if (response.ok) {
          const { review: newReview } = await response.json()
          
          // Clear the form
          setFormData({
            courseNo: "",
            courseName: "",
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
          setRating(0)

          // Update UI and show success message
          action?.(newReview)
          toast({
            title: "Success!",
            description: "Your review has been posted",
            duration: 3000,
          })

          // Close form and trigger success callback
          onClose?.()
          onSubmitSuccess?.()
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to save review. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`overflow-y-auto ${isEditing ? 'max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)]' : ''}`}>
      <div className={`space-y-4 sm:space-y-6 ${isEditing ? 'pb-4' : ''}`}>
        <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 opacity-50 pointer-events-none">
            <img
              src="/elephant-mascot.png"
              alt="Cute elephant mascot"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
            <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent pr-2">
              {content.writing}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetAiSuggestions}
              disabled={isLoadingAiSuggestions || !formData.review.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-none relative z-20 mr-16 sm:mr-20 flex-shrink-0"
            >
              {isLoadingAiSuggestions ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">AI Assistant</span>
                </>
              )}
            </Button>
          </div>
          <Textarea
            placeholder={content.yourReview}
            value={formData.review}
            onChange={(e) => setFormData({ ...formData, review: e.target.value })}
            className="min-h-[120px] sm:min-h-[150px] bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 resize-none transition-all duration-300 text-sm sm:text-base"
          />
          
          {/* AI Suggestions Panel */}
          {showAiSuggestions && aiSuggestions && (
            <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI Suggestions</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAiSuggestions(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Completeness Score */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Review Completeness</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{aiSuggestions.completeness.score}%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${aiSuggestions.completeness.score}%` }}
                  />
                </div>
              </div>

              {/* Missing Items */}
              {aiSuggestions.completeness.missing.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Consider Adding:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {aiSuggestions.completeness.missing.map((item, idx) => (
                      <li key={idx} className="text-sm text-blue-800 dark:text-blue-200">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {aiSuggestions.improvements.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-2">Improvements:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {aiSuggestions.improvements.map((item, idx) => (
                      <li key={idx} className="text-sm text-orange-800 dark:text-orange-200">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {aiSuggestions.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">Tips:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {aiSuggestions.suggestions.map((item, idx) => (
                      <li key={idx} className="text-sm text-green-800 dark:text-green-200">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4 bg-white/80 dark:bg-gray-800/80 p-3 sm:p-4 rounded-lg sm:rounded-xl backdrop-blur-sm">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((index) => (
              <Star
                key={index}
                className={`w-6 h-6 sm:w-8 sm:h-8 cursor-pointer transition-all duration-300 transform hover:scale-110 ${
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
          <span className="text-sm sm:text-lg text-purple-700 dark:text-purple-300 font-medium">
            {content.ratingStar}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={({ value }: SuggestionsFetchRequestedParams) => onSuggestionsFetchRequested({ value }, 'courseno')}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              getSuggestionValue={(suggestion: any) => suggestion.courseno}
              renderSuggestion={(suggestion: any) => <div className="text-sm">{suggestion.courseno}</div>}
              inputProps={inputPropsCourseNo}
              onSuggestionSelected={onCourseNoSuggestionSelected}
              theme={{
                container: 'relative',
                input: 'w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 text-sm sm:text-base',
                suggestionsList: 'absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg max-h-48 sm:max-h-60 overflow-auto',
                suggestion: 'px-3 sm:px-4 py-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50 text-sm',
                suggestionHighlighted: 'bg-purple-100 dark:bg-purple-800/50'
              }}
            />
          </div>
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={({ value }: SuggestionsFetchRequestedParams) => onSuggestionsFetchRequested({ value }, 'title_short_en')}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              getSuggestionValue={(suggestion: any) => suggestion.title_short_en}
              renderSuggestion={(suggestion: any) => <div className="text-sm">{suggestion.title_short_en}</div>}
              inputProps={inputPropsCourseName}
              onSuggestionSelected={onCourseNameSuggestionSelected}
              theme={{
                container: 'relative',
                input: 'w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 text-sm sm:text-base',
                suggestionsList: 'absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg max-h-48 sm:max-h-60 overflow-auto',
                suggestion: 'px-3 sm:px-4 py-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50 text-sm',
                suggestionHighlighted: 'bg-purple-100 dark:bg-purple-800/50'
              }}
            />
          </div>
          <div>
            <Select
              value={formData.faculty}
              onValueChange={handleFacultyChange}
            >
              <SelectTrigger className="w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 text-sm sm:text-base h-10 sm:h-10">
                <SelectValue placeholder={content.faculty} />
              </SelectTrigger>
              <FacultySelectContent className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-800 rounded-lg sm:rounded-xl z-[200]">
                {content.faculties.map((faculty) => (
                  <SelectItem key={faculty.value} value={faculty.value} className="text-sm cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50">
                    {faculty.label}
                  </SelectItem>
                ))}
              </FacultySelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={formData.major}
              onValueChange={handleMajorChange}
              disabled={!formData.faculty}
            >
              <SelectTrigger className="w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 text-sm sm:text-base h-10 sm:h-10 disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue placeholder={content.major} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-800 rounded-lg sm:rounded-xl z-[110]">
                {availableMajors.length > 0 ? (
                  availableMajors.map((major) => (
                    <SelectItem key={major.value} value={major.value} className="text-sm cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50">
                      {major.label}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {formData.faculty ? content.major : "Select faculty first"}
                  </div>
                )}
              </SelectContent>
            </Select>
            {formData.major === "Others" && (
              <Input
                type="text"
                value={formData.customMajor}
                onChange={(e) => setFormData({ ...formData, customMajor: e.target.value })}
                placeholder={content.majorSelection.placeholder}
                className="mt-2 w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 text-sm sm:text-base h-10"
              />
            )}
          </div>
          <div>
            <Select
              value={formData.studyPlan}
              onValueChange={(value) => setFormData({ ...formData, studyPlan: value })}
            >
              <SelectTrigger className="w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 text-sm sm:text-base h-10 sm:h-10">
                <SelectValue placeholder={content.programTypes} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-800 rounded-lg sm:rounded-xl z-[110]">
                <SelectItem value="normal" className="text-sm cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50">{content.normalProgram}</SelectItem>
                <SelectItem value="special" className="text-sm cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50">{content.specialProgram}</SelectItem>
                <SelectItem value="international" className="text-sm cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50">{content.internationalProgram}</SelectItem>
                <SelectItem value="bilingual" className="text-sm cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50">{content.bilingualProgram}</SelectItem>
                <SelectItem value="trilingual" className="text-sm cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50">{content.trilingualProgram}</SelectItem>
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
              className="w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 text-sm sm:text-base h-10"
            />
          </div>
          <div>
            <Label className="block mb-2 text-sm sm:text-base">{content.electiveTypes}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className={`flex-1 h-10 text-sm sm:text-base ${
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
                className={`flex-1 h-10 text-sm sm:text-base ${
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
              <Button
                type="button"
                variant="outline"
                className={`flex-1 h-10 text-sm sm:text-base ${
                  formData.electiveType === "major" 
                    ? "bg-primary text-primary-foreground" 
                    : ""
                }`}
                onClick={() => setFormData(prev => ({
                  ...prev,
                  electiveType: prev.electiveType === "major" ? "none" : "major"
                }))}
              >
                {content.majorElective}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-1">
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <Label className="text-base sm:text-lg font-medium text-purple-700 dark:text-purple-300 mb-3 sm:mb-4 block">
              {content.homeworkAmount}
            </Label>
            <div className="flex justify-between items-center">
              <div className="flex gap-2 sm:gap-4">
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
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full transform transition-all duration-300 hover:scale-110 ${
                      formData.readingAmount === item.value 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white shadow-lg" 
                        : "border-2 border-purple-200 dark:border-purple-800 hover:border-purple-500"
                    }`}
                    onClick={() => setFormData({ ...formData, readingAmount: item.value })}
                  >
                    <span className="text-lg sm:text-xl">{item.emoji}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <Label className="text-base sm:text-lg font-medium text-purple-700 dark:text-purple-300 mb-3 sm:mb-4 block">
              {content.contentInterest}
            </Label>
            <div className="flex justify-between items-center">
              <div className="flex gap-2 sm:gap-4">
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
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full transform transition-all duration-300 hover:scale-110 ${
                      formData.contentDifficulty === item.value 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white shadow-lg" 
                        : "border-2 border-purple-200 dark:border-purple-800 hover:border-purple-500"
                    }`}
                    onClick={() => setFormData({ ...formData, contentDifficulty: item.value })}
                  >
                    <span className="text-lg sm:text-xl">{item.emoji}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <Label className="text-base sm:text-lg font-medium text-purple-700 dark:text-purple-300 mb-3 sm:mb-4 block">
              {content.teachingQuality}
            </Label>
            <div className="flex justify-between items-center">
              <div className="flex gap-2 sm:gap-4">
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
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full transform transition-all duration-300 hover:scale-110 ${
                      formData.teachingQuality === item.value 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white shadow-lg" 
                        : "border-2 border-purple-200 dark:border-purple-800 hover:border-purple-500"
                    }`}
                    onClick={() => setFormData({ ...formData, teachingQuality: item.value })}
                  >
                    <span className="text-lg sm:text-xl">{item.emoji}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <Label className="text-base sm:text-lg font-medium text-purple-700 dark:text-purple-300 mb-3 sm:mb-4 block">
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
                className={`h-9 sm:h-9 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base ${
                  formData.grade === grade 
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-none" 
                    : "border-2 border-purple-200 dark:border-purple-800"
                }`}
                onClick={() => setFormData({ 
                  ...formData, 
                  grade: formData.grade === grade ? "" : grade 
                })}
              >
                {grade}
              </Button>
            ))}
          </div>
        </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-purple-200 dark:border-purple-800 text-purple-600 focus:ring-purple-500"
            />
            <Label className="text-red-500 font-medium text-sm sm:text-base">
              {content.verifyContent}
            </Label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-purple-700 dark:text-purple-300 font-medium text-sm sm:text-base">
                {isAnonymous ? content.hideIdentity : content.showIdentity}
              </Label>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                {isAnonymous ? 'Anonymous' : session?.user?.name || 'User'}
              </p>
            </div>
            <Switch
              checked={!isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(!checked)}
              className="data-[state=checked]:bg-purple-500"
            />
          </div>

          {/* Warning Message */}
          {analysisResult && analysisResult.isInappropriate && (
            <div className="mt-6 mb-6 relative overflow-hidden">
              <div className={`p-6 rounded-xl border-2 backdrop-blur-sm shadow-lg animate-fade-in
                ${analysisResult.severity === 'high' 
                  ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                  : analysisResult.severity === 'medium'
                    ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                    : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                }`}
              >
                {/* Warning Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-full 
                    ${analysisResult.severity === 'high'
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                      : analysisResult.severity === 'medium'
                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300'
                        : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold
                    ${analysisResult.severity === 'high'
                      ? 'text-red-800 dark:text-red-200'
                      : analysisResult.severity === 'medium'
                        ? 'text-orange-800 dark:text-orange-200'
                        : 'text-yellow-800 dark:text-yellow-200'
                    }`}
                  >
                    {content.review.inappropriateWarning}
                  </h3>
                </div>

                {/* Found Words */}
                {analysisResult.inappropriateWords.length > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.inappropriateWords.map((word, index) => (
                        <span key={index} 
                          className={`px-2 py-1 rounded-full text-sm font-mono
                            ${analysisResult.severity === 'high'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : analysisResult.severity === 'medium'
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                            }`}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}           
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
            <Button 
              className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white h-11 sm:h-10 text-sm sm:text-base font-semibold"
              disabled={!verified || !rating || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Posting...</span>
                </div>
              ) : isEditing ? (
                'Update Review'
              ) : (
                content.post
              )}
            </Button>
            
            {isEditing && (
              <Button 
                variant="outline"
                className="flex-1 h-11 sm:h-10 text-sm sm:text-base"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Remove the warning from here */}
      {isAnalyzing && (
        <div className="mt-4 p-4 rounded-lg bg-blue-100 text-blue-800">
          Analyzing review content...
        </div>
      )}
    </div>
  )
}
