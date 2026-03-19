"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, AlertCircle, RefreshCw, Languages } from "lucide-react"
import { useLanguage } from "@/providers/language-provider"

interface CourseSummaryProps {
  courseId: string
}

const themeNamesTh: Record<string, string> = {
  "Teaching Quality": "คุณภาพการสอน",
  "Difficulty": "ความยาก",
  "Workload": "ภาระงาน",
  "Engagement": "ความน่าสนใจ",
  "Assessment": "การประเมิน"
}

const labels = {
  en: {
    keyPoints: "Key points",
    commonThemes: "Common themes",
    showMore: "Show more insights",
    showLess: "Show less",
    basedOn: "Based on"
  },
  th: {
    keyPoints: "ประเด็นสำคัญ",
    commonThemes: "หัวข้อที่พูดถึงบ่อย",
    showMore: "แสดงข้อมูลเพิ่มเติม",
    showLess: "แสดงน้อยลง",
    basedOn: "จาก"
  }
}

interface SummaryData {
  overallRating: number
  totalReviews: number
  summaryText: { en: string; th: string }
  primaryLanguage: "th" | "en"
  sentiment: "positive" | "neutral" | "negative"
  keyPoints: { en: string[]; th: string[] }
  commonThemes: Array<{
    theme: string
    frequency: number
    sentiment: string
  }>
  recommendations: { en: string[]; th: string[] }
}

export function CourseSummary({ courseId }: CourseSummaryProps) {
  const { language } = useLanguage()
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const fetchSummary = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId })
      })
      const data = await res.json()
      if (data.success && data.summary) {
        setSummary(data.summary)
      } else {
        setError(data.error || "Failed to generate summary")
      }
    } catch (err) {
      console.error("Course summary error:", err)
      setError("An error occurred while generating the summary")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (courseId) fetchSummary()
  }, [courseId])

  const summaryText = summary?.summaryText
    ? summary.summaryText[language] || summary.summaryText.en || summary.summaryText.th
    : ""

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-2 border-indigo-200 dark:border-indigo-800 h-full min-h-[340px]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
            Automated Summary
          </h3>
        </div>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-sm text-muted-foreground">Summarizing reviews...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-2 border-red-200 dark:border-red-800 h-full min-h-[340px]">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
            Automated Summary
          </h3>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchSummary} variant="outline" size="sm">
          Try Again
        </Button>
      </Card>
    )
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-2 border-indigo-200 dark:border-indigo-800 h-full min-h-[340px]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
            Automated Summary
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No reviews yet. A short automated summary will appear once students have reviewed this course.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-2 border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-shadow h-full min-h-[340px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
            Automated Summary
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchSummary}
          className="text-indigo-600 dark:text-indigo-400 h-7 w-7 p-0"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
        <Languages className="w-3.5 h-3.5" />
        Available in Thai & English
      </p>

      <p className="text-base leading-relaxed text-foreground mb-4">
        {summaryText}
      </p>

      {(summary.keyPoints[language]?.length > 0 ||
        summary.recommendations[language]?.length > 0 ||
        summary.commonThemes.length > 0) && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="text-indigo-600 dark:text-indigo-400 -ml-2 mb-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? labels[language].showLess : labels[language].showMore}
          </Button>
          {expanded && (
            <div className="space-y-2 pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50">
              {(summary.keyPoints[language]?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {labels[language].keyPoints}
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {summary.keyPoints[language].map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(summary.recommendations[language]?.length ?? 0) > 0 && (
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {summary.recommendations[language].map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              )}
              {summary.commonThemes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {labels[language].commonThemes}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {summary.commonThemes.slice(0, 5).map((t) => (
                      <span
                        key={t.theme}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.sentiment === "positive"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : t.sentiment === "negative"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {language === "th" ? (themeNamesTh[t.theme] ?? t.theme) : t.theme} (
                        {t.frequency})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        {labels[language].basedOn} {summary.totalReviews}{" "}
        {language === "th" ? "รีวิว" : "review"}
        {summary.totalReviews !== 1 && language === "en" ? "s" : ""} • Avg {summary.overallRating}/5
      </p>
    </Card>
  )
}
