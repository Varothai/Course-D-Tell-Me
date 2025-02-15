import { connectMongoDB } from "@/lib/mongodb"
import { Review } from "@/models/review"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const review = await req.json()
    console.log("Received review data:", review)

    await connectMongoDB()
    console.log("MongoDB connected")

    const newReview = {
      courseId: review.courseId,
      courseName: review.courseName,
      userName: review.userName,
      rating: review.rating,
      review: review.review,
      faculty: review.faculty,
      major: review.major,
      studyPlan: review.studyPlan,
      section: review.section,
      programType: review.programType,
      electiveType: review.electiveType,
      readingAmount: review.readingAmount,
      contentDifficulty: review.contentDifficulty,
      teachingQuality: review.teachingQuality,
      grade: review.grade,
      customMajor: review.customMajor,
      likes: 0,
      dislikes: 0,
      comments: [],
      isBookmarked: false,
      timestamp: new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).toUpperCase(),
    }
    console.log("Saving review to database:", newReview)

    const created = await Review.create(newReview)
    console.log("Saved review:", created.toJSON())

    return NextResponse.json({ 
      success: true, 
      review: created.toJSON() 
    }, { status: 201 })
  } catch (error) {
    console.error("Full error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    await connectMongoDB()
    
    const reviews = await Review.find({})
      .sort({ timestamp: -1 })
      .lean()
      .exec()
    
    const transformedReviews = reviews.map(review => {
      const { _id, __v, ...rest } = review
      return {
        ...rest,
        id: _id.toString(),
        timestamp: review.timestamp || new Date().toLocaleString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).toUpperCase()
      }
    })
    
    return NextResponse.json({ success: true, reviews: transformedReviews })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { reviewId, action } = await request.json();
    console.log("Received PATCH request:", { reviewId, action });
    await connectMongoDB();

    const update = action === 'like' ? { $inc: { likes: 1 } } : { $inc: { dislikes: 1 } };
    const updatedReview = await Review.findByIdAndUpdate(reviewId, update, { new: true });

    if (!updatedReview) {
      throw new Error('Review not found');
    }

    console.log("Updated review:", updatedReview);
    return NextResponse.json({ success: true, review: updatedReview.toJSON() });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 