"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/providers/language-provider"
import { useProtectedAction } from '@/hooks/use-protected-action'
import { useSession } from "next-auth/react"
import { useAuth } from "@/contexts/auth-context"
import { MessageCircleQuestion } from "lucide-react"

interface QAFormDialogProps {
  open: boolean
  action: (open: boolean) => void
  submitAction: (question: string) => void
  initialQuestion?: string
  mode?: "create" | "edit"
}

export function QAFormDialog({ 
  open, 
  action, 
  submitAction, 
  initialQuestion = "",
  mode = "create" 
}: QAFormDialogProps) {
  const { content } = useLanguage()
  const [question, setQuestion] = useState(initialQuestion)
  const [verified, setVerified] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleProtectedAction = useProtectedAction()
  const { data: session } = useSession()
  const { setShowAuthModal } = useAuth()

  useEffect(() => {
    if (open && !session) {
      setShowAuthModal(true)
      action(false)
    }
  }, [open, session, setShowAuthModal, action])

  useEffect(() => {
    if (open) {
      setQuestion(initialQuestion)
    }
  }, [open, initialQuestion])

  if (!session) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim()) {
      handleProtectedAction(async () => {
        if (!question.trim() || !verified || isSubmitting) return

        setIsSubmitting(true)
        try {
          const response = await fetch('/api/qa', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: question.trim(),
              userName: "User", 
            }),
          })

          const data = await response.json()
          if (response.ok) {
            submitAction(question)
            setQuestion("")
            setVerified(false)
            action(false)
          } else {
            console.error("Failed to submit question:", data.error)
          }
        } catch (error) {
          console.error("Error submitting question:", error)
        } finally {
          setIsSubmitting(false)
        }
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={action}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm p-8 border-2 border-purple-200 dark:border-purple-800">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <img
            src="/elephant-mascot.png" 
            alt="Cute elephant mascot"
            className="w-full h-full object-contain animate-bounce-gentle"
          />
        </div>

        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {mode === "create" ? content.askQuestion : "Edit Question"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Share your question with the community" 
              : "Update your question"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder={content.questionPlaceholder}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[150px] bg-white/80 dark:bg-gray-800/80 border-2 border-purple-200 dark:border-purple-800 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 px-4 py-3 resize-none"
            />
            <MessageCircleQuestion className="absolute right-3 top-3 w-5 h-5 text-purple-400 opacity-50" />
          </div>

          <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/30 p-3 rounded-xl">
            <Checkbox
              id="verify"
              checked={verified}
              onCheckedChange={(checked) => setVerified(checked as boolean)}
              className="text-purple-600 border-2 border-purple-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
            />
            <label htmlFor="verify" className="text-sm text-gray-600 dark:text-gray-300">
              {content.verifyContent}
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => action(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!question.trim() || !verified || isSubmitting}>
              {mode === "create" ? content.postQuestion : "Save Changes"}
            </Button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          Your question will be visible to all users
        </p>
      </DialogContent>
    </Dialog>
  )
} 