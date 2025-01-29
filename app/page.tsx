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
    <div className="min-h-screen bg-[#E5E1FF] dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">{content.welcome}</h1>
            <h2 className="text-2xl text-muted-foreground">
              {content.courseTitle}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button variant="outline" onClick={toggleLanguage}>
              {language === "en" ? "TH" : "EN"}
            </Button>
          </div>
        </div>

        {/* Add Write Review Button */}
        <div className="flex justify-end mb-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#90EE90] text-black hover:bg-[#7FDF7F]">
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

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
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
                  className: "pl-12 pr-4 py-3 w-full border border-gray-300 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out",
                }}
                onSuggestionSelected={onSuggestionSelected}
              />
            </div>
          </div>

          {/* Program Types Filter */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">{content.programTypes}</h3>
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
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">{content.electiveTypes}</h3>
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

        {/* Reviews Section */}
        <div>
          <h3 className="text-xl font-bold mb-4">{content.allReviews}</h3>
          <div>
            {filteredReviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review}
                likeAction={handleLike}
                dislikeAction={handleDislike}
                commentAction={handleComment}
                bookmarkAction={handleBookmark}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

