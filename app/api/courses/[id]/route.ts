import connectMongoDB from "@/lib/mongodb"
import { Course } from "@/models/course"
import { Review } from "@/models/review"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB()
    console.log("Fetching course data for ID:", params.id)
    
    // Get the course from database
    const course = await Course.findOne({ id: params.id })
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get reviews for this course
    const reviews = await Review.find({ courseId: params.id })
      .sort({ createdAt: -1 })

    // Calculate course stats
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews
      : 0

    // Calculate grade distribution
    const gradeDistribution = reviews.reduce((acc: Record<string, number>, review) => {
      if (review.grade) {
        acc[review.grade] = (acc[review.grade] || 0) + 1
      }
      return acc
    }, {})

    // Calculate rating distribution
    const ratingDistribution = reviews.reduce((acc: Record<number, number>, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1
      return acc
    }, {})

    const courseData = {
      id: course.id,
      name: course.name,
      stats: {
        averageRating,
        totalReviews,
        gradeDistribution,
        ratingDistribution
      },
      reviews: reviews.map(review => ({
        id: review._id.toString(),
        courseId: review.courseId,
        courseName: course.name,
        userName: review.userName,
        rating: review.rating,
        review: review.review,
        likes: review.likes,
        dislikes: review.dislikes,
        comments: review.comments,
        isBookmarked: review.isBookmarked,
        faculty: review.faculty,
        major: review.major,
        studyPlan: review.studyPlan,
        section: review.section,
        readingAmount: review.readingAmount,
        contentDifficulty: review.contentDifficulty,
        teachingQuality: review.teachingQuality,
        createdAt: review.createdAt
      }))
    }

    return NextResponse.json({ 
      success: true, 
      course: courseData 
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch course data' 
      },
      { status: 500 }
    )
  }
} 