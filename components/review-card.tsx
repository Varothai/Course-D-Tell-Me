"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Bookmark, ExternalLink, Languages } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Review } from "@/types/review"
import { useLanguage } from "@/providers/language-provider"
import { ReviewDialog } from "@/components/review-dialog"
import { useReviews } from "@/providers/reviews-provider"
import { formatDistanceToNow, format } from 'date-fns'
import { useProtectedAction } from '@/hooks/use-protected-action'

interface ReviewCardProps {
  review: Review & {
    isAnonymous?: boolean
  }
  likeAction: (id: string) => void
  dislikeAction: (id: string) => void
  commentAction: (id: string, comment: string) => void
  bookmarkAction: (id: string) => void
}

export function ReviewCard({ 
  review, 
  likeAction, 
  dislikeAction, 
  commentAction, 
  bookmarkAction 
}: ReviewCardProps) {
  const router = useRouter()
  const [comment, setComment] = useState("")
  const [showComments, setShowComments] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { content } = useLanguage()
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<string[]>([])
  const { handleLike, handleDislike } = useReviews()
  const [localReview, setLocalReview] = useState(review)
  const [isTranslated, setIsTranslated] = useState(false)
  const [translatedText, setTranslatedText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const handleProtectedAction = useProtectedAction()

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/comments?reviewId=${review.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch comments')
        }
        const data = await response.json()
        if (data.success) {
          setComments(data.comments.map((c: any) => c.comment))
        } else {
          console.error('Error fetching comments:', data.error)
        }
      } catch (error) {
        console.error('Error fetching comments:', error)
      }
    }

    fetchComments()
  }, [review.id])

  const handleContentClick = (e: React.MouseEvent) => {
    if (
      e.target instanceof HTMLElement && 
      (e.target.closest('button') || e.target.closest('input'))
    ) {
      return
    }
    setIsOpen(true)
  }

  const handleAddComment = async () => {
    handleProtectedAction(async () => {
      if (commentText.trim() === '') return

      await commentAction(review.id, commentText)
      setComments([...comments, commentText])
      setCommentText('')
    })
  }

  const handleViewInCourse = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/course/${review.courseId}?reviewId=${review.id}`)
  }

  const onLike = async () => {
    handleProtectedAction(async () => {
      await handleLike(review.id, localReview.hasLiked, localReview.hasDisliked)
      setLocalReview(prev => ({
        ...prev,
        likes: prev.hasLiked ? prev.likes - 1 : prev.likes + 1,
        dislikes: prev.hasDisliked ? prev.dislikes - 1 : prev.dislikes,
        hasLiked: !prev.hasLiked,
        hasDisliked: false
      }))
      likeAction(review.id)
    })
  }

  const onDislike = async () => {
    handleProtectedAction(async () => {
      await handleDislike(review.id, localReview.hasLiked, localReview.hasDisliked)
      setLocalReview(prev => ({
        ...prev,
        dislikes: prev.hasDisliked ? prev.dislikes - 1 : prev.dislikes + 1,
        likes: prev.hasLiked ? prev.likes - 1 : prev.likes,
        hasDisliked: !prev.hasDisliked,
        hasLiked: false
      }))
      dislikeAction(review.id)
    })
  }

  const handleTranslate = async () => {
    if (isTranslated) {
      setIsTranslated(false)
      return
    }

    try {
      setIsTranslating(true)
      // Detect if text contains Thai characters
      const containsThai = /[\u0E00-\u0E7F]/.test(review.review)
      const targetLang = containsThai ? 'en' : 'th'
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: review.review,
          targetLang
        })
      })

      const data = await response.json()
      if (data.success) {
        setTranslatedText(data.translatedText)
        setIsTranslated(true)
      } else {
        console.error('Translation failed:', data.error)
      }
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setIsTranslating(false)
    }
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleProtectedAction(() => {
      bookmarkAction(review.id)
    })
  }

  return (
    <>
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800">
        <div 
          className="p-4 cursor-pointer"
          onClick={handleContentClick}
        >
          <div className="flex gap-4">
            {/* Course Info Section */}
            <div className="w-48">
              <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="font-mono text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {review.courseId}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{review.courseName}</div>
                <div className="flex mt-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 transition-transform duration-300 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Review Content Section */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6 ring-2 ring-purple-200 dark:ring-purple-800">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
                      {review.isAnonymous ? 'A' : review.userName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      {review.isAnonymous ? 'Anonymous' : review.userName}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {review.timestamp ? format(new Date(review.timestamp), 'MMM d, yyyy') : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="rounded-full w-8 h-8 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                    onClick={handleBookmark}
                  >
                    <Bookmark className={`w-4 h-4 transition-colors duration-300 ${review.isBookmarked ? "fill-purple-500 text-purple-500" : ""}`} />
                  </Button>

                  {/* Translation Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTranslate()
                    }}
                    className="ml-2 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300"
                    disabled={isTranslating}
                  >
                    <Languages className="w-4 h-4 mr-2" />
                    {isTranslating ? (
                      <span className="text-xs">Translating...</span>
                    ) : isTranslated ? (
                      <span className="text-xs">Show Original</span>
                    ) : (
                      <span className="text-xs">Translate</span>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-4">
                {isTranslated ? translatedText : review.review}
              </p>

              {/* Bottom Actions Section */}
              <div className="flex items-center justify-between">
                {/* Like/Dislike Buttons */}
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onLike()
                    }}
                    className={`h-8 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 ${
                      localReview.hasLiked ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300" : ""
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 mr-1.5 transition-transform duration-300 hover:scale-110 ${
                      localReview.hasLiked ? "fill-purple-500 text-purple-500" : ""
                    }`} />
                    <span className="text-xs">{localReview.likes} {content.likes}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDislike()
                    }}
                    className={`h-8 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 ${
                      localReview.hasDisliked ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300" : ""
                    }`}
                  >
                    <ThumbsDown className={`w-3.5 h-3.5 mr-1.5 transition-transform duration-300 hover:scale-110 ${
                      localReview.hasDisliked ? "fill-purple-500 text-purple-500" : ""
                    }`} />
                    <span className="text-xs">{localReview.dislikes} {content.dislikes}</span>
                  </Button>
                </div>

                {/* See Reviews Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs bg-white/50 dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/course/${review.courseId}`)
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1.5" />
                  {content.seeReviews}
                </Button>
              </div>

              {/* Comments Section */}
              {showComments && (
                <div className="mt-4 space-y-3">
                  {comments.map((comment, index) => (
                    <div key={index} className="bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-2">
                      <p className="text-xs">{comment}</p>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-3">
                    <Input
                      className="flex-1 h-8 text-xs rounded-full bg-white/50 dark:bg-gray-900/50 border-purple-200 dark:border-purple-800 focus:ring-purple-500 focus:border-purple-500"
                      placeholder={content.addComment}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <Button 
                      onClick={handleAddComment}
                      className="h-8 text-xs rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      {content.post}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <ReviewDialog 
        review={review} 
        open={isOpen} 
        action={setIsOpen}
      />
    </>
  )
}
