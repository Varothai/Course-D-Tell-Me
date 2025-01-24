import { DetailedReview } from "@/types/review"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/providers/language-provider"

interface ReviewListProps {
  reviews: DetailedReview[]
}

export function ReviewList({ reviews }: ReviewListProps) {
  const { content } = useLanguage()

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback>{review.userName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{review.userName}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {review.major}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {review.timestamp}
                </span>
              </div>
              <div className="flex mt-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? "fill-primary text-primary"
                        : "fill-muted text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm mb-3">{review.review}</p>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  {review.likes} {content.likes}
                </Button>
                <Button variant="ghost" size="sm">
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  {review.dislikes} {content.dislikes}
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {review.comments?.length || 0} {content.comments}
                </Button>
              </div>
              {review.comments && review.comments.length > 0 && (
                <div className="mt-3 pl-4 border-l-2">
                  {review.comments.map((comment, index) => (
                    <p key={index} className="text-sm text-muted-foreground mb-1">
                      {comment}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

