"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Cloud, Loader2, AlertCircle, RefreshCw } from "lucide-react"

interface WordCloudProps {
  courseId: string
}

interface WordData {
  word: string
  count: number
}

export function WordCloud({ courseId }: WordCloudProps) {
  const [words, setWords] = useState<WordData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchWords = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/reviews/wordcloud?courseId=${courseId}`)

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setWords(data.words)
        } else {
          setError("Failed to generate word cloud")
        }
      } else {
        setError("Failed to fetch word cloud")
      }
    } catch (err) {
      console.error('Error fetching word cloud:', err)
      setError("An error occurred while generating the word cloud")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (courseId) {
      fetchWords()
    }
  }, [courseId])

  // Calculate font sizes based on word frequency
  const getFontSize = (count: number, maxCount: number) => {
    if (maxCount === 0) return 14
    const ratio = count / maxCount
    // Font sizes from 14px to 48px
    return Math.max(14, Math.min(48, 14 + (ratio * 34)))
  }

  // Calculate opacity based on frequency
  const getOpacity = (count: number, maxCount: number) => {
    if (maxCount === 0) return 0.6
    const ratio = count / maxCount
    return Math.max(0.4, Math.min(1, 0.4 + (ratio * 0.6)))
  }

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 h-full">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-base sm:text-lg font-semibold text-purple-700 dark:text-purple-300">Word Cloud</h3>
        </div>
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-purple-600 dark:text-purple-400" />
          <span className="ml-2 text-sm text-muted-foreground">Generating...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 h-full">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
          <h3 className="text-base sm:text-lg font-semibold text-red-700 dark:text-red-300">Word Cloud</h3>
        </div>
        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mb-3 sm:mb-4">{error}</p>
        <Button onClick={fetchWords} variant="outline" size="sm" className="text-xs sm:text-sm">
          Try Again
        </Button>
      </Card>
    )
  }

  if (words.length === 0) {
    return null
  }

  const maxCount = Math.max(...words.map(w => w.count))
  const colors = [
    'text-purple-600 dark:text-purple-400',
    'text-pink-600 dark:text-pink-400',
    'text-indigo-600 dark:text-indigo-400',
    'text-blue-600 dark:text-blue-400',
    'text-cyan-600 dark:text-cyan-400',
    'text-teal-600 dark:text-teal-400',
    'text-emerald-600 dark:text-emerald-400',
    'text-green-600 dark:text-green-400',
    'text-amber-600 dark:text-amber-400',
    'text-orange-600 dark:text-orange-400'
  ]

  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow h-full">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-base sm:text-lg font-semibold text-purple-700 dark:text-purple-300">Word Cloud</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchWords}
          className="text-purple-600 dark:text-purple-400 h-7 w-7 p-0"
        >
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>

      <div 
        ref={containerRef}
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm min-h-[150px] sm:min-h-[180px]"
        style={{ lineHeight: '1.6' }}
      >
        {words.map((wordData, index) => {
          const fontSize = getFontSize(wordData.count, maxCount)
          const opacity = getOpacity(wordData.count, maxCount)
          const colorClass = colors[index % colors.length]
          
          return (
            <span
              key={`${wordData.word}-${index}`}
              className={`${colorClass} font-medium hover:scale-110 transition-transform cursor-default inline-block`}
              style={{
                fontSize: `${fontSize}px`,
                opacity,
                fontWeight: fontSize > 30 ? 700 : fontSize > 20 ? 600 : 500
              }}
              title={`Mentioned ${wordData.count} time${wordData.count !== 1 ? 's' : ''}`}
            >
              {wordData.word}
            </span>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-3 sm:mt-4 text-center">
        Most mentioned words • Size = frequency
      </p>
    </Card>
  )
}
