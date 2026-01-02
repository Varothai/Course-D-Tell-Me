"use client"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { ReviewCard } from "@/components/review-card"
import { useLanguage } from "@/providers/language-provider"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Book } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { Review } from "@/types/review"
import { useReviews } from "@/providers/reviews-provider"

interface ReviewWithUserInteraction extends Review {
  hasLiked?: boolean;
  hasDisliked?: boolean;
  _id: string;
  timestamp: string;
  comments: Comment[];
}

interface Comment {
  _id: string;
  comment: string;
  userName: string;
  userEmail?: string;
  createdAt: Date;
}

export default function BookmarksPage() {
  const { content } = useLanguage()
  const [bookmarkedReviews, setBookmarkedReviews] = useState<ReviewWithUserInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const { toast } = useToast()
  const { handleLike, handleDislike } = useReviews()

  useEffect(() => {
    const fetchBookmarkedReviews = async () => {
      if (!session?.user) return;

      try {
        setLoading(true);
        // Fetch bookmarks
        const bookmarksResponse = await fetch('/api/bookmarks');
        if (!bookmarksResponse.ok) {
          throw new Error('Failed to fetch bookmarks');
        }
        const bookmarks = await bookmarksResponse.json();

        // Fetch review details for each bookmark
        const reviewPromises = bookmarks.map(async (bookmark: any) => {
          try {
            const response = await fetch(`/api/reviews/${bookmark.reviewId}/`);
            if (!response.ok) {
              console.error(`Failed to fetch review ${bookmark.reviewId}`);
              return null;
            }
            const review = await response.json();
            return {
              ...review,
              _id: review._id || review.id,
              timestamp: review.timestamp || review.createdAt,
              comments: review.comments || []
            };
          } catch (error) {
            console.error(`Error fetching review ${bookmark.reviewId}:`, error);
            return null;
          }
        });

        const reviews = await Promise.all(reviewPromises);
        const validReviews = reviews.filter(Boolean);
        setBookmarkedReviews(validReviews);
      } catch (error) {
        console.error('Error fetching bookmarked reviews:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bookmarked reviews",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedReviews();
  }, [session?.user]);

  const handleDelete = (deletedReviewId: string) => {
    setBookmarkedReviews(reviews => 
      reviews.filter(review => 
        (review.id !== deletedReviewId) && (review._id !== deletedReviewId)
      )
    );
  };

  const handleEdit = (reviewId: string, updatedReview: Review) => {
    setBookmarkedReviews(prevReviews => 
      prevReviews.map(review => 
        (review.id === reviewId || review._id === reviewId) 
          ? { ...updatedReview, _id: review._id, timestamp: review.timestamp }
          : review
      )
    );
  };

  const handleBookmark = async (reviewId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove bookmark');
      }

      // Remove the review from the list
      setBookmarkedReviews(prev => prev.filter(review => review._id !== reviewId));
      
      toast({
        title: "Success",
        description: "Review removed from bookmarks",
      });
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to remove bookmark",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Return JSX
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
                key={review._id}
                review={review}
                likeAction={handleLike}
                dislikeAction={handleDislike}
                onDelete={handleDelete}
                onEdit={handleEdit}
                bookmarkAction={handleBookmark}
                initialBookmarkState={true}
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
  );
} 