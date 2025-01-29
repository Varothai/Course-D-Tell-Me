"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Moon, Sun, Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReviewCard } from "@/components/review-card"
import { useTheme } from "@/providers/theme-provider"
import { useLanguage } from "@/providers/language-provider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ReviewForm } from "@/components/review-form"
import { useReviews } from "@/providers/review-provider"
import type { Review } from "@/types/review"
import Autosuggest from "react-autosuggest"
import Papa from "papaparse"

interface ReviewWithUserInteraction extends Review {
  hasLiked?: boolean;
  hasDisliked?: boolean;
}

// Mock data for reviews
const mockReviews = [
  {
    id: "1",
    courseId: "261411",
    courseName: "SOFTWARE ENGINEERING",
    rating: 4,
    userName: "USER 1",
    review: "Great course with practical applications. The professor explains concepts clearly and provides good examples.",
    likes: 10,
    dislikes: 2,
    comments: ["Great review!", "I agree, very helpful course."],
    isBookmarked: false,
  },
  {
    id: "2",
    courseId: "271001",
    courseName: "GENERAL PHYSICS",
    rating: 3,
    userName: "USER 2",
    review: "Challenging but interesting. The labs help understand theoretical concepts better.",
    likes: 5,
    dislikes: 1,
    comments: ["Thanks for sharing your experience."],
    isBookmarked: true,
  },
  // Add more mock reviews as needed
]

