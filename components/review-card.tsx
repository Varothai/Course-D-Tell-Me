"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Star, ThumbsUp, ThumbsDown, ExternalLink, Languages, ChevronDown, ChevronUp, MessageSquare, MoreVertical, Edit, Trash, Loader2, Flag } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Review } from "@/types/review"
import { useLanguage } from "@/providers/language-provider"
import { ReviewDialog } from "@/components/review-dialog"
import { useReviews } from "@/providers/reviews-provider"
import { format } from "date-fns"
import { useProtectedAction } from "@/hooks/use-protected-action"
import { BookmarkIcon } from "@heroicons/react/24/outline"
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid"
import { useSession } from "next-auth/react"
import { toast } from "@/components/ui/use-toast"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { DeleteAlertDialog } from "@/components/delete-alert-dialog"
import { ReviewForm } from './review-form'
import { Modal } from "./modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface Comment {
  _id: string;
  comment: string;
  userName: string;
  userEmail?: string;
  createdAt: Date;
}

interface ReviewCardProps {
  review: Review & {
    isAnonymous?: boolean
    timestamp: string
    _id: string
    userId: string
  }
  likeAction: (id: string) => void
  dislikeAction: (id: string) => void
  bookmarkAction: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (reviewId: string, updatedReview: Review) => void
  initialBookmarkState?: boolean
}

