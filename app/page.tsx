"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Moon, Sun, Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReviewCard } from "@/components/review-card"
import { useTheme } from "@/providers/theme-provider"
import { useLanguage } from "@/providers/language-provider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ReviewForm } from "@/components/review-form"
import { useReviews } from "@/providers/review-provider"
import type { Review } from "@/types/review"

// Mock data for reviews
const mockReviews = [
  {
    id: "1",
    courseId: "261411",
    courseName: "SOFTWARE ENGINEERING",
    rating: 4,
    userName: "USER 1",
    review: "Great course with practical applications. The professor explains concepts clearly and provides good examples.",
    likes: 10,
    dislikes: 2,
    comments: ["Great review!", "I agree, very helpful course."],
    isBookmarked: false,
  },
  {
    id: "2",
    courseId: "271001",
    courseName: "GENERAL PHYSICS",
    rating: 3,
    userName: "USER 2",
    review: "Challenging but interesting. The labs help understand theoretical concepts better.",
    likes: 5,
    dislikes: 1,
    comments: ["Thanks for sharing your experience."],
    isBookmarked: true,
  },
  // Add more mock reviews as needed
]

export default function Home() {
  const { theme, toggleTheme } = useTheme()
  const { content, language, toggleLanguage } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const { reviews, addReview, clearReviews } = useReviews()
  const [selectedFaculty, setSelectedFaculty] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [isWritingReview, setIsWritingReview] = useState(false)
  const [newReviewData, setNewReviewData] = useState({
    courseId: "",
    courseName: ""
  })

  // Fetch reviews when component mounts
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/reviews')
        const data = await response.json()
        
        if (data.success && data.reviews) {
          clearReviews()
          data.reviews.forEach((review: Review) => addReview(review))
        } else {
          console.error("Failed to fetch reviews:", data.error)
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
      }
    }
    
    fetchReviews()
  }, [])

  const handleLike = (id: string) => {
    // Implementation of handleLike
  }

  const handleDislike = (id: string) => {
    // Implementation of handleDislike
  }

  const handleComment = (id: string, comment: string) => {
    // Implementation of handleComment
  }

  const handleBookmark = (id: string) => {
    // Implementation of handleBookmark
  }

  const handleNewReview = (review: any) => {
    // Handle the new review submission
    console.log(review)
    setIsWritingReview(false)
  }

  return (
    <div className="min-h-screen bg-[#E5E1FF] dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">{content.welcome}</h1>
            <h2 className="text-2xl text-muted-foreground">
              {content.courseTitle}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button variant="outline" onClick={toggleLanguage}>
              {language === "en" ? "TH" : "EN"}
            </Button>
          </div>
        </div>

        {/* Add Write Review Button */}
        <div className="flex justify-end mb-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#90EE90] text-black hover:bg-[#7FDF7F]">
                {content.writeReview}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ReviewForm 
                courseId=""
                courseName=""
                action={handleNewReview}
                onClose={() => {
                  const closeButton = document.querySelector('[aria-label="Close"]') as HTMLButtonElement
                  closeButton?.click()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={content.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Program Types Filter */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">{content.programTypes}</h3>
            <RadioGroup
              value={selectedProgram}
              onValueChange={setSelectedProgram}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="international" id="international" />
                <Label htmlFor="international">{content.international}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="special" id="special" />
                <Label htmlFor="special">{content.special}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free">{content.freeElective}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="general" id="general" />
                <Label htmlFor="general">{content.generalElective}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="major" id="major" />
                <Label htmlFor="major">{content.majorElective}</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <h3 className="text-xl font-bold mb-4">{content.allReviews}</h3>
          <div>
            {reviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review}
                likeAction={handleLike}
                dislikeAction={handleDislike}
                commentAction={handleComment}
                bookmarkAction={handleBookmark}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

