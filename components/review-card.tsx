"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Star, ThumbsUp, ThumbsDown, ExternalLink, Languages, ChevronDown, ChevronUp, MessageSquare, MoreVertical, Edit, Trash, Loader2, Flag, Smile } from "lucide-react"
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
import { useEditModal } from "@/contexts/edit-modal-context"
import { useNavigation } from "@/hooks/use-navigation"
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
  const [reportError, setReportError] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [isDeletingComment, setIsDeletingComment] = useState(false)
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [commentSortOrder, setCommentSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [isCommentReportDialogOpen, setIsCommentReportDialogOpen] = useState(false)
  const [isReportingComment, setIsReportingComment] = useState(false)
  const [commentReportReason, setCommentReportReason] = useState('')
  const [commentReportError, setCommentReportError] = useState<string | null>(null)
  const [commentToReport, setCommentToReport] = useState<string | null>(null)
  const [userReaction, setUserReaction] = useState<'thumbsUp' | 'heart' | 'laugh' | 'surprised' | 'sad' | 'none'>('none')
  const [reactions, setReactions] = useState(review.reactions || {
    thumbsUp: [],
    heart: [],
    laugh: [],
    surprised: [],
    sad: []
  })
  const [isReacting, setIsReacting] = useState(false)

  const canEdit = session?.user?.id === review.userId
  const { setIsEditModalOpen } = useEditModal()
  const { navigate } = useNavigation()

  // Update edit modal context when showEditModal changes
  useEffect(() => {
    setIsEditModalOpen(showEditModal)
    return () => {
      setIsEditModalOpen(false)
    }
  }, [showEditModal, setIsEditModalOpen])

  useEffect(() => {
    // Initialize user reaction
    if (session?.user?.email && review.reactions) {
      const userEmail = session.user.email
      if (review.reactions.thumbsUp?.includes(userEmail)) {
        setUserReaction('thumbsUp')
      } else if (review.reactions.heart?.includes(userEmail)) {
        setUserReaction('heart')
      } else if (review.reactions.laugh?.includes(userEmail)) {
        setUserReaction('laugh')
      } else if (review.reactions.surprised?.includes(userEmail)) {
        setUserReaction('surprised')
      } else if (review.reactions.sad?.includes(userEmail)) {
        setUserReaction('sad')
      } else {
        setUserReaction('none')
      }
    }
    setReactions(review.reactions || {
      thumbsUp: [],
      heart: [],
      laugh: [],
      surprised: [],
      sad: []
    })
  }, [review.reactions, session?.user?.email])

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
    navigate(`/course/${review.courseId}?reviewId=${review._id}`)
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

    // Clear any previous errors
    setReportError(null)
    setIsReporting(true)

    try {
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

      // Parse JSON response
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        const errorMessage = 'Failed to process server response. Please try again.'
        setReportError(errorMessage)
        toast({
          title: "Report Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        })
        return
      }

      if (!response.ok) {
        // Show the error message from the API - don't close dialog
        const errorMessage = data?.error || 'Failed to report review'
        console.log('Report error:', errorMessage, 'Status:', response.status)
        
        // Set error state to show in dialog
        setReportError(errorMessage)
        
        // Also show toast notification
        toast({
          title: "Report Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        })
        // Don't close the dialog on error so user can see the message
        return
      }

      // Success - close dialog and show success message
      setIsReportDialogOpen(false)
      setReportReason('') // Reset the reason
      setReportError(null) // Clear any errors
      
      toast({
        title: "Report Submitted",
        description: "Thank you for your report. We'll review it shortly.",
        duration: 4000
      })
      
      // If review is now hidden, trigger a custom event to notify parent components
      if (data.review?.isHidden) {
        // Dispatch a custom event to notify that a review was hidden
        window.dispatchEvent(new CustomEvent('reviewHidden', { detail: { reviewId: review._id } }))
        router.refresh()
      }
    } catch (error) {
      console.error('Error reporting review:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to report review. Please try again.'
      setReportError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
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

  const handleReaction = async (reactionType: 'thumbsUp' | 'heart' | 'laugh' | 'surprised' | 'sad' | 'none') => {
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to react to reviews",
        variant: "destructive"
      });
      return;
    }

    setIsReacting(true);
    try {
      const userId = session.user.email || session.user.id;
      const newReaction = userReaction === reactionType ? 'none' : reactionType;

      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: review._id,
          action: 'react',
          reaction: newReaction,
          userId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update reaction');
      }

      if (data.success && data.review) {
        const updatedReactions = data.review.reactions || {
          thumbsUp: [],
          heart: [],
          laugh: [],
          surprised: [],
          sad: []
        };
        setReactions(updatedReactions);
        setUserReaction(newReaction);
        
        // Update local review state
        setLocalReview((prev) => ({
          ...prev,
          reactions: updatedReactions
        }));
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update reaction",
        variant: "destructive"
      });
    } finally {
      setIsReacting(false);
    }
  };

  const handleReportComment = async () => {
    if (!commentReportReason || !commentToReport) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive"
      })
      return
    }

    setCommentReportError(null)
    setIsReportingComment(true)

    try {
      const response = await fetch('/api/comments/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId: commentToReport,
          commentType: 'review',
          reason: commentReportReason,
          reviewId: review._id
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        const errorMessage = 'Failed to process server response. Please try again.'
        setCommentReportError(errorMessage)
        toast({
          title: "Report Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        })
        return
      }

      if (!response.ok) {
        const errorMessage = data?.error || 'Failed to report comment'
        setCommentReportError(errorMessage)
        toast({
          title: "Report Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        })
        return
      }

      // Success - refresh comments to get updated state
      const reviewResponse = await fetch(`/api/reviews/${review._id}`)
      if (reviewResponse.ok) {
        const reviewData = await reviewResponse.json()
        if (reviewData.review?.comments) {
          setComments(reviewData.review.comments)
        }
      }

      toast({
        title: "Report Submitted",
        description: data.isHidden 
          ? "Thank you for your report. The comment has been hidden."
          : "Thank you for your report. We'll review it shortly.",
        duration: 5000
      })

      setIsCommentReportDialogOpen(false)
      setCommentReportReason('')
      setCommentToReport(null)

    } catch (error) {
      console.error('Error reporting comment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to report comment'
      setCommentReportError(errorMessage)
      toast({
        title: "Report Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setIsReportingComment(false)
    }
  };

  return (
    <>
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800 relative">
        <div className="p-3 sm:p-3 sm:p-4 pr-12 sm:pr-4">
          <div className="absolute top-2 right-2 sm:top-2 sm:right-2 z-10">
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
            {/* Mobile: Compact Course Info & User Section */}
            <div className="sm:hidden mb-2.5">
              <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/60 dark:from-purple-900/30 dark:to-pink-900/20 rounded-lg p-3 border border-purple-200/60 dark:border-purple-800/40">
                {/* Course Info - Prominent */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="font-mono text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {review.courseId}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 transition-transform duration-300 ${
                              i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {review.rating}/5
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">
                      {review.courseName}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTranslate()
                    }}
                    className="h-7 w-7 p-0 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 flex-shrink-0"
                    disabled={isTranslating}
                  >
                    <Languages className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {/* User Info - De-emphasized */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-purple-200/40 dark:border-purple-800/40">
                  <Avatar className="w-5 h-5 ring-1 ring-gray-300 dark:ring-gray-700 flex-shrink-0">
                    <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-[10px]">
                      {review.isAnonymous ? "A" : review.userName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-normal text-gray-500 dark:text-gray-500 truncate">
                      {review.isAnonymous ? "Anonymous" : review.userName}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {review.timestamp ? formatTimestamp(review.timestamp) : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Original layout */}
            <div className="hidden sm:flex sm:flex-row gap-3 sm:gap-4">
              <div className="w-full sm:w-48">
                <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-2.5 sm:p-3">
                  <div className="font-mono text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {review.courseId}
                  </div>
                  <div className="text-xs font-semibold mt-0.5 line-clamp-2 break-words">{review.courseName}</div>
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

              <div className="flex-1 min-w-0 pr-10 sm:pr-12">
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
                      className="h-6 sm:h-7 px-2 sm:px-2.5 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 text-[10px] sm:text-xs"
                      disabled={isTranslating}
                    >
                      <Languages className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
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
                
                {/* Desktop: Action buttons - positioned below review text, aligned with review section */}
                <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-start sm:gap-2 sm:mt-2">
                  {/* Reaction Buttons */}
                  <div className="flex items-center gap-1.5 bg-white/50 dark:bg-gray-800/50 rounded-full px-2.5 py-1.5 border border-purple-200 dark:border-purple-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction('thumbsUp')
                      }}
                      disabled={isReacting}
                      className={`h-7 w-7 p-0 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 ${
                        userReaction === 'thumbsUp' ? "bg-purple-100 dark:bg-purple-900/50" : ""
                      }`}
                      title="👍 Thumbs Up"
                    >
                      <span className="text-base">👍</span>
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[20px] text-center">
                      {reactions.thumbsUp?.length ?? 0}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction('heart')
                      }}
                      disabled={isReacting}
                      className={`h-7 w-7 p-0 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 ${
                        userReaction === 'heart' ? "bg-purple-100 dark:bg-purple-900/50" : ""
                      }`}
                      title="❤️ Heart"
                    >
                      <span className="text-base">❤️</span>
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[20px] text-center">
                      {reactions.heart?.length ?? 0}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction('laugh')
                      }}
                      disabled={isReacting}
                      className={`h-7 w-7 p-0 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 ${
                        userReaction === 'laugh' ? "bg-purple-100 dark:bg-purple-900/50" : ""
                      }`}
                      title="😂 Laugh"
                    >
                      <span className="text-base">😂</span>
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[20px] text-center">
                      {reactions.laugh?.length ?? 0}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction('surprised')
                      }}
                      disabled={isReacting}
                      className={`h-7 w-7 p-0 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 ${
                        userReaction === 'surprised' ? "bg-purple-100 dark:bg-purple-900/50" : ""
                      }`}
                      title="😮 Surprised"
                    >
                      <span className="text-base">😮</span>
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[20px] text-center">
                      {reactions.surprised?.length ?? 0}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction('sad')
                      }}
                      disabled={isReacting}
                      className={`h-7 w-7 p-0 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 ${
                        userReaction === 'sad' ? "bg-purple-100 dark:bg-purple-900/50" : ""
                      }`}
                      title="😢 Sad"
                    >
                      <span className="text-base">😢</span>
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[20px] text-center">
                      {reactions.sad?.length ?? 0}
                    </span>
                  </div>

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
                      navigate(`/course/${review.courseId}`)
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
              </div>
            </div>

            {/* Mobile: Compact Review Text Section */}
            <div className="sm:hidden">
              <div className="bg-gradient-to-br from-purple-50/70 via-pink-50/50 to-indigo-50/30 dark:from-purple-900/25 dark:via-pink-900/15 dark:to-indigo-900/15 rounded-lg p-3 mb-2.5 border border-purple-200/50 dark:border-purple-800/30">
                <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 font-normal break-words whitespace-pre-wrap">
                  {isTranslated ? translatedText : review.review}
                </p>
              </div>
              
              {/* Mobile: Compact Action buttons */}
              <div className="flex flex-col gap-1.5 mb-2">
                  {/* Mobile Reaction Buttons */}
                  <div className="flex items-center justify-between gap-1.5 bg-white/80 dark:bg-gray-800/80 rounded-xl px-3 py-2 border border-purple-200 dark:border-purple-800 w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction('thumbsUp')
                      }}
                      disabled={isReacting}
                      className={`h-8 w-8 p-0 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 ${
                        userReaction === 'thumbsUp' ? "bg-purple-100 dark:bg-purple-900/50" : ""
                      }`}
                      title="Thumbs up"
                    >
                      <span className="text-base">👍</span>
                    </Button>
                    <span className="text-[11px] text-muted-foreground min-w-[18px] text-center">
                      {reactions.thumbsUp?.length ?? 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction('heart')
                      }}
                      disabled={isReacting}
                      className={`h-8 w-8 p-0 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 ${
                        userReaction === 'heart' ? "bg-purple-100 dark:bg-purple-900/50" : ""
                      }`}
                      title="Heart"
                    >
                      <span className="text-base">❤️</span>
                    </Button>
                    <span className="text-[11px] text-muted-foreground min-w-[18px] text-center">
                      {reactions.heart?.length ?? 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction('laugh')
                      }}
                      disabled={isReacting}
                      className={`h-8 w-8 p-0 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 ${
                        userReaction === 'laugh' ? "bg-purple-100 dark:bg-purple-900/50" : ""
                      }`}
                      title="Laugh"
                    >
                      <span className="text-base">😂</span>
                    </Button>
                    <span className="text-[11px] text-muted-foreground min-w-[18px] text-center">
                      {reactions.laugh?.length ?? 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction('surprised')
                      }}
                      disabled={isReacting}
                      className={`h-8 w-8 p-0 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 ${
                        userReaction === 'surprised' ? "bg-purple-100 dark:bg-purple-900/50" : ""
                      }`}
                      title="Surprised"
                    >
                      <span className="text-base">😮</span>
                    </Button>
                    <span className="text-[11px] text-muted-foreground min-w-[18px] text-center">
                      {reactions.surprised?.length ?? 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction('sad')
                      }}
                      disabled={isReacting}
                      className={`h-8 w-8 p-0 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 ${
                        userReaction === 'sad' ? "bg-purple-100 dark:bg-purple-900/50" : ""
                      }`}
                      title="Sad"
                    >
                      <span className="text-base">😢</span>
                    </Button>
                    <span className="text-[11px] text-muted-foreground min-w-[18px] text-center">
                      {reactions.sad?.length ?? 0}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedComments(!expandedComments)
                      }}
                      className={`h-8 text-xs rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 flex-1 min-w-[100px] ${
                        expandedComments
                          ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
                          : ""
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      <span className="text-xs">
                        {comments.length} {content.comments}
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs bg-white/80 dark:bg-gray-800/80 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 rounded-full flex-1 min-w-[100px] border-purple-200 dark:border-purple-800"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/course/${review.courseId}`)
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      <span className="text-xs">Reviews</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProtectedAction(toggleBookmark);
                      }}
                      className={`h-8 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300 flex-1 min-w-[100px] ${
                        isBookmarked ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300" : ""
                      }`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : isBookmarked ? (
                        <BookmarkSolidIcon className="w-3.5 h-3.5 mr-1 text-purple-500" />
                      ) : (
                        <BookmarkIcon className="w-3.5 h-3.5 mr-1" />
                      )}
                      <span className="text-xs">
                        {isBookmarked ? "Saved" : "Save"}
                      </span>
                    </Button>
                  </div>
              </div>
            </div>

                {expandedComments && (
                  <div 
                    className="border-t border-purple-200/50 dark:border-purple-800/30 mt-2 pt-2 comments-section" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col sm:flex-row gap-1.5 mb-1.5">
                      <Input
                        placeholder={session ? "Write a comment..." : "Please sign in to comment"}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:ring-purple-500 text-sm h-8"
                        disabled={!session}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && session) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (session) {
                            handleAddComment();
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!newComment.trim() || !session}
                      >
                        Post
                      </Button>
                    </div>

                    {/* Comment Sort Control */}
                    <div className="flex items-center justify-between mb-1.5">
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

                    <div className="space-y-1.5">
                      {[...comments]
                        .filter((comment: any) => !comment.isHidden)
                        .sort((a, b) => {
                          const dateA = new Date(a.createdAt).getTime()
                          const dateB = new Date(b.createdAt).getTime()
                          return commentSortOrder === 'newest' ? dateB - dateA : dateA - dateB
                        }).map((comment) => (
                        <div
                          key={comment._id}
                          className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                              <Avatar className="w-5 h-5 flex-shrink-0">
                                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-[10px]">
                                  {comment.userName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-xs text-purple-700 dark:text-purple-300 truncate">
                                {comment.userName}
                              </span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {session?.user?.name === comment.userName && (
                                  <>
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
                                  </>
                                )}
                                {session?.user?.name !== comment.userName && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setCommentToReport(comment._id);
                                      setIsCommentReportDialogOpen(true);
                                    }}
                                  >
                                    <Flag className="w-4 h-4 mr-2" />
                                    Report
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
      </Card>

      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
      >
        <div className="p-4 sm:p-6 sm:pt-6">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 sm:mb-6">
            Edit Review
          </h2>
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

      <Dialog open={isReportDialogOpen} onOpenChange={(open) => {
        setIsReportDialogOpen(open)
        if (!open) {
          setReportReason('') // Reset when closing
          setReportError(null) // Clear errors when closing
        }
      }}>
        <DialogContent className="max-w-[90vw] sm:max-w-[500px] mx-4 sm:mx-auto p-4 sm:p-6 gap-4 sm:gap-6">
          <DialogHeader className="space-y-2 sm:space-y-3 px-0">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 flex-shrink-0">
                <Flag className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight">Report Review</DialogTitle>
                <DialogDescription className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Help us maintain a safe and respectful community
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-5 px-0">
            <div className="space-y-2 sm:space-y-3">
              <label className="text-sm sm:text-base font-medium text-foreground block">
                Why are you reporting this review?
              </label>
              <Select onValueChange={setReportReason} value={reportReason}>
                <SelectTrigger className="h-10 sm:h-11 w-full border-2 focus:ring-2 focus:ring-red-500 text-sm sm:text-base">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh] sm:max-h-[50vh] overflow-y-auto">
                  <SelectItem value="inappropriate" className="py-2.5 sm:py-3 cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm sm:text-base">Inappropriate Content</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">Offensive, explicit, or inappropriate material</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="spam" className="py-2.5 sm:py-3 cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm sm:text-base">Spam</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">Repetitive, promotional, or irrelevant content</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="harassment" className="py-2.5 sm:py-3 cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm sm:text-base">Harassment</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">Bullying, threats, or targeted attacks</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="misinformation" className="py-2.5 sm:py-3 cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm sm:text-base">Misinformation</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">False or misleading information</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="other" className="py-2.5 sm:py-3 cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm sm:text-base">Other</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">Another reason not listed</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 p-3 sm:p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-2.5">
                  <Flag className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-red-800 dark:text-red-300 leading-relaxed font-medium">
                    {reportError}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                <strong>Note:</strong> Reviews with 10 or more reports will be automatically hidden. Your report helps keep our community safe.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReportDialogOpen(false)
                  setReportReason('')
                }}
                disabled={isReporting}
                className="w-full sm:w-auto sm:min-w-[100px] h-10 sm:h-9"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReport}
                disabled={isReporting || !reportReason}
                className="w-full sm:w-auto sm:min-w-[140px] bg-red-600 hover:bg-red-700 text-white h-10 sm:h-9"
              >
                {isReporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reporting...
                  </>
                ) : (
                  <>
                    <Flag className="mr-2 h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comment Report Dialog */}
      <Dialog open={isCommentReportDialogOpen} onOpenChange={(open) => {
        setIsCommentReportDialogOpen(open)
        if (!open) {
          setCommentReportReason('')
          setCommentReportError(null)
          setCommentToReport(null)
        }
      }}>
        <DialogContent className="max-w-[90vw] sm:max-w-[500px] mx-4 sm:mx-auto p-4 sm:p-6 gap-4 sm:gap-6">
          <DialogHeader className="space-y-2 sm:space-y-3 px-0">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 flex-shrink-0">
                <Flag className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight">Report Comment</DialogTitle>
                <DialogDescription className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Help us maintain a safe and respectful community
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-5 px-0">
            <div className="space-y-2 sm:space-y-3">
              <label className="text-sm sm:text-base font-medium text-foreground block">
                Why are you reporting this comment?
              </label>
              <Select onValueChange={setCommentReportReason} value={commentReportReason}>
                <SelectTrigger className="h-10 sm:h-11 w-full border-2 focus:ring-2 focus:ring-red-500 text-sm sm:text-base">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh] sm:max-h-[50vh] overflow-y-auto">
                  <SelectItem value="inappropriate" className="py-2.5 sm:py-3 cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm sm:text-base">Inappropriate Content</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">Offensive, explicit, or inappropriate material</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="spam" className="py-2.5 sm:py-3 cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm sm:text-base">Spam</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">Repetitive, promotional, or irrelevant content</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="harassment" className="py-2.5 sm:py-3 cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm sm:text-base">Harassment</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">Bullying, threats, or targeted attacks</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="misinformation" className="py-2.5 sm:py-3 cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm sm:text-base">Misinformation</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">False or misleading information</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="other" className="py-2.5 sm:py-3 cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm sm:text-base">Other</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">Another reason not listed</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {commentReportError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 p-3 sm:p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-2.5">
                  <Flag className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-red-800 dark:text-red-300 leading-relaxed font-medium">
                    {commentReportError}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                <strong>Note:</strong> Comments with 10 or more reports will be automatically hidden. Your report helps keep our community safe.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCommentReportDialogOpen(false)
                  setCommentReportReason('')
                  setCommentToReport(null)
                }}
                disabled={isReportingComment}
                className="w-full sm:w-auto sm:min-w-[100px] h-10 sm:h-9"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReportComment}
                disabled={isReportingComment || !commentReportReason}
                className="w-full sm:w-auto sm:min-w-[140px] bg-red-600 hover:bg-red-700 text-white h-10 sm:h-9"
              >
                {isReportingComment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reporting...
                  </>
                ) : (
                  <>
                    <Flag className="mr-2 h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

