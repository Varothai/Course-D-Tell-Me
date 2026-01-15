"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Image from "next/image"
import { Search, GraduationCap, BookOpen, ArrowUpDown, Filter, X } from 'lucide-react'
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
import { Modal } from "@/components/modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import dynamic from "next/dynamic"
const ReviewForm = dynamic(
  () => import("@/components/review-form").then(mod => mod.ReviewForm),
  { loading: () => <div className="p-4 text-center text-sm text-muted-foreground">Loading form...</div> }
)
import { useReviews } from "@/providers/review-provider"
import type { Review } from "@/types/review"
import Autosuggest from "react-autosuggest"
import Papa from "papaparse"
import { useSession } from "next-auth/react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface ReviewWithUserInteraction extends Omit<Review, 'likes' | 'dislikes'> {
  likes: string[];
  dislikes: string[];
  hasLiked?: boolean;
  hasDisliked?: boolean;
  reactions?: {
    thumbsUp: string[];
    heart: string[];
    laugh: string[];
    surprised: string[];
    sad: string[];
  };
  _id: string;
  timestamp: string;
  comments: Comment[];
  isAnonymous?: boolean;
  userId: string;
}

interface Comment {
  _id: string;
  comment: string;
  userName: string;
  userEmail?: string;
  createdAt: Date;
}

