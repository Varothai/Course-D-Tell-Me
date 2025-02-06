import { connectMongoDB } from "@/lib/mongodb"
import { Review } from "@/models/review"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { reviewId } = await request.json()
    await connectMongoDB()
    
    const review = await Review.findById(reviewId)
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Toggle bookmark status
    review.bookmarkedBy = review.bookmarkedBy || []
    const userIndex = review.bookmarkedBy.indexOf(session.user?.name)
    
    if (userIndex === -1) {
      review.bookmarkedBy.push(session.user?.name)
    } else {
      review.bookmarkedBy.splice(userIndex, 1)
    }

    await review.save()
    
    return NextResponse.json({ 
      success: true, 
      isBookmarked: userIndex === -1,
      review 
    })
  } catch (error) {
    console.error("Error bookmarking review:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectMongoDB()
    
    const bookmarkedReviews = await Review.find({
      bookmarkedBy: session.user?.name
    }).sort({ createdAt: -1 })
    
    return NextResponse.json({ success: true, reviews: bookmarkedReviews })
  } catch (error) {
    console.error("Error fetching bookmarked reviews:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 