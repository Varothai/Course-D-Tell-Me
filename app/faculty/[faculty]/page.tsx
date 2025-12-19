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
import { ReviewCard } from "@/components/review-card"

interface ReviewWithUserInteraction extends Review {
  hasLiked?: boolean;
  hasDisliked?: boolean;
  _id: string;
  timestamp: string;
  comments: Comment[];
}

interface Comment {
  _id: string;
  comment: string;
  userName: string;
  userEmail?: string;
  createdAt: Date;
}

export default function FacultyReviewsPage() {
  const { content, language } = useLanguage()
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
          const formattedReviews = data.reviews.map((review: any) => ({
            ...review,
            _id: review._id || review.id,
            timestamp: review.timestamp || review.createdAt,
            comments: review.comments || []
          }))
          setReviews(formattedReviews)
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
    placeholder: content.searchPlaceholder,
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

  const handleDelete = (deletedReviewId: string) => {
    setReviews(reviews.filter(review => 
      (review.id !== deletedReviewId) && (review._id !== deletedReviewId)
    ));
  }

  const handleBookmark = (id: string) => {
    // Implementation of handleBookmark
  }

  const handleEdit = (reviewId: string, updatedReview: Review) => {
    setReviews(prevReviews => 
      prevReviews.map(review => 
        (review.id === reviewId || review._id === reviewId) 
          ? { ...review, ...updatedReview, _id: review._id, timestamp: review.timestamp }
          : review
      )
    );
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50 dark:from-slate-950 dark:via-indigo-950/50 dark:to-purple-950/30 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/10 dark:to-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-400/20 dark:from-pink-600/10 dark:to-rose-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 dark:from-blue-600/10 dark:to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]" />
      </div>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg mb-8 z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
        <div className="container mx-auto px-4 py-8 relative">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {faculty}
          </h1>
          <p className="text-muted-foreground">
          {reviews.length} {language === 'en' ? 'Reviews' : 'รีวิว'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
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
              <Button
                size="sm"
                variant={selectedElective === 'major' ? 'default' : 'outline'}
                className="rounded-full text-xs"
                onClick={() => setSelectedElective('major')}
              >
                {content.majorElective}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                likeAction={handleLike}
                dislikeAction={handleDislike}
                bookmarkAction={handleBookmark}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))
          ) : (
            <Card className="p-12 text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <Book className="w-12 h-12 mx-auto mb-4 text-purple-500/50" />
              <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300 mb-2">
                {language === 'en' ? 'No Reviews Found' : 'ไม่พบรีวิว'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'en' 
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