"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Bookmark, ExternalLink } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Review } from "@/types/review"
import { useLanguage } from "@/providers/language-provider"
import { ReviewDialog } from "@/components/review-dialog"

interface ReviewCardProps {
  review: Review
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
    if (commentText.trim() === '') return

    await commentAction(review.id, commentText)
    setComments([...comments, commentText])
    setCommentText('')
  }

  const handleViewInCourse = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/course/${review.courseId}?reviewId=${review.id}`)
  }

  return (
    <>
      <Card className="p-4 mb-4">
        <div 
          className="flex gap-4 cursor-pointer"
          onClick={handleContentClick}
        >
          <div className="flex-1">
            <div className="font-mono text-lg font-bold">{review.courseId}</div>
            <div className="text-sm text-muted-foreground">{review.courseName}</div>
            <div className="flex mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating
                      ? "fill-primary text-primary"
                      : "fill-muted text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/course/${review.courseId}`)
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {content.seeReviews}
            </Button>
          </div>
          <div className="flex-[2]">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback>{review.userName[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{review.userName}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{review.review}</p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => likeAction(review.id)}>
                <ThumbsUp className="w-4 h-4 mr-2" />
                {review.likes} {content.likes}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => dislikeAction(review.id)}>
                <ThumbsDown className="w-4 h-4 mr-2" />
                {review.dislikes} {content.dislikes}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                {review.comments?.length || 0} {content.comments}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => bookmarkAction(review.id)}>
                <Bookmark className={`w-4 h-4 ${review.isBookmarked ? "fill-primary" : ""}`} />
              </Button>
            </div>
            {showComments && (
              <div className="mt-4">
                {comments.map((comment, index) => (
                  <p key={index} className="text-sm mb-2">{comment}</p>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input
                    className="flex-1"
                    placeholder={content.addComment}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Button onClick={handleAddComment}>
                    {content.post}
                  </Button>
                </div>
              </div>
            )}
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