export default function Home() {
  const { content } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const { addReview, clearReviews } = useReviews()
  const [selectedFaculty, setSelectedFaculty] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [selectedElective, setSelectedElective] = useState("all")
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highestRated' | 'mostReactions' | 'mostCommented'>('newest')
  const [isWritingReview, setIsWritingReview] = useState(false)
  const [newReviewData, setNewReviewData] = useState({
    courseId: "",
    courseName: ""
  })
  const [courses, setCourses] = useState<Array<{ courseno: string; title_short_en: string }>>([])
  const [suggestions, setSuggestions] = useState<Array<{ courseno: string; title_short_en: string }>>([])
  const [selectedCourse, setSelectedCourse] = useState<{ courseno: string; title_short_en: string } | null>(null)
  const { data: session } = useSession()
  const { setShowAuthModal } = useAuth()
  const [reviews, setReviews] = useState<ReviewWithUserInteraction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reviewsCache = useRef<ReviewWithUserInteraction[] | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [isWriteReviewDialogOpen, setIsWriteReviewDialogOpen] = useState(false)
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [pendingClose, setPendingClose] = useState(false)
  const [shouldPreventClose, setShouldPreventClose] = useState(false)
  const reviewFormRef = useRef<{ saveDraft: () => Promise<boolean>; deleteDraft: () => Promise<boolean>; resetForm: () => void; hasUnsavedContent: () => boolean } | null>(null)
  const { toast } = useToast()

  // Fetch reviews function
    const fetchReviews = async () => {
    if (reviewsCache.current) {
      setReviews(reviewsCache.current)
      setIsLoading(false)
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

      setIsLoading(true)
      setError(null)
      try {
      const response = await fetch('/api/reviews', { signal: controller.signal })
        if (!response.ok) {
          throw new Error('Failed to fetch reviews')
        }
        const data = await response.json()
        if (data.success) {
          const userId = session?.user?.email;
          const formattedReviews = data.reviews.map((review: Review) => ({
            ...review,
            _id: review._id || review.id,
            userId: review.userId,
            createdAt: new Date(review.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            likes: Array.isArray(review.likes) ? review.likes : [],
            dislikes: Array.isArray(review.dislikes) ? review.dislikes : [],
            hasLiked: userId ? (Array.isArray(review.likes) ? review.likes.includes(userId) : false) : false,
            hasDisliked: userId ? (Array.isArray(review.dislikes) ? review.dislikes.includes(userId) : false) : false,
            reactions: review.reactions || {
              thumbsUp: [],
              heart: [],
              laugh: [],
              surprised: [],
              sad: []
            },
            isAnonymous: review.isAnonymous || false,
            timestamp: review.timestamp || new Date(review.createdAt).toISOString()
          })) as ReviewWithUserInteraction[]
          
          const sortedReviews = formattedReviews.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          
        reviewsCache.current = sortedReviews
          setReviews(sortedReviews)
        }
      } catch (error) {
      if ((error as Error).name === 'AbortError') return
        console.error('Error fetching reviews:', error)
        setError('Failed to load reviews. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

  // Fetch reviews when component mounts
  useEffect(() => {
    fetchReviews()
    
    // Listen for review hidden events to clear cache and refetch
    const handleReviewHidden = (event: Event) => {
      const customEvent = event as CustomEvent<{ reviewId: string }>
      const { reviewId } = customEvent.detail
      // Remove the hidden review from local state immediately
      setReviews(prevReviews => 
        prevReviews.filter(review => 
          (review.id !== reviewId) && (review._id !== reviewId)
        )
      )
      // Clear cache and refetch to ensure consistency
      reviewsCache.current = null
      fetchReviews()
    }
    
    window.addEventListener('reviewHidden', handleReviewHidden as EventListener)
    
    return () => {
      abortControllerRef.current?.abort()
      window.removeEventListener('reviewHidden', handleReviewHidden as EventListener)
    }
  }, [session]) // Include session to access it in fetchReviews

  // Update likes/dislikes when session changes
  useEffect(() => {
    if (session?.user?.email && reviews.length > 0) {
      const userEmail = session.user.email;
      setReviews(prevReviews => 
        prevReviews.map(review => ({
          ...review,
          hasLiked: review.likes.includes(userEmail),
          hasDisliked: review.dislikes.includes(userEmail)
        }))
      )
    }
  }, [session?.user?.email])

  // Hide default close button when dialog opens
  useEffect(() => {
    if (isWriteReviewDialogOpen) {
      const timer = setTimeout(() => {
        // Find and hide the default close button
        const dialogContent = document.querySelector('[data-radix-dialog-content]')
        if (dialogContent) {
          const defaultCloseBtn = dialogContent.querySelector('button:last-child')
          if (defaultCloseBtn && defaultCloseBtn.querySelector('svg')) {
            (defaultCloseBtn as HTMLElement).style.display = 'none'
          }
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isWriteReviewDialogOpen])

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

  const handleClearSearch = () => {
    setSearchQuery("")
    setSelectedCourse(null)
    setSuggestions([])
  }

  const inputProps = {
    placeholder: content.searchPlaceholder,
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
                  likes: Array.isArray(data.likes) ? data.likes : review.likes,
                  dislikes: Array.isArray(data.dislikes) ? data.dislikes : review.dislikes,
                  hasLiked: Array.isArray(data.likes) ? data.likes.includes(userId) : review.hasLiked,
                  hasDisliked: Array.isArray(data.dislikes) ? data.dislikes.includes(userId) : review.hasDisliked
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
                  likes: Array.isArray(data.likes) ? data.likes : review.likes,
                  dislikes: Array.isArray(data.dislikes) ? data.dislikes : review.dislikes,
                  hasLiked: Array.isArray(data.likes) ? data.likes.includes(userId) : review.hasLiked,
                  hasDisliked: Array.isArray(data.dislikes) ? data.dislikes.includes(userId) : review.hasDisliked
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
    // Convert Review to ReviewWithUserInteraction format
    const userId = session?.user?.email || '';
    const formattedReview: ReviewWithUserInteraction = {
      ...newReview,
      _id: newReview._id || newReview.id || '',
      userId: newReview.userId || userId,
      likes: Array.isArray(newReview.likes) ? newReview.likes : [],
      dislikes: Array.isArray(newReview.dislikes) ? newReview.dislikes : [],
      hasLiked: false,
      hasDisliked: false,
      reactions: newReview.reactions || {
        thumbsUp: [],
        heart: [],
        laugh: [],
        surprised: [],
        sad: []
      },
      isAnonymous: newReview.isAnonymous || false,
      timestamp: newReview.timestamp || new Date().toISOString(),
      comments: newReview.comments || [],
      createdAt: typeof newReview.createdAt === 'string' ? newReview.createdAt : new Date().toISOString()
    };
    // Add the new review to the beginning of the list
    setReviews(prev => [formattedReview, ...prev])
  }

  // Update the filteredReviews with sorting and filtering
  const filteredReviews = useMemo(() => {
    let filtered = [...reviews]
    .filter(review => selectedCourse ? review.courseId === selectedCourse.courseno : true)
    .filter(review => {
      if (selectedProgram === 'all') return true;
      return review.programType === selectedProgram;
    })
    .filter(review => {
      if (selectedElective === 'all') return true;
      return review.electiveType === selectedElective;
      })

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        case 'highestRated':
          return b.rating - a.rating
        case 'mostReactions':
          const aReactions = (Array.isArray(a.reactions?.thumbsUp) ? a.reactions.thumbsUp.length : 0) + 
                            (Array.isArray(a.reactions?.heart) ? a.reactions.heart.length : 0) + 
                            (Array.isArray(a.reactions?.laugh) ? a.reactions.laugh.length : 0) + 
                            (Array.isArray(a.reactions?.surprised) ? a.reactions.surprised.length : 0) + 
                            (Array.isArray(a.reactions?.sad) ? a.reactions.sad.length : 0) +
                            (Array.isArray(a.likes) ? a.likes.length : 0)
          const bReactions = (Array.isArray(b.reactions?.thumbsUp) ? b.reactions.thumbsUp.length : 0) + 
                            (Array.isArray(b.reactions?.heart) ? b.reactions.heart.length : 0) + 
                            (Array.isArray(b.reactions?.laugh) ? b.reactions.laugh.length : 0) + 
                            (Array.isArray(b.reactions?.surprised) ? b.reactions.surprised.length : 0) + 
                            (Array.isArray(b.reactions?.sad) ? b.reactions.sad.length : 0) +
                            (Array.isArray(b.likes) ? b.likes.length : 0)
          return bReactions - aReactions
        case 'mostCommented':
          return (b.comments?.length || 0) - (a.comments?.length || 0)
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      }
    })

    return filtered
  }, [reviews, selectedCourse, selectedProgram, selectedElective, sortBy])

  const isGoogleUser = () => {
    return session?.user?.provider === 'google'
  }

  const handleSortChange = (value: 'newest' | 'oldest' | 'highestRated' | 'mostReactions' | 'mostCommented') => {
    setSortBy(value)
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
          ? {
              ...review,
              ...updatedReview,
              _id: review._id,
              timestamp: review.timestamp,
              likes: Array.isArray(updatedReview.likes) ? updatedReview.likes : review.likes,
              dislikes: Array.isArray(updatedReview.dislikes) ? updatedReview.dislikes : review.dislikes,
              reactions: updatedReview.reactions || review.reactions || {
                thumbsUp: [],
                heart: [],
                laugh: [],
                surprised: [],
                sad: []
              },
              comments: review.comments || []
            }
          : review
      )
    );
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
      
      <div className="container mx-auto px-4 pt-4 pb-8 relative z-10">
        {/* Welcome Section with Mascot */}
        <div className="relative mb-8 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20 dark:border-gray-700/30 transition-all duration-300 overflow-hidden hover:shadow-2xl">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 dark:from-indigo-800/20 dark:to-purple-800/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-blue-200/40 to-cyan-200/40 dark:from-blue-800/20 dark:to-cyan-800/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

          <div className="relative flex items-center justify-between">
            {/* Welcome Text and Mascot */}
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 group flex-shrink-0">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-60 group-hover:opacity-100 blur-lg transition-all duration-500 group-hover:scale-110" />
                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-1.5 shadow-md border border-white/50 dark:border-gray-700/50">
                  <img
                    src="/elephant-mascot.png"
                    alt="Cute elephant mascot"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                    {content.welcome}
                  </span>
                </h1>
                <h2 className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  {content.courseTitle}
                </h2>
              </div>
            </div>
          </div>

          {/* Decorative sparkles - smaller and fewer */}
          <div className="absolute top-3 right-16 animate-pulse">
            <div className="w-2 h-2 bg-amber-400/60 dark:bg-amber-300/40 rounded-full shadow-sm" />
          </div>
          <div className="absolute top-4 right-24 animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '2s' }}>
            <div className="w-1.5 h-1.5 bg-amber-400/60 dark:bg-amber-300/40 rounded-full shadow-sm" />
          </div>
        </div>

        {/* Write Review Button with Auth Check */}
        <div className="flex justify-end mb-6">
          {!isGoogleUser() && (
            <>
              <Button 
                onClick={() => {
                  if (!session) {
                    setShowAuthModal(true)
                  } else {
                    setIsWriteReviewDialogOpen(true)
                  }
                }}
                className="bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600 rounded-full px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {content.writeReview}
              </Button>
              <Modal 
                isOpen={isWriteReviewDialogOpen} 
                onClose={() => {
                  // Don't allow closing if confirmation dialog is showing
                  if (showCloseConfirmation) {
                    return
                  }
                  // Check if there's unsaved content
                  const hasContent = reviewFormRef.current?.hasUnsavedContent?.()
                  if (hasContent) {
                    // Show confirmation dialog and keep main modal open
                    setPendingClose(true)
                    setShowCloseConfirmation(true)
                  } else {
                    setIsWriteReviewDialogOpen(false)
                  }
                }}
              >
                <div className="p-4 sm:p-6">
                  <ReviewForm
                    onClose={() => {
                      const hasContent = reviewFormRef.current?.hasUnsavedContent?.()
                      if (hasContent) {
                        setPendingClose(true)
                        setShowCloseConfirmation(true)
                      } else {
                        setIsWriteReviewDialogOpen(false)
                      }
                    }}
                    action={handleNewReview}
                    onSubmitSuccess={() => {
                      // Additional success handling if needed
                      setTimeout(() => {
                        // Any additional UI updates
                      }, 3000)
                    }}
                  />
                </div>
              </Modal>

              {/* Close Confirmation Dialog */}
              <AlertDialog 
                open={showCloseConfirmation} 
                onOpenChange={(open) => {
                  setShowCloseConfirmation(open)
                  if (!open) {
                    // User cancelled - ensure main dialog stays open
                    setPendingClose(false)
                    setShouldPreventClose(false)
                  }
                }}
              >
                <AlertDialogContent className="max-w-md" style={{ zIndex: 200 }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Save Your Progress?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You have unsaved changes. What would you like to do?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel
                      onClick={() => {
                        setShowCloseConfirmation(false)
                        setPendingClose(false)
                        setShouldPreventClose(false)
                        // Keep main dialog open - it's already open
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        // Delete the draft if it exists
                        if (reviewFormRef.current?.deleteDraft) {
                          await reviewFormRef.current.deleteDraft()
                        }
                        // Reset the form to clear all input
                        if (reviewFormRef.current?.resetForm) {
                          reviewFormRef.current.resetForm()
                        }
                        setShowCloseConfirmation(false)
                        setPendingClose(false)
                        setShouldPreventClose(false)
                        // Close the main dialog
                        setIsWriteReviewDialogOpen(false)
                      }}
                      className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                    >
                      Discard
                    </Button>
                    <Button
                      onClick={async () => {
                        const saved = await reviewFormRef.current?.saveDraft()
                        setShowCloseConfirmation(false)
                        setPendingClose(false)
                        setShouldPreventClose(false)
                        if (saved) {
                          // Close the dialog first, then show success message
                          setIsWriteReviewDialogOpen(false)
                          // Show toast after a brief delay to ensure dialog is closed
                          setTimeout(() => {
                            toast({
                              title: "Draft Saved",
                              description: "Your review has been saved as a draft successfully.",
                              duration: 3000,
                            })
                          }, 200)
                        } else {
                          toast({
                            title: "Error",
                            description: "Failed to save draft. Please try again.",
                            variant: "destructive",
                            duration: 3000,
                          })
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save as Draft
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>

        {/* Search bar with updated styling */}
        <div className="mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative w-full max-w-4xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 z-10" />
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
                  className: `pl-12 ${searchQuery ? 'pr-12' : 'pr-4'} py-4 w-full border-2 border-purple-200 dark:border-purple-900 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm`,
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
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-10"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
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
        </div>

        {/* Reviews Section with updated styling */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {content.allReviews}
            </h3>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 rounded-xl px-3 py-2 backdrop-blur-sm shadow-md">
              <ArrowUpDown className="w-4 h-4 text-purple-600 dark:text-purple-300" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Sort by:</span>
              <Select 
                value={sortBy} 
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-[200px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{content.sortBy.newest}</SelectItem>
                  <SelectItem value="oldest">{content.sortBy.oldest}</SelectItem>
                  <SelectItem value="highestRated">{content.sortBy.highestRated}</SelectItem>
                  <SelectItem value="mostReactions">{content.sortBy.mostReactions}</SelectItem>
                  <SelectItem value="mostCommented">{content.sortBy.mostCommented}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">
              {error}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center text-gray-500 p-4">
              No reviews found
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review._id} className="transition-all duration-300 mobile-cv-auto">
                  <ReviewCard 
                    review={review as unknown as Review & { isAnonymous?: boolean; timestamp: string; _id: string; userId: string }}
                    likeAction={handleLike}
                    dislikeAction={handleDislike}
                    bookmarkAction={handleBookmark}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