export function ReviewCard({ 
  review, 
  likeAction, 
  dislikeAction, 
  bookmarkAction, 
  onDelete, 
  onEdit,
  initialBookmarkState = false
}: ReviewCardProps) {
  // console.log('Review data:', review);
  const router = useRouter()
  const [comment, setComment] = useState("")
  const [showComments, setShowComments] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { content } = useLanguage()
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<Comment[]>(review.comments || [])
  const { handleLike, handleDislike } = useReviews()
  const [localReview, setLocalReview] = useState(review)
  const [isTranslated, setIsTranslated] = useState(false)
  const [translatedText, setTranslatedText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const handleProtectedAction = useProtectedAction()
  const { data: session } = useSession()
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarkState)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedComments, setExpandedComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [isDeletingComment, setIsDeletingComment] = useState(false)
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [commentSortOrder, setCommentSortOrder] = useState<'newest' | 'oldest'>('newest')

  const canEdit = session?.user?.id === review.userId

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!session?.user) {
        setIsBookmarked(false)
        return
      }

      if (initialBookmarkState) {
        setIsBookmarked(true)
        return
      }

      try {
        const response = await fetch(`/api/bookmarks?reviewId=${review._id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch bookmark status")
        }
        const data = await response.json()
        setIsBookmarked(data.isBookmarked)
      } catch (error) {
        console.error("Error checking bookmark status:", error)
        setIsBookmarked(false)
      }
    }

    checkBookmarkStatus()
  }, [review._id, session?.user, initialBookmarkState])

  const handleContentClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && (
      e.target.closest('[role="menuitem"]') || 
      e.target.closest('[role="menu"]') ||
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('.comments-section')
    )) {
      return;
    }
    setIsOpen(true);
  }

  const handleAddComment = async () => {
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) return;

    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: review._id,
          action: 'comment',
          comment: newComment.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post comment');
      }

      if (data.success) {
        const newComments = data.review.comments || [];
        setComments(newComments);
        setNewComment('');
        toast({
          title: "Success",
          description: "Comment posted successfully"
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to post comment",
        variant: "destructive"
      });
    }
  };

  const handleViewInCourse = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/course/${review.courseId}?reviewId=${review._id}`)
  }

  const onLike = async () => {
    handleProtectedAction(async () => {
      await handleLike(review._id, localReview.hasLiked, localReview.hasDisliked)
      setLocalReview((prev) => ({
        ...prev,
        likes: prev.hasLiked ? prev.likes - 1 : prev.likes + 1,
        dislikes: prev.hasDisliked ? prev.dislikes - 1 : prev.dislikes,
        hasLiked: !prev.hasLiked,
        hasDisliked: false,
      }))
      likeAction(review._id)
    })
  }

  const onDislike = async () => {
    handleProtectedAction(async () => {
      await handleDislike(review._id, localReview.hasLiked, localReview.hasDisliked)
      setLocalReview((prev) => ({
        ...prev,
        dislikes: prev.hasDisliked ? prev.dislikes - 1 : prev.dislikes + 1,
        likes: prev.hasLiked ? prev.likes - 1 : prev.likes,
        hasDisliked: !prev.hasDisliked,
        hasLiked: false,
      }))
      dislikeAction(review._id)
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
      const targetLang = containsThai ? "en" : "th"

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: review.review,
          targetLang,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTranslatedText(data.translatedText)
        setIsTranslated(true)
      } else {
        console.error("Translation failed:", data.error)
      }
    } catch (error) {
      console.error("Translation error:", error)
    } finally {
      setIsTranslating(false)
    }
  }

  const toggleBookmark = async () => {
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark reviews",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const method = isBookmarked ? "DELETE" : "POST";
      const response = await fetch("/api/bookmarks", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewId: review._id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to toggle bookmark");
      }

      setIsBookmarked(!isBookmarked);
      if (bookmarkAction) {
        bookmarkAction(review._id);
      }

      toast({
        title: isBookmarked ? "Bookmark removed" : "Review bookmarked",
        description: isBookmarked 
          ? "Review removed from your bookmarks" 
          : "Review saved to your bookmarks page",
      });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditComplete = (updatedReview: Review) => {
    setShowEditModal(false)
    // Update the local review state with the edited review
    setLocalReview({
      ...localReview,
      ...updatedReview,
      _id: review._id,
      timestamp: review.timestamp,
      isAnonymous: review.isAnonymous
    })
    // Call the onEdit callback
    onEdit?.(review._id, updatedReview)
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reviews/${review._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      toast({
        title: "Success",
        description: "Your review has been deleted",
      });
      
      if (onDelete) {
        onDelete(review.id || review._id);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'MMM d, yyyy h:mm a'); // This will display like "Jan 15, 2024 2:30 PM"
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive"
      })
      return
    }

    try {
      setIsReporting(true)
      const response = await fetch('/api/reviews/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: review._id,
          reason: reportReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to report review')
      }

      setIsReportDialogOpen(false)
      toast({
        title: "Success",
        description: "Review reported successfully"
      })
      
      // If review is now hidden, you might want to refresh the page or update the UI
      if (data.review.isHidden) {
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to report review',
        variant: "destructive"
      })
    } finally {
      setIsReporting(false)
    }
  }

  const handleEditComment = async (commentId: string, newText: string) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: review._id,
          action: 'editComment',
          commentId,
          newComment: newText.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit comment');
      }

      if (data.success) {
        const newComments = data.review.comments || [];
        setComments(newComments);
        setEditingCommentId(null);
        setEditingCommentText('');
        toast({
          title: "Success",
          description: "Comment edited successfully"
        });
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to edit comment",
        variant: "destructive"
      });
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    setIsDeletingComment(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: review._id,
          action: 'deleteComment',
          commentId: commentToDelete
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete comment');
      }

      if (data.success) {
        const newComments = data.review.comments || [];
        setComments(newComments);
        setShowDeleteCommentDialog(false);
        setCommentToDelete(null);
        toast({
          title: "Success",
          description: "Comment deleted successfully"
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete comment",
        variant: "destructive"
      });
    } finally {
      setIsDeletingComment(false);
    }
  };

  return (
    <>
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800 relative">
        <div className="p-3 sm:p-4">
          <div className="absolute top-2 right-2 sm:top-2 sm:right-2">
            {canEdit ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 sm:h-8 sm:w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 sm:h-8 sm:w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsReportDialogOpen(true);
                    }}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div onClick={handleContentClick} className="cursor-pointer">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="w-full sm:w-48">
                <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-2.5 sm:p-3">
                  <div className="font-mono text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {review.courseId}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 break-words">{review.courseName}</div>
                  <div className="flex mt-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ${
                          i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7 sm:w-6 sm:h-6 ring-2 ring-purple-200 dark:ring-purple-800 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
                        {review.isAnonymous ? "A" : review.userName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm sm:text-sm font-medium text-purple-700 dark:text-purple-300 truncate">
                        {review.isAnonymous ? "Anonymous" : review.userName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {review.timestamp ? formatTimestamp(review.timestamp) : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end sm:justify-start">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTranslate()
                      }}
                      className="h-8 sm:h-7 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 text-xs"
                      disabled={isTranslating}
                    >
                      <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">
                        {isTranslating ? "Translating..." : isTranslated ? "Show Original" : "Translate"}
                      </span>
                      <span className="sm:hidden">
                        {isTranslating ? "..." : isTranslated ? "Original" : "Translate"}
                      </span>
                    </Button>
                  </div>
                </div>

                <p className="text-sm sm:text-sm leading-relaxed mb-3 sm:mb-4 break-words">{isTranslated ? translatedText : review.review}</p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedComments(!expandedComments)
                    }}
                    className={`h-9 sm:h-7 text-xs rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 min-h-[36px] ${
                      expandedComments
                        ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
                        : ""
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-1" />
                    <span className="text-xs">
                      {comments.length} {content.comments}
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 sm:h-8 text-xs bg-white/50 dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 rounded-full min-h-[36px]"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/course/${review.courseId}`)
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5 sm:w-3 sm:h-3 mr-1.5" />
                    <span className="hidden sm:inline">{content.seeReviews}</span>
                    <span className="sm:hidden">Reviews</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProtectedAction(toggleBookmark);
                    }}
                    className={`h-9 sm:h-8 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 min-h-[36px] ${
                      isBookmarked ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300" : ""
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isBookmarked ? (
                      <BookmarkSolidIcon className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 mr-1.5 text-purple-500" />
                    ) : (
                      <BookmarkIcon className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 mr-1.5" />
                    )}
                    <span className="text-xs hidden sm:inline">
                      {isBookmarked ? "Bookmarked" : "Bookmark"}
                    </span>
                    <span className="text-xs sm:hidden">
                      {isBookmarked ? "Saved" : "Save"}
                    </span>
                  </Button>
                </div>

                {expandedComments && (
                  <div 
                    className="border-t mt-2 pt-2 comments-section" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col sm:flex-row gap-1.5 mb-2">
                      <Input
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:ring-purple-500 text-sm h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddComment();
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs px-4"
                        disabled={!newComment.trim() || !session}
                      >
                        Post
                      </Button>
                    </div>

                    {/* Comment Sort Control */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Sort by:</span>
                      <Select
                        value={commentSortOrder}
                        onValueChange={(value: 'newest' | 'oldest') => {
                          setCommentSortOrder(value)
                        }}
                      >
                        <SelectTrigger className="w-28 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      {[...comments].sort((a, b) => {
                        const dateA = new Date(a.createdAt).getTime()
                        const dateB = new Date(b.createdAt).getTime()
                        return commentSortOrder === 'newest' ? dateB - dateA : dateA - dateB
                      }).map((comment) => (
                        <div
                          key={comment._id}
                          className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-[10px]">
                                  {comment.userName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-xs text-purple-700 dark:text-purple-300">
                                {comment.userName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {session?.user?.name === comment.userName && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setEditingCommentId(comment._id);
                                      setEditingCommentText(comment.comment);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-700"
                                    onClick={() => {
                                      setCommentToDelete(comment._id);
                                      setShowDeleteCommentDialog(true);
                                    }}
                                  >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          {editingCommentId === comment._id ? (
                            <div className="flex flex-col sm:flex-row gap-1.5 mt-1.5">
                              <Input
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="flex-1 bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:ring-purple-500 text-sm h-8"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleEditComment(comment._id, editingCommentText);
                                  }
                                }}
                              />
                              <div className="flex gap-1.5">
                                <Button
                                  onClick={() => handleEditComment(comment._id, editingCommentText)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs px-3"
                                  disabled={!editingCommentText.trim()}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditingCommentText('');
                                  }}
                                  className="h-8 text-xs px-3"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                              {comment.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Edit Review</h2>
          <ReviewForm
            initialData={review}
            isEditing={true}
            onEditComplete={handleEditComplete}
            onCancel={() => setShowEditModal(false)}
          />
        </div>
      </Modal>

      <DeleteAlertDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <DeleteAlertDialog 
        open={showDeleteCommentDialog}
        onOpenChange={setShowDeleteCommentDialog}
        onConfirm={handleDeleteComment}
        isDeleting={isDeletingComment}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
      />

      <ReviewDialog review={review} open={isOpen} action={setIsOpen} />

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Review</DialogTitle>
            <DialogDescription>
              Please select a reason for reporting this review. Multiple reports may result in the review being hidden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Select onValueChange={setReportReason} value={reportReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="misinformation">Misinformation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsReportDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReport}
                disabled={isReporting || !reportReason}
              >
                {isReporting ? 'Reporting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

