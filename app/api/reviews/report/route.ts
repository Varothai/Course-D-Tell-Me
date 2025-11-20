import { getServerSession } from "next-auth/next"
import { NextResponse } from 'next/server'
import { connectMongoDB } from "@/lib/mongodb"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Report } from "@/models/report"
import { Review } from "@/models/review"
import mongoose from "mongoose"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { reviewId, reason } = body

    if (!reviewId || !reason) {
      return NextResponse.json({ error: "Review ID and reason are required" }, { status: 400 })
    }

    // Convert reviewId to ObjectId
    let reviewObjectId: mongoose.Types.ObjectId
    try {
      reviewObjectId = new mongoose.Types.ObjectId(reviewId)
    } catch (error) {
      return NextResponse.json({ error: "Invalid review ID format" }, { status: 400 })
    }

    await connectMongoDB()

    // Check if review exists
    const reviewExists = await Review.findById(reviewObjectId)
    if (!reviewExists) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Check if user already reported this review
    const existingReport = await Report.findOne({
      reviewId: reviewObjectId,
      reporterId: session.user.name
    })

    if (existingReport) {
      return NextResponse.json({ error: "You have already reported this review" }, { status: 400 })
    }

    // Create report
    const report = await Report.create({
      reviewId: reviewObjectId,
      reporterId: session.user.name,
      reason: reason
    })

    // Get current report count
    const reportCount = await Report.countDocuments({
      reviewId: reviewObjectId
    })

    // Update review's report count and hide if threshold reached
    const review = await Review.findByIdAndUpdate(
      reviewObjectId,
      { 
        $set: {
          reportCount: reportCount,
          isHidden: reportCount >= 10
        }
      },
      { new: true }
    )

    if (!review) {
      return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      report: report.toJSON(), 
      review: review.toJSON()
    })

  } catch (error) {
    console.error('[REVIEW_REPORT]', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal Error" 
    }, { status: 500 })
  }
} 