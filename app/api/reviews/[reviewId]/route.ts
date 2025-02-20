import { connectMongoDB } from "@/lib/mongodb"
import { Review } from "@/models/review"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function DELETE(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectMongoDB()
    const result = await Review.findByIdAndDelete(params.reviewId)
    
    if (!result) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reviewData = await request.json()
    await connectMongoDB()
    
    // Find and update the review
    const updatedReview = await Review.findByIdAndUpdate(
      params.reviewId,
      { ...reviewData },
      { new: true } // This ensures we get the updated document
    )

    if (!updatedReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Convert to plain object and ensure _id is a string
    const reviewObj = updatedReview.toObject()
    reviewObj._id = reviewObj._id.toString()
    reviewObj.id = reviewObj._id

    return NextResponse.json({ 
      success: true, 
      review: reviewObj
    })
  } catch (error) {
    console.error('[REVIEW_UPDATE]', error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
  }
} 