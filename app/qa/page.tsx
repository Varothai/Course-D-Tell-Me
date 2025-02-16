"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, ThumbsUp, ThumbsDown, Bookmark, ChevronDown, ChevronUp } from 'lucide-react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { QAFormDialog } from "@/components/qa-form-dialog"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"

interface Comment {
  _id?: string
  content: string
  userName: string
  timestamp: string
  userEmail?: string
}

interface QA {
  _id: string
  question: string
  userName: string
  timestamp: string
  userEmail?: string
  comments: Comment[]
}

export default function QAPage() {
  const { content } = useLanguage()
  const [qas, setQAs] = useState<QA[]>([])
  const [comments, setComments] = useState<Record<string, string>>({})
  const [isWriting, setIsWriting] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  
  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/qa')
      const data = await response.json()
      if (data.success) {
        setQAs(data.qas)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    }
  }

  const handleNewQuestion = async (question: string) => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to post a question",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
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

    try {
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
      
      if (response.ok) {
        // Update the local state with the new comment
        setQAs(prevQAs => prevQAs.map(qa => {
          if (qa._id === qaId) {
            return {
              ...qa,
              comments: [...qa.comments, data.comment]
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
    }
  }

  const toggleComments = (qaId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [qaId]: !prev[qaId]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section with Mascot */}
        <div className="relative mb-12 bg-white/80 dark:bg-gray-800/80 rounded-3xl p-8 backdrop-blur-sm shadow-lg transition-all duration-300 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="relative w-24 h-24 group">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-75 group-hover:opacity-100 blur transition-all duration-500" />
                <div className="relative bg-white dark:bg-gray-800 rounded-full p-2">
                  <img
                    src="/elephant-mascot.png"
                    alt="Cute elephant mascot"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Q&A Forum
              </h1>
            </div>

            <Button 
              onClick={() => setIsWriting(true)}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-full px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {content.writeQA}
            </Button>
          </div>
        </div>

        <QAFormDialog
          open={isWriting}
          action={setIsWriting}
          submitAction={handleNewQuestion}
        />

        {/* Questions List */}
        <div className="space-y-6 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-8">
          {qas.map((qa) => (
            <div key={qa._id} className="transition-all duration-300">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800">
                <div className="p-6">
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-10 h-10 ring-2 ring-purple-200 dark:ring-purple-800">
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                        {qa.userName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-purple-700 dark:text-purple-300">
                        {qa.userName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {qa.timestamp}
                      </div>
                    </div>
                  </div>
                  
                  {/* Question Content */}
                  <p className="mb-6 text-lg">{qa.question}</p>
                  
                  {/* Comments Section */}
                  <div className="border-t pt-4">
                    <button
                      onClick={() => toggleComments(qa._id)}
                      className="w-full flex items-center justify-between gap-2 mb-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-lg font-semibold">
                          Comments ({qa.comments.length})
                        </h3>
                      </div>
                      <div className="text-purple-600 dark:text-purple-400">
                        {expandedComments[qa._id] ? (
                          <ChevronUp className="w-5 h-5 transition-transform group-hover:scale-110" />
                        ) : (
                          <ChevronDown className="w-5 h-5 transition-transform group-hover:scale-110" />
                        )}
                      </div>
                    </button>
                    
                    {expandedComments[qa._id] && (
                      <>
                        {/* Existing Comments */}
                        <div className="space-y-4 mb-4">
                          {qa.comments.map((comment) => (
                            <div 
                              key={comment._id} 
                              className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
                                    {comment.userName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm text-purple-700 dark:text-purple-300">
                                  {comment.userName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {comment.timestamp}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                            </div>
                          ))}
                        </div>

                        {/* Add Comment Form */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Write a comment..."
                            value={comments[qa._id] || ''}
                            onChange={(e) => setComments(prev => ({
                              ...prev,
                              [qa._id]: e.target.value
                            }))}
                            className="bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:ring-purple-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleComment(qa._id)
                              }
                            }}
                          />
                          <Button 
                            onClick={() => handleComment(qa._id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={!comments[qa._id]?.trim()}
                          >
                            Post
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 