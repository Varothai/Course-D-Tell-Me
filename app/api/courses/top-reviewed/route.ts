import { connectMongoDB } from "@/lib/mongodb"
import { Review } from "@/models/review"
import { NextResponse } from "next/server"


export interface TopReviewedCourse {
  courseId: string
  courseName: string
  faculty: string
  averageRating: number
  totalReviews: number
  rank: number
}


export async function GET() {
  try {
    await connectMongoDB()

    // Fetch all non-hidden reviews
    const reviews = await Review.find({ isHidden: { $ne: true } })
      .select('courseId courseName faculty rating')
      .lean()
      .exec()

    if (reviews.length === 0) {
      return NextResponse.json({
        success: true,
        courses: []
      })
    }

    // Group reviews by courseId
    const courseMap = new Map<string, {
      courseId: string
      courseName: string
      faculty: string
      ratings: number[]
      reviewCount: number
    }>()

    reviews.forEach((review: any) => {
      const courseId = review.courseId

      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          courseId,
          courseName: review.courseName || 'Unknown Course',
          faculty: review.faculty || 'Unknown Faculty',
          ratings: [],
          reviewCount: 0
        })
      }

      const course = courseMap.get(courseId)!
      course.ratings.push(review.rating)
      course.reviewCount++
    })

    // Calculate average rating and prepare results
    const courses: TopReviewedCourse[] = Array.from(courseMap.values())
      .map((course) => {
        const averageRating = course.ratings.length > 0
          ? course.ratings.reduce((sum, rating) => sum + rating, 0) / course.ratings.length
          : 0

        return {
          courseId: course.courseId,
          courseName: course.courseName,
          faculty: course.faculty,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: course.reviewCount,
          rank: 0
        }
      })
      .sort((a, b) => b.totalReviews - a.totalReviews)
      .slice(0, 10)
      .map((course, index) => ({
        ...course,
        rank: index + 1
      }))

    return NextResponse.json({
      success: true,
      courses
    })
  } catch (error) {
    console.error("Error fetching top reviewed courses:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