export default function Home() {
  const { theme, toggleTheme } = useTheme()
  const { content, language, toggleLanguage } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const { reviews, addReview, clearReviews } = useReviews()
  const [selectedFaculty, setSelectedFaculty] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [selectedElective, setSelectedElective] = useState("all")
  const [isWritingReview, setIsWritingReview] = useState(false)
  const [newReviewData, setNewReviewData] = useState({
    courseId: "",
    courseName: ""
  })
  const [courses, setCourses] = useState<Array<{ courseno: string; title_short_en: string }>>([])
  const [suggestions, setSuggestions] = useState<Array<{ courseno: string; title_short_en: string }>>([])
  const [selectedCourse, setSelectedCourse] = useState<{ courseno: string; title_short_en: string } | null>(null)

  // Fetch reviews when component mounts
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/reviews')
        if (!response.ok) {
          throw new Error('Failed to fetch reviews')
        }
        const data = await response.json()
        if (data.success) {
          // Sort reviews by date, newest first (as backup if API sorting fails)
          const sortedReviews = data.reviews.sort((a: Review, b: Review) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          clearReviews()
          sortedReviews.forEach((review: Review) => addReview(review))
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      }
    }

    fetchReviews()
  }, [])

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/courses/courses.csv")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const csvText = await response.text()
        const parsedData = Papa.parse(csvText, {
          header: true,
          dynamicTyping: false,
        })
        const coursesData = parsedData.data.map((course: any) => ({
          courseno: String(course.courseno),
          title_short_en: course.title_short_en,
        }))
        setCourses(coursesData as Array<{ courseno: string; title_short_en: string }>)
      } catch (error) {
        console.error("Error fetching courses:", error)
      }
    }

    fetchCourses()
  }, [])

  const getSuggestions = (value: string) => {
    const inputValue = value.trim().toLowerCase()
    const inputLength = inputValue.length

    return inputLength === 0 ? [] : courses.filter(course => {
      const courseNoMatch = course.courseno.toLowerCase().slice(0, inputLength) === inputValue
      const courseNameMatch = course.title_short_en.toLowerCase().slice(0, inputLength) === inputValue
      return courseNoMatch || courseNameMatch
    })
  }

  const onSuggestionsFetchRequested = ({ value }: { value: string }) => {
    setSuggestions(getSuggestions(value))
  }

  const onSuggestionsClearRequested = () => {
    setSuggestions([])
  }

  const onSuggestionSelected = (event: any, { suggestion }: { suggestion: { courseno: string; title_short_en: string } }) => {
    setSearchQuery(`${suggestion.courseno} - ${suggestion.title_short_en}`)
    setSelectedCourse(suggestion)
  }

  const inputProps = {
    placeholder: "Search by Course ID or Name",
    value: searchQuery,
    onChange: (e: any, { newValue }: { newValue: string }) => {
      setSearchQuery(newValue)
      if (newValue.trim() === "") {
        setSelectedCourse(null) // Reset selected course when search is cleared
      }
    },
  }

  const handleLike = async (id: string) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId: id, action: 'like' }),
      });

      if (!response.ok) {
        throw new Error('Failed to like review');
      }

      const data = await response.json();
      if (data.success) {
        console.log('Review liked successfully');
        // Optionally update the UI with the new like count
      } else {
        console.error('Error liking review:', data.error);
      }
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const handleDislike = async (id: string) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId: id, action: 'dislike' }),
      });

      if (!response.ok) {
        throw new Error('Failed to dislike review');
      }

      const data = await response.json();
      if (data.success) {
        console.log('Review disliked successfully');
        // Optionally update the UI with the new dislike count
      } else {
        console.error('Error disliking review:', data.error);
      }
    } catch (error) {
      console.error('Error disliking review:', error);
    }
  };

  const handleComment = async (id: string, comment: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId: id, comment, userName: 'Anonymous' }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const data = await response.json();
      if (data.success) {
        console.log('Comment added successfully');
      } else {
        console.error('Error adding comment:', data.error);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleBookmark = (id: string) => {
    // Implementation of handleBookmark
  }

  const handleNewReview = (review: any) => {
    // Handle the new review submission
    console.log(review)
    setIsWritingReview(false)
  }

  const filteredReviews = reviews
    // First filter by course if selected
    .filter(review => selectedCourse ? review.courseId === selectedCourse.courseno : true)
    // Then filter by program type
    .filter(review => {
      if (selectedProgram === 'all') return true;
      return review.programType === selectedProgram;
    })
    // Then filter by elective type
    .filter(review => {
      if (selectedElective === 'all') return true;
      return review.electiveType === selectedElective;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section with Mascot */}
        <div className="relative mb-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl p-8 backdrop-blur-sm shadow-lg transition-all duration-300 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

          <div className="relative flex items-center justify-between">
            {/* Welcome Text and Mascot */}
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-32 group">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-75 group-hover:opacity-100 blur transition-all duration-500" />
                <div className="relative bg-white dark:bg-gray-800 rounded-full p-2">
                  <img
                    src="/elephant-mascot.png"
                    alt="Cute elephant mascot"
                    className="w-full h-full object-contain animate-bounce-gentle"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-5xl font-bold">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {content.welcome}
                  </span>
                </h1>
                <h2 className="text-2xl text-muted-foreground">
                  {content.courseTitle}
                </h2>
              </div>
            </div>

            {/* Theme and Language Toggle */}
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleTheme}
                className="rounded-full w-12 h-12 hover:scale-110 hover:shadow-lg transition-all duration-300 bg-white/50 dark:bg-gray-800/50"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={toggleLanguage}
                className="rounded-full w-12 h-12 hover:scale-110 hover:shadow-lg transition-all duration-300 bg-white/50 dark:bg-gray-800/50"
              >
                {language === "en" ? "TH" : "EN"}
              </Button>
            </div>
          </div>

          {/* Decorative sparkles */}
          <div className="absolute top-6 right-24 animate-pulse">
            <div className="w-3 h-3 bg-yellow-300 rounded-full" />
          </div>
          <div className="absolute top-12 right-36 animate-pulse delay-100">
            <div className="w-2 h-2 bg-yellow-300 rounded-full" />
          </div>
          <div className="absolute top-8 right-48 animate-pulse delay-200">
            <div className="w-2 h-2 bg-yellow-300 rounded-full" />
          </div>
        </div>

        {/* Write Review Button with updated styling */}
        <div className="flex justify-end mb-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600 rounded-full px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                {content.writeReview}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ReviewForm 
                courseId=""
                courseName=""
                action={handleNewReview}
                onClose={() => {
                  const closeButton = document.querySelector('[aria-label="Close"]') as HTMLButtonElement
                  closeButton?.click()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search bar with updated styling */}
        <div className="mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative w-full max-w-4xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Autosuggest
                suggestions={suggestions}
                onSuggestionsFetchRequested={onSuggestionsFetchRequested}
                onSuggestionsClearRequested={onSuggestionsClearRequested}
                getSuggestionValue={(suggestion: any) => `${suggestion.courseno} - ${suggestion.title_short_en}`}
                renderSuggestion={(suggestion: any) => (
                  <div>
                    {suggestion.courseno} - {suggestion.title_short_en}
                  </div>
                )}
                inputProps={{
                  ...inputProps,
                  className: "pl-12 pr-4 py-4 w-full border-2 border-purple-200 dark:border-purple-900 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
                }}
                theme={{
                  container: 'relative',
                  suggestion: 'px-4 py-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50',
                  suggestionHighlighted: 'bg-purple-100 dark:bg-purple-800/50',
                  suggestionsContainer: 'absolute w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl mt-2 overflow-hidden z-50',
                  suggestionsList: 'max-h-64 overflow-auto rounded-2xl'
                }}
                onSuggestionSelected={onSuggestionSelected}
              />
            </div>
          </div>

          {/* Filters with updated styling */}
          <div className="space-y-8 bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-lg">
            {/* Program Types Filter */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-700 dark:text-purple-300">
                {content.programTypes}
              </h3>
              <RadioGroup
                value={selectedProgram}
                onValueChange={setSelectedProgram}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal">{content.normalProgram}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="special" id="special" />
                  <Label htmlFor="special">{content.specialProgram}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="international" id="international" />
                  <Label htmlFor="international">{content.internationalProgram}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bilingual" id="bilingual" />
                  <Label htmlFor="bilingual">{content.bilingualProgram}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="trilingual" id="trilingual" />
                  <Label htmlFor="trilingual">{content.trilingualProgram}</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Elective Types Filter */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-700 dark:text-purple-300">
                {content.electiveTypes}
              </h3>
              <RadioGroup
                value={selectedElective}
                onValueChange={setSelectedElective}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-elective" />
                  <Label htmlFor="all-elective">All</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="free" id="free" />
                  <Label htmlFor="free">{content.freeElective}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="general" id="general" />
                  <Label htmlFor="general">{content.generalElective}</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        {/* Reviews Section with updated styling */}
        <div>
          <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {content.allReviews}
          </h3>
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <div key={review.id} className="transform hover:scale-[1.02] transition-all duration-300">
                <ReviewCard 
                  review={review}
                  likeAction={handleLike}
                  dislikeAction={handleDislike}
                  commentAction={handleComment}
                  bookmarkAction={handleBookmark}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

