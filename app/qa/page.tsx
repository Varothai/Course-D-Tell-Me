"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, ThumbsUp, ThumbsDown, Bookmark } from 'lucide-react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { QAFormDialog } from "@/components/qa-form-dialog"

interface QA {
  id: string
  question: string
  userName: string
  timestamp: string
  likes: number
  dislikes: number
  isBookmarked: boolean
  comments: string[]
}

export default function QAPage() {
  const { content } = useLanguage()
  const [qas, setQAs] = useState<QA[]>([])
  const [comment, setComment] = useState("")
  const [isWriting, setIsWriting] = useState(false)
  
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
    try {
      await fetchQuestions()
    } catch (error) {
      console.error("Error handling new question:", error)
    }
  }

  return (
    <div className="min-h-screen bg-[#E5E1FF] dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Q&A</h1>
          <Button 
            className="bg-[#FFE66D] hover:bg-[#FFD700] text-black"
            onClick={() => setIsWriting(true)}
          >
            {content.writeQA}
          </Button>
        </div>

        <QAFormDialog
          open={isWriting}
          action={setIsWriting}
          submitAction={handleNewQuestion}
        />

        {/* Questions List */}
        <div className="space-y-4">
          {qas.map((qa) => (
            <Card key={qa.id} className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{qa.userName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{qa.userName}</div>
                  <div className="text-sm text-muted-foreground">{qa.timestamp}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="ml-auto"
                  onClick={() => {
                    setQAs(qas.map(q => 
                      q.id === qa.id ? { ...q, isBookmarked: !q.isBookmarked } : q
                    ))
                  }}
                >
                  <Bookmark className={qa.isBookmarked ? "fill-current" : ""} />
                </Button>
              </div>
              
              <p className="mb-4">{qa.question}</p>
              
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  comment
                </Button>
              </div>

              {/* Comments Section */}
              <div className="mt-4 pl-8 border-l-2">
                {qa.comments.map((comment, index) => (
                  <div key={index} className="mb-2">
                    <div className="text-sm text-muted-foreground">
                      Jasmin eiei
                    </div>
                    <div className="text-sm">
                      เหมือนว่าจะไม่ยากนะคะ
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="text-sm"
                  />
                  <Button size="sm" className="bg-[#7B7B7B] hover:bg-[#666666]">
                    POST
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 