"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/providers/language-provider"

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

  const handleSubmit = async () => {
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
  }

  return (
    <Dialog open={open} onOpenChange={action}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{content.askQuestion}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder={content.questionPlaceholder}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[150px]"
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verify"
              checked={verified}
              onCheckedChange={(checked) => setVerified(checked as boolean)}
            />
            <label htmlFor="verify" className="text-sm text-muted-foreground">
              {content.verifyContent}
            </label>
          </div>
          <Button
            className="w-full bg-[#4CAF50] hover:bg-[#45a049]"
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