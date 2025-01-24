import { connectMongoDB } from "@/lib/mongodb"
import { Review } from "@/models/review"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const review = await request.json()
    console.log("Received review data:", review)

    await connectMongoDB()
    console.log("MongoDB connected")

    const newReview = {
      ...review,
      likes: 0,
      dislikes: 0,
      comments: [],
      isBookmarked: false,
    }
    console.log("Attempting to create review:", newReview)

    const created = await Review.create(newReview)
    console.log("Review created:", created)

    return NextResponse.json({ success: true, review: created }, { status: 201 })
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
    console.log("Connecting to MongoDB...")
    await connectMongoDB()
    console.log("Fetching reviews...")
    
    const reviews = await Review.find().sort({ createdAt: -1 })
    console.log(`Found ${reviews.length} reviews`)
    
    return NextResponse.json({ success: true, reviews })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 