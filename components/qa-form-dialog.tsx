"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/providers/language-provider"
import { useProtectedAction } from '@/hooks/use-protected-action'
import { useSession } from "next-auth/react"
import { useAuth } from "@/contexts/auth-context"

interface QAFormDialogProps {
  open: boolean
  action: (open: boolean) => void
  submitAction: (question: string) => void
}

export function QAFormDialog({ open, action, submitAction }: QAFormDialogProps) {
  const { content } = useLanguage()
  const [question, setQuestion] = useState("")
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

  if (!session) {
    return null
  }

  const handleSubmit = async () => {
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

  return (
    <Dialog open={open} onOpenChange={action}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl shadow-lg p-6 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-purple-700">{content.askQuestion}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder={content.questionPlaceholder}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[150px] bg-white/80 dark:bg-gray-800/80 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all duration-300"
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verify"
              checked={verified}
              onCheckedChange={(checked) => setVerified(checked as boolean)}
              className="text-purple-600"
            />
            <label htmlFor="verify" className="text-sm text-muted-foreground">
              {content.verifyContent}
            </label>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white rounded-xl py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={!question.trim() || !verified || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? content.posting : content.postQuestion}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 