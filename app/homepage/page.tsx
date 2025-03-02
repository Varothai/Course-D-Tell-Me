"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Moon, Sun, Search, GraduationCap, BookOpen } from 'lucide-react'
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
import { useSession } from "next-auth/react"

interface ReviewWithUserInteraction extends Review {
  hasLiked?: boolean;
  hasDisliked?: boolean;
  _id: string;
  timestamp: string;
  comments: Comment[];
  likes: string[];    // Array of user IDs who liked
  dislikes: string[]; // Array of user IDs who disliked
}

interface Comment {
  _id: string;
  comment: string;
  userName: string;
  userEmail?: string;
  createdAt: Date;
}

export default function Home() {
  const { theme, toggleTheme } = useTheme()
  const { content, language, toggleLanguage } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const { addReview, clearReviews } = useReviews()
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
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<ReviewWithUserInteraction[]>([])

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
          const userId = session?.user?.email;
          // Format the dates and sort reviews
          const formattedReviews = data.reviews.map((review: Review) => ({
            ...review,
            createdAt: new Date(review.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            likes: review.likes || [],
            dislikes: review.dislikes || [],
            hasLiked: userId ? review.likes?.includes(userId) : false,
            hasDisliked: userId ? review.dislikes?.includes(userId) : false
          }))
          
          // Sort reviews by date (newest first)
          const sortedReviews = formattedReviews.sort((a: Review, b: Review) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          
          setReviews(sortedReviews)
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      }
    }

    fetchReviews()
  }, [session?.user?.email])

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

  const handleLike = async (reviewId: string) => {
    try {
      const userId = session?.user?.email;
      if (!userId) return;

      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reviewId,
          action: 'like',
          userId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to like review');
      }

      const data = await response.json();
      if (data.success) {
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review._id === reviewId 
              ? {
                  ...review,
                  likes: data.likes || review.likes,
                  dislikes: data.dislikes || review.dislikes,
                  hasLiked: data.likes?.includes(userId),
                  hasDisliked: data.dislikes?.includes(userId)
                }
              : review
          )
        );
      }
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const handleDislike = async (reviewId: string) => {
    try {
      const userId = session?.user?.email;
      if (!userId) return;

      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reviewId,
          action: 'dislike',
          userId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to dislike review');
      }

      const data = await response.json();
      if (data.success) {
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review._id === reviewId 
              ? {
                  ...review,
                  likes: data.likes || review.likes,
                  dislikes: data.dislikes || review.dislikes,
                  hasLiked: data.likes?.includes(userId),
                  hasDisliked: data.dislikes?.includes(userId)
                }
              : review
          )
        );
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

  const handleNewReview = (newReview: Review) => {
    // Add the new review to the beginning of the list
    setReviews(prev => [newReview, ...prev])
  }

  // Update the filteredReviews to maintain the sort order
  const filteredReviews = reviews
    .sort((a, b) => {
      // Convert timestamps to Date objects for comparison
      const dateA = new Date(a.timestamp)
      const dateB = new Date(b.timestamp)
      // Sort in descending order (newest first)
      return dateB.getTime() - dateA.getTime()
    })
    .filter(review => selectedCourse ? review.courseId === selectedCourse.courseno : true)
    .filter(review => {
      if (selectedProgram === 'all') return true;
      return review.programType === selectedProgram;
    })
    .filter(review => {
      if (selectedElective === 'all') return true;
      return review.electiveType === selectedElective;
    });

  const isGoogleUser = () => {
    return session?.user?.provider === 'google'
  }

  const handleDelete = (deletedReviewId: string) => {
    setReviews(prevReviews => 
      prevReviews.filter(review => 
        (review.id !== deletedReviewId) && (review._id !== deletedReviewId)
      )
    );
  }

  const handleEdit = (reviewId: string, updatedReview: Review) => {
    setReviews(prevReviews => 
      prevReviews.map(review => 
        (review.id === reviewId || review._id === reviewId) 
          ? { ...updatedReview, _id: review._id, timestamp: review.timestamp }
          : review
      )
    );
  }

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

        {/* Write Review Button with Auth Check */}
        <div className="flex justify-end mb-6">
          {!isGoogleUser() && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600 rounded-full px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  {content.writeReview}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ReviewForm
                  onClose={() => {
                    const closeButton = document.querySelector('[aria-label="Close"]') as HTMLButtonElement
                    closeButton?.click()
                  }}
                  action={handleNewReview}
                  onSubmitSuccess={() => {
                    // Additional success handling if needed
                    setTimeout(() => {
                      // Any additional UI updates
                    }, 3000)
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
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

          {/* Filters Section */}
          <div className="flex flex-wrap gap-4 bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 backdrop-blur-sm shadow-lg">
            {/* Program Types Filter */}
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative w-6 h-6">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-75 blur" />
                  <div className="relative bg-white dark:bg-gray-800 rounded-full p-1">
                    <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {content.programTypes}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedProgram === 'all' ? 'default' : 'outline'}
                  className="rounded-full text-xs"
                  onClick={() => setSelectedProgram('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={selectedProgram === 'normal' ? 'default' : 'outline'}
                  className="rounded-full text-xs"
                  onClick={() => setSelectedProgram('normal')}
                >
                  {content.normalProgram}
                </Button>
                <Button
                  size="sm"
                  variant={selectedProgram === 'special' ? 'default' : 'outline'}
                  className="rounded-full text-xs"
                  onClick={() => setSelectedProgram('special')}
                >
                  {content.specialProgram}
                </Button>
                <Button
                  size="sm"
                  variant={selectedProgram === 'international' ? 'default' : 'outline'}
                  className="rounded-full text-xs"
                  onClick={() => setSelectedProgram('international')}
                >
                  {content.internationalProgram}
                </Button>
                <Button
                  size="sm"
                  variant={selectedProgram === 'bilingual' ? 'default' : 'outline'}
                  className="rounded-full text-xs"
                  onClick={() => setSelectedProgram('bilingual')}
                >
                  {content.bilingualProgram}
                </Button>
                <Button
                  size="sm"
                  variant={selectedProgram === 'trilingual' ? 'default' : 'outline'}
                  className="rounded-full text-xs"
                  onClick={() => setSelectedProgram('trilingual')}
                >
                  {content.trilingualProgram}
                </Button>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-700 self-stretch mx-2" />

            {/* Elective Types Filter */}
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative w-6 h-6">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-75 blur" />
                  <div className="relative bg-white dark:bg-gray-800 rounded-full p-1">
                    <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {content.electiveTypes}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedElective === 'all' ? 'default' : 'outline'}
                  className="rounded-full text-xs"
                  onClick={() => setSelectedElective('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={selectedElective === 'free' ? 'default' : 'outline'}
                  className="rounded-full text-xs"
                  onClick={() => setSelectedElective('free')}
                >
                  {content.freeElective}
                </Button>
                <Button
                  size="sm"
                  variant={selectedElective === 'general' ? 'default' : 'outline'}
                  className="rounded-full text-xs"
                  onClick={() => setSelectedElective('general')}
                >
                  {content.generalElective}
                </Button>
              </div>
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
              <div key={review._id} className="transition-all duration-300">
                <ReviewCard 
                  review={review}
                  likeAction={handleLike}
                  dislikeAction={handleDislike}
                  commentAction={handleComment}
                  bookmarkAction={handleBookmark}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

