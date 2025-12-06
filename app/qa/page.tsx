"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, ThumbsUp, ThumbsDown, Bookmark, ChevronDown, ChevronUp, MoreVertical, Edit, Trash, Search, MoreHorizontal, Building2, Globe } from 'lucide-react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
const QAFormDialog = dynamic(
  () => import("@/components/qa-form-dialog").then(mod => mod.QAFormDialog),
  { loading: () => <div className="p-4 text-sm text-muted-foreground text-center">Loading...</div> }
)
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
const DeleteDialog = dynamic(
  () => import("@/components/delete-dialog").then(mod => mod.DeleteDialog),
  { loading: () => <div className="p-4 text-sm text-muted-foreground text-center">Preparing...</div> }
)
const DeleteAlertDialog = dynamic(
  () => import("@/components/delete-alert-dialog").then(mod => mod.DeleteAlertDialog),
  { loading: () => <div className="p-4 text-sm text-muted-foreground text-center">Preparing...</div> }
)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Flag, Loader2 } from "lucide-react"
import { analyzeText } from '@/utils/text-analysis'

interface Comment {
  _id?: string
  content: string
  userName: string
  timestamp: string
  userEmail?: string
  userProvider?: 'google' | 'cmu'
}

interface QA {
  _id: string
  question: string
  userName: string
  timestamp: string
  userEmail?: string
  userProvider?: 'google' | 'cmu'
  comments: Comment[]
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

export default function QAPage() {
  const { content } = useLanguage()
  const [qas, setQAs] = useState<QA[]>([])
  const [comments, setComments] = useState<Record<string, string>>({})
  const [isWriting, setIsWriting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [commentSortOrder, setCommentSortOrder] = useState<Record<string, 'newest' | 'oldest'>>({})
  const [qaToEdit, setQaToEdit] = useState<QA | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [isDeletingComment, setIsDeletingComment] = useState(false)
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<{qaId: string, commentId: string} | null>(null)
  const [isCommentReportDialogOpen, setIsCommentReportDialogOpen] = useState(false)
  const [isReportingComment, setIsReportingComment] = useState(false)
  const [commentReportReason, setCommentReportReason] = useState('')
  const [commentReportError, setCommentReportError] = useState<string | null>(null)
  const [commentToReport, setCommentToReport] = useState<{qaId: string, commentId: string} | null>(null)
  const [isAnalyzingComment, setIsAnalyzingComment] = useState(false)
  const [commentAnalysisResult, setCommentAnalysisResult] = useState<{
    isInappropriate: boolean;
    confidence: number;
    severity: 'low' | 'medium' | 'high';
    inappropriateWords: string[];
  } | null>(null)
  const qaCache = useRef<Record<string, QA[]>>({})
  const abortControllerRef = useRef<AbortController | null>(null)
  
  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async (search: string = '') => {
    const cacheKey = search?.toLowerCase() || 'all'
    if (qaCache.current[cacheKey]) {
      setQAs(qaCache.current[cacheKey])
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setIsSearching(true)
      const url = search 
        ? `/api/qa?search=${encodeURIComponent(search)}`
        : '/api/qa'
        
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      })
      const data = await response.json()
      if (data.success) {
        const sortedQAs = data.qas.sort((a: QA, b: QA) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })
        qaCache.current[cacheKey] = sortedQAs
        setQAs(sortedQAs)
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return
      }
      console.error("Error fetching questions:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchQuestions(searchQuery.trim())
  }

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
  }
  }, [])

  const handleNewQuestion = async (question: string) => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to post a question",
        variant: "destructive"
      })
      return
    }

    if (isSubmitting) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userEmail: session.user?.email
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Add the new question to the beginning of the list
        setQAs(prevQas => [data.qa, ...prevQas])
        setIsWriting(false)
        toast({
          title: "Success",
          description: "Your question has been posted",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to post your question",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error posting question:", error)
      toast({
        title: "Error",
        description: "Failed to post your question",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComment = async (qaId: string) => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to comment",
        variant: "destructive"
      })
      return
    }

    const commentContent = comments[qaId]?.trim()
    if (!commentContent) return

    setIsAnalyzingComment(true)
    
    try {
      const analysis = await analyzeText(commentContent)
      
      if (analysis.isInappropriate) {
        setCommentAnalysisResult(analysis)
        setIsAnalyzingComment(false)
        return
      }
      
      setCommentAnalysisResult(null)

      const response = await fetch(`/api/qa/${qaId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: commentContent,
          userEmail: session.user?.email
        }),
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        // Ensure the comment has a properly formatted _id
        const newComment = {
          ...data.comment,
          _id: data.comment._id?.toString() || data.comment._id || ''
        }
        
        // Update the local state with the new comment
        setQAs(prevQAs => prevQAs.map(qa => {
          if (qa._id === qaId) {
            return {
              ...qa,
              comments: [...qa.comments, newComment]
            }
          }
          return qa
        }))
        
        // Clear the comment input
        setComments(prev => ({ ...prev, [qaId]: '' }))
        
        toast({
          title: "Success",
          description: "Your comment has been posted",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to post your comment",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      toast({
        title: "Error",
        description: "Failed to post your comment",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzingComment(false)
    }
  }

  const toggleComments = (qaId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [qaId]: !prev[qaId]
    }))
  }

  const handleEditQuestion = async (question: string) => {
    if (!qaToEdit) return

    try {
      const response = await fetch(`/api/qa/${qaToEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      })

      const data = await response.json()

      if (response.ok) {
        // Update the state with the returned question data
        setQAs(prevQAs => prevQAs.map(qa => 
          qa._id === qaToEdit._id ? data.qa : qa
        ))
        setShowEditModal(false)
        setQaToEdit(null)
        toast({
          title: "Success",
          description: "Your question has been updated",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update your question",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating question:", error)
      toast({
        title: "Error",
        description: "Failed to update your question",
        variant: "destructive"
      })
    }
  }

  const handleDeleteQuestion = async () => {
    if (!qaToEdit) return

    try {
      const response = await fetch(`/api/qa/${qaToEdit._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setQAs(prevQAs => prevQAs.filter(qa => qa._id !== qaToEdit._id))
        setShowDeleteDialog(false)
        setQaToEdit(null)
        toast({
          title: "Success",
          description: "Your question has been deleted",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete your question",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting question:", error)
      toast({
        title: "Error",
        description: "Failed to delete your question",
        variant: "destructive"
      })
    }
  }

  const handleEditComment = async (qaId: string, commentId: string, newText: string) => {
    setIsAnalyzingComment(true)
    
    try {
      const analysis = await analyzeText(newText.trim())
      
      if (analysis.isInappropriate) {
        setCommentAnalysisResult(analysis)
        setIsAnalyzingComment(false)
        return
      }
      
      setCommentAnalysisResult(null)

      const response = await fetch(`/api/qa/${qaId}/comment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          content: newText.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit comment');
      }

      if (data.success) {
        // Update the local state with the edited comment
        setQAs(prevQAs => prevQAs.map(qa => {
          if (qa._id === qaId) {
            return {
              ...qa,
              comments: qa.comments.map(comment => {
                const commentIdStr = comment._id?.toString() || comment._id;
                if (commentIdStr === commentId) {
                  return {
                    ...data.comment,
                    _id: data.comment._id?.toString() || data.comment._id || commentId
                  };
                }
                return comment;
              })
            }
          }
          return qa
        }));
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
    } finally {
      setIsAnalyzingComment(false)
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    setIsDeletingComment(true);
    try {
      const response = await fetch(`/api/qa/${commentToDelete.qaId}/comment`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId: commentToDelete.commentId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete comment');
      }

      if (data.success) {
        // Update the local state by removing the deleted comment
        setQAs(prevQAs => prevQAs.map(qa => {
          if (qa._id === commentToDelete.qaId) {
            return {
              ...qa,
              comments: qa.comments.filter(comment => {
                const commentIdStr = comment._id?.toString() || comment._id;
                return commentIdStr !== commentToDelete.commentId;
              })
            }
          }
          return qa
        }));
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
      const response = await fetch(`/api/qa/${commentToReport.qaId}/comment/${commentToReport.commentId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: commentReportReason
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

      // Success - refresh the QA to get updated comment state
      const qaResponse = await fetch(`/api/qa/${commentToReport.qaId}`)
      if (qaResponse.ok) {
        const qaData = await qaResponse.json()
        if (qaData.qa) {
          setQAs(prevQAs => prevQAs.map(qa => 
            qa._id === commentToReport.qaId ? qaData.qa : qa
          ))
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
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50 dark:from-slate-950 dark:via-indigo-950/50 dark:to-purple-950/30 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/10 dark:to-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-400/20 dark:from-pink-600/10 dark:to-rose-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 dark:from-blue-600/10 dark:to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]" />
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
        {/* Header Section with Mascot */}
        <div className="relative mb-6 sm:mb-12 bg-white/80 dark:bg-gray-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 backdrop-blur-sm shadow-lg transition-all duration-300 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto">
              <div className="relative w-16 h-16 sm:w-24 sm:h-24 group flex-shrink-0">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-75 group-hover:opacity-100 blur transition-all duration-500" />
                <div className="relative bg-white dark:bg-gray-800 rounded-full p-2">
                  <img
                    src="/elephant-mascot.png"
                    alt="Cute elephant mascot"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Q&A Forum
              </h1>
            </div>

            <Button 
              onClick={() => setIsWriting(true)}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-full px-4 sm:px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto text-sm sm:text-base"
            >
              {content.writeQA}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/90 dark:bg-gray-800/90 border-purple-200 dark:border-purple-800 focus:ring-purple-500 text-base"
              />
            </div>
            <Button 
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto min-h-[44px]"
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </div>

        <QAFormDialog
          open={isWriting}
          action={setIsWriting}
          submitAction={handleNewQuestion}
        />

        <QAFormDialog
          open={showEditModal}
          action={setShowEditModal}
          submitAction={handleEditQuestion}
          initialQuestion={qaToEdit?.question}
          mode="edit"
        />

        <DeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteQuestion}
        />

        {/* Questions List */}
        <div className="space-y-4 sm:space-y-6 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-4 sm:p-8">
          {qas.map((qa) => (
            <div key={qa._id} className="transition-all duration-300">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800">
                <div className="p-4 sm:p-6">
                  {/* Top section with user info and dropdown */}
                  <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-purple-200 dark:ring-purple-800 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs sm:text-sm">
                          {qa.userName[0]}
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

                    {/* Edit/Delete Dropdown */}
                    {session?.user?.name === qa.userName && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-9 w-9 sm:h-8 sm:w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setQaToEdit(qa);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => {
                              setQaToEdit(qa);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  {/* Question Content */}
                  <p className="mb-4 sm:mb-6 text-base sm:text-lg break-words">{qa.question}</p>
                  
                  {/* Comments Section */}
                  <div className="border-t pt-2">
                    <button
                      onClick={() => toggleComments(qa._id)}
                      className="w-full flex items-center justify-between gap-2 mb-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 p-1.5 rounded-md transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <h3 className="text-sm font-semibold">
                          Comments ({qa.comments.length})
                        </h3>
                      </div>
                      <div className="text-purple-600 dark:text-purple-400 flex-shrink-0">
                        {expandedComments[qa._id] ? (
                          <ChevronUp className="w-4 h-4 transition-transform group-hover:scale-110" />
                        ) : (
                          <ChevronDown className="w-4 h-4 transition-transform group-hover:scale-110" />
                        )}
                      </div>
                    </button>
                    
                    {expandedComments[qa._id] && (
                      <>
                        {/* Add Comment Form */}
                        <div className="space-y-2 mb-2">
                          <div className="flex flex-col sm:flex-row gap-1.5">
                            <Input
                              placeholder="Write a comment..."
                              value={comments[qa._id] || ''}
                              onChange={(e) => {
                                setComments(prev => ({
                                  ...prev,
                                  [qa._id]: e.target.value
                                }))
                                // Clear analysis result when user types
                                if (commentAnalysisResult) {
                                  setCommentAnalysisResult(null)
                                }
                              }}
                              className="bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:ring-purple-500 text-sm flex-1 h-8"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleComment(qa._id)
                                }
                              }}
                            />
                            <Button 
                              onClick={() => handleComment(qa._id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto h-8 text-xs px-4"
                              disabled={!comments[qa._id]?.trim() || isAnalyzingComment}
                            >
                              {isAnalyzingComment ? (
                                <div className="flex items-center gap-1.5">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Analyzing...</span>
                                </div>
                              ) : (
                                'Post'
                              )}
                            </Button>
                          </div>

                          {/* Comment Analysis Warning */}
                          {commentAnalysisResult && commentAnalysisResult.isInappropriate && (
                            <div className="relative overflow-hidden">
                              <div className={`p-3 sm:p-4 rounded-lg border-2 backdrop-blur-sm shadow-lg animate-fade-in
                                ${commentAnalysisResult.severity === 'high' 
                                  ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                                  : commentAnalysisResult.severity === 'medium'
                                    ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                                    : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                                }`}
                              >
                                {/* Warning Icon */}
                                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                  <div className={`p-1.5 sm:p-2 rounded-full 
                                    ${commentAnalysisResult.severity === 'high'
                                      ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                                      : commentAnalysisResult.severity === 'medium'
                                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300'
                                        : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300'
                                    }`}
                                  >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                      />
                                    </svg>
                                  </div>
                                  <h3 className={`text-sm sm:text-base font-semibold
                                    ${commentAnalysisResult.severity === 'high'
                                      ? 'text-red-800 dark:text-red-200'
                                      : commentAnalysisResult.severity === 'medium'
                                        ? 'text-orange-800 dark:text-orange-200'
                                        : 'text-yellow-800 dark:text-yellow-200'
                                    }`}
                                  >
                                    {content.review.inappropriateWarning}
                                  </h3>
                                </div>

                                {/* Found Words */}
                                {commentAnalysisResult.inappropriateWords.length > 0 && (
                                  <div className="mb-2 sm:mb-3 p-2 sm:p-3 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                      {commentAnalysisResult.inappropriateWords.map((word, index) => (
                                        <span key={index} 
                                          className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-mono
                                            ${commentAnalysisResult.severity === 'high'
                                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                              : commentAnalysisResult.severity === 'medium'
                                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                                            }`}
                                        >
                                          {word}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}           
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Comment Sort Control */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Sort by:</span>
                          <Select
                            value={commentSortOrder[qa._id] || 'newest'}
                            onValueChange={(value: 'newest' | 'oldest') => {
                              setCommentSortOrder(prev => ({ ...prev, [qa._id]: value }))
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
                        {/* Existing Comments */}
                        <div className="space-y-2 mb-2">
                          {[...qa.comments]
                            .filter((comment: any) => !comment.isHidden)
                            .sort((a, b) => {
                              const sortOrder = commentSortOrder[qa._id] || 'newest'
                              const dateA = new Date(a.timestamp).getTime()
                              const dateB = new Date(b.timestamp).getTime()
                              return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
                            }).map((comment) => (
                            <div 
                              key={comment._id} 
                              className="bg-gray-50 dark:bg-gray-900/50 p-2 sm:p-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                                  <Avatar className="w-5 h-5 flex-shrink-0">
                                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-[10px]">
                                      {comment.userName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-xs text-purple-700 dark:text-purple-300 truncate">
                                    {comment.userName}
                                  </span>
                                  {(() => {
                                    const provider = getProvider(comment.userProvider, comment.userEmail)
                                    if (provider === 'cmu') {
                                      return (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                          <Building2 className="w-3 h-3" />
                                          CMU
                                        </span>
                                      )
                                    } else if (provider === 'google') {
                                      return (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                          <Globe className="w-3 h-3" />
                                          Google
                                        </span>
                                      )
                                    }
                                    return null
                                  })()}
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {comment.timestamp}
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
                                      {session?.user?.email === comment.userEmail && (
                                        <>
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              const commentId = comment._id?.toString() || comment._id || '';
                                              setEditingCommentId(commentId);
                                              setEditingCommentText(comment.content);
                                            }}
                                          >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            className="text-red-600 focus:text-red-700"
                                            onClick={() => {
                                              const commentId = comment._id?.toString() || comment._id || '';
                                              setCommentToDelete({ qaId: qa._id, commentId });
                                              setShowDeleteCommentDialog(true);
                                            }}
                                          >
                                            <Trash className="w-4 h-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      {session?.user?.email !== comment.userEmail && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            const commentId = comment._id?.toString() || comment._id || '';
                                            setCommentToReport({ qaId: qa._id, commentId });
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
                              {editingCommentId && comment._id && String(editingCommentId) === String(comment._id) ? (
                                <div className="space-y-1.5 mt-1.5">
                                  <div className="flex flex-col sm:flex-row gap-1.5">
                                    <Input
                                      value={editingCommentText}
                                      onChange={(e) => {
                                        setEditingCommentText(e.target.value)
                                        // Clear analysis result when user types
                                        if (commentAnalysisResult) {
                                          setCommentAnalysisResult(null)
                                        }
                                      }}
                                      className="flex-1 bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:ring-purple-500 text-sm h-8"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey && comment._id) {
                                          e.preventDefault();
                                          const commentId = comment._id.toString() || comment._id;
                                          handleEditComment(qa._id, commentId, editingCommentText);
                                        }
                                      }}
                                    />
                                    <div className="flex gap-1.5">
                                    <Button
                                        onClick={() => {
                                          if (comment._id) {
                                            const commentId = comment._id.toString() || comment._id;
                                            handleEditComment(qa._id, commentId, editingCommentText);
                                          }
                                        }}
                                        className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-none h-8 text-xs px-3"
                                        disabled={!editingCommentText.trim() || !comment._id || isAnalyzingComment}
                                      >
                                        {isAnalyzingComment ? (
                                          <div className="flex items-center gap-1.5">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>Analyzing...</span>
                                          </div>
                                        ) : (
                                          'Save'
                                        )}
                                      </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditingCommentText('');
                                        setCommentAnalysisResult(null);
                                      }}
                                        className="h-8 text-xs px-3"
                                    >
                                      Cancel
                                    </Button>
                                    </div>
                                  </div>

                                  {/* Comment Edit Analysis Warning */}
                                  {commentAnalysisResult && commentAnalysisResult.isInappropriate && (
                                    <div className="relative overflow-hidden">
                                      <div className={`p-3 rounded-lg border-2 backdrop-blur-sm shadow-lg animate-fade-in
                                        ${commentAnalysisResult.severity === 'high' 
                                          ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                                          : commentAnalysisResult.severity === 'medium'
                                            ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                                            : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                                        }`}
                                      >
                                        {/* Warning Icon */}
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className={`p-1.5 rounded-full 
                                            ${commentAnalysisResult.severity === 'high'
                                              ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                                              : commentAnalysisResult.severity === 'medium'
                                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300'
                                                : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300'
                                            }`}
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                              />
                                            </svg>
                                          </div>
                                          <h3 className={`text-xs sm:text-sm font-semibold
                                            ${commentAnalysisResult.severity === 'high'
                                              ? 'text-red-800 dark:text-red-200'
                                              : commentAnalysisResult.severity === 'medium'
                                                ? 'text-orange-800 dark:text-orange-200'
                                                : 'text-yellow-800 dark:text-yellow-200'
                                            }`}
                                          >
                                            {content.review.inappropriateWarning}
                                          </h3>
                                        </div>

                                        {/* Found Words */}
                                        {commentAnalysisResult.inappropriateWords.length > 0 && (
                                          <div className="mb-2 p-2 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                                            <div className="flex flex-wrap gap-1.5">
                                              {commentAnalysisResult.inappropriateWords.map((word, index) => (
                                                <span key={index} 
                                                  className={`px-2 py-0.5 rounded-full text-xs font-mono
                                                    ${commentAnalysisResult.severity === 'high'
                                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                                      : commentAnalysisResult.severity === 'medium'
                                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                                                    }`}
                                                >
                                                  {word}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}           
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-700 dark:text-gray-300 break-words leading-relaxed">{comment.content}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Add DeleteCommentDialog */}
        <DeleteAlertDialog 
          open={showDeleteCommentDialog}
          onOpenChange={setShowDeleteCommentDialog}
          onConfirm={handleDeleteComment}
          isDeleting={isDeletingComment}
          title="Delete Comment"
          description="Are you sure you want to delete this comment? This action cannot be undone."
        />

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
      </div>
    </div>
  )
} 