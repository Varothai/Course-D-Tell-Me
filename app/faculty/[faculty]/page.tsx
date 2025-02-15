"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import { Review } from "@/types/review"
import { useParams } from "next/navigation"
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Bookmark, Book, GraduationCap, BookOpen, Search } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ReviewDialog } from "@/components/review-dialog"
import { useReviews } from "@/providers/reviews-provider"
import { formatDistanceToNow, format } from 'date-fns'
import { useSession } from "next-auth/react"
import Autosuggest from "react-autosuggest"
import Papa from "papaparse"

interface ReviewWithUserInteraction extends Review {
  hasLiked?: boolean;
  hasDisliked?: boolean;
}

export default function FacultyReviewsPage() {
  const { content } = useLanguage()
  const params = useParams()
  const [reviews, setReviews] = useState<ReviewWithUserInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const faculty = params?.faculty ? decodeURIComponent(params.faculty as string) : ''
  const { handleLike, handleDislike } = useReviews()
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [selectedElective, setSelectedElective] = useState('all')
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithUserInteraction[]>([])
  const [courses, setCourses] = useState<Array<{ courseno: string; title_short_en: string }>>([])
  const [suggestions, setSuggestions] = useState<Array<{ courseno: string; title_short_en: string }>>([])
  const [selectedCourse, setSelectedCourse] = useState<{ courseno: string; title_short_en: string } | null>(null)
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const encodedFaculty = encodeURIComponent(faculty)
        const response = await fetch(`/api/reviews/faculty/${encodedFaculty}/`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        if (data.success) {
          // Sort reviews by date, newest first
          const sortedReviews = data.reviews.sort((a: Review, b: Review) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          setReviews(sortedReviews)
        } else {
          throw new Error(data.error || 'Failed to fetch reviews')
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [faculty])

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
        setCourses(coursesData)
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
    placeholder: content.language === 'en' ? "Search by Course ID or Name" : "ค้นหาด้วยรหัสวิชาหรือชื่อวิชา",
    value: searchQuery,
    onChange: (_: any, { newValue }: { newValue: string }) => {
      setSearchQuery(newValue)
      if (newValue.trim() === "") {
        setSelectedCourse(null)
      }
    },
  }

  useEffect(() => {
    let filtered = [...reviews]

    if (selectedProgram !== 'all') {
      filtered = filtered.filter(review => review.programType === selectedProgram)
    }

    if (selectedElective !== 'all') {
      filtered = filtered.filter(review => review.electiveType === selectedElective)
    }

    if (selectedCourse) {
      filtered = filtered.filter(review => review.courseId === selectedCourse.courseno)
    }

    setFilteredReviews(filtered)
  }, [reviews, selectedProgram, selectedElective, selectedCourse])

  const handleContentClick = (review: Review) => {
    setSelectedReview(review)
    setIsDialogOpen(true)
  }

  const handleLikeClick = async (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    await handleLike(reviewId, review.hasLiked, review.hasDisliked);
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? {
            ...review,
            likes: review.hasLiked ? review.likes - 1 : review.likes + 1,
            dislikes: review.hasDisliked ? review.dislikes - 1 : review.dislikes,
            hasLiked: !review.hasLiked,
            hasDisliked: false
          }
        : review
    ));
  };

  const handleDislikeClick = async (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    await handleDislike(reviewId, review.hasLiked, review.hasDisliked);
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? {
            ...review,
            dislikes: review.hasDisliked ? review.dislikes - 1 : review.dislikes + 1,
            likes: review.hasLiked ? review.likes - 1 : review.likes,
            hasDisliked: !review.hasDisliked,
            hasLiked: false
          }
        : review
    ));
  };

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
        <div className="container mx-auto px-4 py-8 relative">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {faculty}
          </h1>
          <p className="text-muted-foreground">
            {reviews.length} {content.language === 'en' ? 'Course Reviews' : 'รีวิวรายวิชา'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Add Search bar */}
        <div className="mb-6">
          <div className="flex justify-center">
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
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap gap-4 bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 backdrop-blur-sm shadow-lg mb-6">
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

        <div className="space-y-6">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <Card 
                key={review.id} 
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800"
                onClick={() => handleContentClick(review)}
              >
                <div className="p-6">
                  {/* Course Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-mono text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {review.courseId}
                      </div>
                      <div className="text-sm text-muted-foreground">{review.courseName}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 transition-colors ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-8 h-8 border-2 border-purple-200 dark:border-purple-800">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                          {review.userName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-purple-700 dark:text-purple-300">
                          {review.userName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {review.timestamp ? format(new Date(review.timestamp), 'MMM d, yyyy') : ''}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.review}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLikeClick(review.id)
                      }}
                      className={`hover:bg-purple-50 dark:hover:bg-purple-900/30 ${
                        review.hasLiked ? "text-purple-600 dark:text-purple-400" : ""
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 mr-2 ${review.hasLiked ? "fill-current" : ""}`} />
                      {review.likes} {content.likes}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDislikeClick(review.id)
                      }}
                      className={`hover:bg-purple-50 dark:hover:bg-purple-900/30 ${
                        review.hasDisliked ? "text-purple-600 dark:text-purple-400" : ""
                      }`}
                    >
                      <ThumbsDown className={`w-4 h-4 mr-2 ${review.hasDisliked ? "fill-current" : ""}`} />
                      {review.dislikes} {content.dislikes}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="hover:bg-purple-50 dark:hover:bg-purple-900/30"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {review.comments?.length || 0} {content.comments}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`hover:bg-purple-50 dark:hover:bg-purple-900/30 ml-auto ${
                        review.isBookmarked ? "text-purple-600 dark:text-purple-400" : ""
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${review.isBookmarked ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <Book className="w-12 h-12 mx-auto mb-4 text-purple-500/50" />
              <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300 mb-2">
                {content.language === 'en' ? 'No Reviews Found' : 'ไม่พบรีวิว'}
              </h3>
              <p className="text-muted-foreground">
                {content.language === 'en' 
                  ? 'Try adjusting your filters'
                  : 'ลองปรับตัวกรองของคุณ'}
              </p>
            </Card>
          )}
        </div>
      </div>

      {selectedReview && (
        <ReviewDialog 
          review={selectedReview}
          open={isDialogOpen}
          action={setIsDialogOpen}
        />
      )}
    </div>
  )
} 