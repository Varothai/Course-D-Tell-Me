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
import { MessageCircleQuestion, Loader2 } from "lucide-react"
import { analyzeText } from '@/utils/text-analysis'
import { toast } from "@/components/ui/use-toast"

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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<{
    isInappropriate: boolean;
    confidence: number;
    severity: 'low' | 'medium' | 'high';
    inappropriateWords: string[];
  } | null>(null)
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
      setAnalysisResult(null)
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
        setIsAnalyzing(true)
        
        try {
          const analysis = await analyzeText(question.trim())
          
          if (analysis.isInappropriate) {
            setAnalysisResult(analysis)
            setIsAnalyzing(false)
            setIsSubmitting(false)
            return
          }
          
          setAnalysisResult(null)
          submitAction(question.trim())
          setQuestion("")
          setVerified(false)
          action(false)
        } catch (error) {
          console.error("Error submitting question:", error)
          toast({
            title: "Error",
            description: "Failed to submit question. Please try again.",
            variant: "destructive"
          })
        } finally {
          setIsAnalyzing(false)
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

          {/* Warning Message */}
          {analysisResult && analysisResult.isInappropriate && (
            <div className="mt-4 relative overflow-hidden">
              <div className={`p-4 sm:p-6 rounded-xl border-2 backdrop-blur-sm shadow-lg animate-fade-in
                ${analysisResult.severity === 'high' 
                  ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                  : analysisResult.severity === 'medium'
                    ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                    : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                }`}
              >
                {/* Warning Icon */}
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className={`p-2 rounded-full 
                    ${analysisResult.severity === 'high'
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                      : analysisResult.severity === 'medium'
                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300'
                        : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300'
                    }`}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className={`text-base sm:text-lg font-semibold
                    ${analysisResult.severity === 'high'
                      ? 'text-red-800 dark:text-red-200'
                      : analysisResult.severity === 'medium'
                        ? 'text-orange-800 dark:text-orange-200'
                        : 'text-yellow-800 dark:text-yellow-200'
                    }`}
                  >
                    {content.review.inappropriateWarning}
                  </h3>
                </div>

                {/* Found Words */}
                {analysisResult.inappropriateWords.length > 0 && (
                  <div className="mb-3 sm:mb-4 p-3 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.inappropriateWords.map((word, index) => (
                        <span key={index} 
                          className={`px-2 py-1 rounded-full text-xs sm:text-sm font-mono
                            ${analysisResult.severity === 'high'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : analysisResult.severity === 'medium'
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

          {isAnalyzing && (
            <div className="mt-4 p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing content...
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => {
              action(false)
              setAnalysisResult(null)
            }}>
              Cancel
            </Button>
            <Button type="submit" disabled={!question.trim() || !verified || isSubmitting || isAnalyzing}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Posting...</span>
                </div>
              ) : mode === "create" ? content.postQuestion : "Save Changes"}
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