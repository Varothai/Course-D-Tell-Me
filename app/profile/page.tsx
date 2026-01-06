"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Book, MessageSquare, Building2, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { Review } from "@/types/review"
import { useToast } from "@/components/ui/use-toast"
import { ReviewCard } from "@/components/review-card"
import { useReviews } from "@/providers/reviews-provider"

interface ReviewWithUserInteraction extends Review {
  hasLiked?: boolean;
  hasDisliked?: boolean;
  _id: string;
  timestamp: string;
  comments: Comment[];
}

interface QAItem {
  _id: string
  question: string
  userName: string
  userEmail?: string
  userProvider?: 'google' | 'cmu'
  timestamp: string
  comments: any[]
}

interface Comment {
  _id: string;
  comment: string;
  userName: string;
  userEmail?: string;
  createdAt: Date;
}

// Helper function to determine provider from email or stored provider
const getProvider = (userProvider?: string, userEmail?: string): 'google' | 'cmu' | null => {
  if (userProvider === 'cmu' || userProvider === 'google') {
    return userProvider as 'google' | 'cmu'
  }
  if (userEmail?.endsWith('@cmu.ac.th')) {
    return 'cmu'
  }
  if (userProvider) {
    return userProvider as 'google' | 'cmu'
  }
  return null
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const { content } = useLanguage()
  const [userReviews, setUserReviews] = useState<ReviewWithUserInteraction[]>([])
  const [userQAs, setUserQAs] = useState<QAItem[]>([])
  const [loading, setLoading] = useState(true)
  const [qaLoading, setQaLoading] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const { handleLike, handleDislike } = useReviews()

  useEffect(() => {
    fetchUserReviews()
    if (session?.user?.provider === 'google') {
      fetchUserQAs()
    }
  }, [session])

  const fetchUserReviews = async () => {
    if (!session) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/reviews/history')
      const data = await response.json()
      
      if (data.success) {
        // Format reviews to match required interface
        const formattedReviews = data.reviews.map((review: any) => ({
          ...review,
          _id: review._id || review.id,
          timestamp: review.timestamp || review.createdAt,
          comments: review.comments || []
        }))
        setUserReviews(formattedReviews)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch your reviews",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching user reviews:", error)
      toast({
        title: "Error",
        description: "Failed to fetch your reviews",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (deletedReviewId: string) => {
    setUserReviews(reviews => 
      reviews.filter(review => 
        (review.id !== deletedReviewId) && (review._id !== deletedReviewId)
      )
    );
  }

  const handleEdit = (reviewId: string, updatedReview: Review) => {
    setUserReviews(prevReviews => 
      prevReviews.map(review => 
        (review.id === reviewId || review._id === reviewId) 
          ? updatedReview
          : review
      )
    );
  }

  const handleComment = async (reviewId: string, comment: string) => {
    // Implement comment functionality
  }

  const handleBookmark = async (reviewId: string) => {
    // Implement bookmark functionality
  }

  const fetchUserQAs = async () => {
    if (!session?.user?.email) return
    try {
      setQaLoading(true)
      const response = await fetch(`/api/qa?userEmail=${encodeURIComponent(session.user.email)}`)
      const data = await response.json()
      if (data.success) {
        const formatted = (data.qas || []).map((qa: any) => ({
          ...qa,
          _id: qa._id?.toString?.() || qa._id || qa.id
        }))
        setUserQAs(formatted)
      }
    } catch (error) {
      console.error("Error fetching user Q&A posts:", error)
    } finally {
      setQaLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="relative mb-12">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl" />
          
          <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl border-2 border-purple-200 dark:border-purple-800 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-purple-200 dark:border-purple-800 shadow-lg">
                <AvatarImage src={session.user?.image || ''} />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-2xl text-white">
                  {session.user?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {session.user?.name}
                </h1>
                <p className="text-muted-foreground">{session.user?.email}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* User's Reviews */}
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-lg transition-all duration-300">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {userReviews.length > 0 || session?.user?.provider !== 'google'
                ? content.yourReviews
                : "Your Q&A Posts"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {session?.user?.provider === 'google' && userReviews.length === 0
                ? `${userQAs.length} ${userQAs.length === 1 ? 'Post' : 'Posts'}`
                : `${userReviews.length} ${userReviews.length === 1 ? 'Review' : 'Reviews'}`}
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
            </div>
          ) : userReviews.length > 0 ? (
            <div className="space-y-6">
              {userReviews.map((review) => (
                <ReviewCard 
                  key={review._id}
                  review={review}
                  likeAction={handleLike}
                  dislikeAction={handleDislike}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : session?.user?.provider === 'google' ? (
            qaLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
              </div>
            ) : userQAs.length > 0 ? (
              <div className="space-y-4 sm:space-y-6 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-4 sm:p-6">
                {userQAs.map((qa) => (
                  <div key={qa._id} className="transition-all duration-300">
                    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800">
                      <div className="p-4 sm:p-6">
                        {/* Top section with user info */}
                        <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-purple-200 dark:ring-purple-800 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs sm:text-sm">
                                {qa.userName?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-purple-700 dark:text-purple-300 text-sm sm:text-base truncate">
                                  {qa.userName}
                                </span>
                                {(() => {
                                  const provider = getProvider(qa.userProvider, qa.userEmail)
                                  if (provider === 'cmu') {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                        <Building2 className="w-3 h-3" />
                                        CMU
                                      </span>
                                    )
                                  } else if (provider === 'google') {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        <Globe className="w-3 h-3" />
                                        Google
                                      </span>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                {qa.timestamp}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Question Content */}
                        <p className="mb-3 sm:mb-4 text-base sm:text-lg break-words">
                          {qa.question}
                        </p>

                        {/* Comments summary + toggle */}
                        <div className="border-t pt-2 mt-1">
                          <button
                            onClick={() => setExpandedComments(prev => ({ ...prev, [qa._id]: !prev[qa._id] }))}
                            className="w-full flex items-center justify-between gap-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 p-1.5 rounded-md transition-colors"
                          >
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="font-semibold">
                                Comments ({qa.comments?.length || 0})
                              </span>
                            </div>
                            <div className="text-purple-600 dark:text-purple-400 flex-shrink-0">
                              {expandedComments[qa._id] ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </button>

                          {expandedComments[qa._id] && (
                            <div className="mt-2 space-y-2">
                              {(qa.comments || []).filter((c: any) => !c.isHidden).length === 0 ? (
                                <p className="text-xs text-muted-foreground px-1.5">
                                  No comments yet.
                                </p>
                              ) : (
                                (qa.comments || [])
                                  .filter((c: any) => !c.isHidden)
                                  .map((comment: any) => (
                                    <div key={comment._id || comment.id} className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-md">
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                                          <Avatar className="w-5 h-5 flex-shrink-0">
                                            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-[10px]">
                                              {comment.userName?.[0] || "U"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="font-medium text-xs text-purple-700 dark:text-purple-300 truncate">
                                            {comment.userName || "Unknown"}
                                          </span>
                                          {(() => {
                                            const provider = getProvider(comment.userProvider, comment.userEmail)
                                            if (provider === 'cmu') {
                                              return (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                  <Building2 className="w-3 h-3" />
                                                  CMU
                                                </span>
                                              )
                                            } else if (provider === 'google') {
                                              return (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                  <Globe className="w-3 h-3" />
                                                  Google
                                                </span>
                                              )
                                            }
                                            return null
                                          })()}
                                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                            {comment.timestamp || comment.createdAt}
                                          </span>
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-700 dark:text-gray-200 break-words">
                                        {comment.content || comment.comment}
                                      </p>
                                    </div>
                                  ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <Book className="w-12 h-12 mx-auto mb-4 text-purple-500/50" />
                <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300 mb-2">
                  No Q&A posts yet
                </h3>
                <p className="text-muted-foreground">
                  Start by posting your first question in the Q&A forum!
                </p>
              </Card>
            )
          ) : (
            <Card className="p-12 text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <Book className="w-12 h-12 mx-auto mb-4 text-purple-500/50" />
              <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-muted-foreground">
                Start sharing your course experiences!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 