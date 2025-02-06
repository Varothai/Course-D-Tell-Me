"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import { Book } from "lucide-react"
import { Review } from "@/types/review"
import { useToast } from "@/components/ui/use-toast"
import { ReviewCard } from "@/components/review-card"

export default function BookmarksPage() {
  const { data: session } = useSession()
  const { content } = useLanguage()
  const [bookmarkedReviews, setBookmarkedReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchBookmarkedReviews()
  }, [session])

  const fetchBookmarkedReviews = async () => {
    if (!session) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/reviews/bookmark')
      const data = await response.json()
      
      if (data.success) {
        setBookmarkedReviews(data.reviews)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch bookmarked reviews",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching bookmarked reviews:", error)
      toast({
        title: "Error",
        description: "Failed to fetch bookmarked reviews",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBookmark = async (reviewId: string) => {
    try {
      const response = await fetch('/api/reviews/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle bookmark')
      }

      // Remove the review from the list when unbookmarked
      setBookmarkedReviews(prev => prev.filter(review => review.id !== reviewId))
      
      toast({
        title: "Success",
        description: "Review removed from bookmarks",
      })
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      })
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Please sign in to view your bookmarks.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-lg transition-all duration-300 mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {content.bookmarks}
          </h1>
          <p className="text-muted-foreground mt-2">
            {bookmarkedReviews.length} {bookmarkedReviews.length === 1 ? 'Review' : 'Reviews'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
          </div>
        ) : bookmarkedReviews.length > 0 ? (
          <div className="space-y-6">
            {bookmarkedReviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review}
                bookmarkAction={handleBookmark}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <Book className="w-12 h-12 mx-auto mb-4 text-purple-500/50" />
            <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300 mb-2">
              No Bookmarked Reviews
            </h3>
            <p className="text-muted-foreground">
              Start bookmarking reviews you want to save for later!
            </p>
          </Card>
        )}
      </div>
    </div>
  )
} 