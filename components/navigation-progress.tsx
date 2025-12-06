"use client"

import { useEffect, useState, Suspense } from "react"
import { usePathname } from "next/navigation"
import { useNavigationContext } from "@/contexts/navigation-context"

function NavigationProgressInner() {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const { isNavigating } = useNavigationContext()
  const pathname = usePathname()

  useEffect(() => {
    if (isNavigating) {
      setIsVisible(true)
      setProgress(0)
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            return prev
          }
          // Increment more slowly as we approach 90%
          const increment = prev < 50 ? 10 : prev < 80 ? 5 : 2
          return Math.min(prev + increment, 90)
        })
      }, 100)

      return () => {
        clearInterval(interval)
      }
    } else {
      // Complete the progress bar
      setProgress(100)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setProgress(0)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isNavigating])

  // Reset when route changes
  useEffect(() => {
    setIsVisible(false)
    setProgress(0)
  }, [pathname])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 transition-all duration-300 ease-out shadow-lg"
        style={{
          width: `${progress}%`,
          transition: progress < 90 ? "width 0.1s ease-out" : "width 0.2s ease-out",
        }}
      />
    </div>
  )
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  )
}

