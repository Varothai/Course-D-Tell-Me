import { NextResponse } from 'next/server'
import { connectMongoDB } from "@/lib/mongodb"
import { Review } from "@/models/review"
import { Report } from "@/models/report"
import mongoose from "mongoose"

/**
 * Admin endpoint to check review status including report count and reports
 * GET /api/admin/reviews/[reviewId]/status
 */
export async function GET(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  try {
    await connectMongoDB()
    
    const { reviewId } = params
    
    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 })
    }

    // Convert reviewId to ObjectId
    let reviewObjectId: mongoose.Types.ObjectId
    try {
      reviewObjectId = new mongoose.Types.ObjectId(reviewId)
    } catch (error) {
      return NextResponse.json({ error: "Invalid review ID format" }, { status: 400 })
    }

    // Find the review
    const review = await Review.findById(reviewObjectId)
    
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Get all reports for this review
    const reports = await Report.find({ reviewId: reviewObjectId })
      .sort({ createdAt: -1 })
      .lean()

    // Get actual count from database (should match review.reportCount)
    const actualReportCount = await Report.countDocuments({ reviewId: reviewObjectId })

    return NextResponse.json({
      success: true,
      review: {
        _id: review._id.toString(),
        courseId: review.courseId,
        courseName: review.courseName,
        reportCount: review.reportCount || 0,
        actualReportCount, // Count from reports collection
        isHidden: review.isHidden || false,
        timestamp: review.timestamp,
        createdAt: review.createdAt
      },
      reports: reports.map(report => ({
        _id: report._id.toString(),
        reporterId: report.reporterId,
        reason: report.reason,
        createdAt: report.createdAt
      })),
      status: {
        isAtThreshold: actualReportCount >= 10,
        shouldBeHidden: actualReportCount >= 10,
        isActuallyHidden: review.isHidden || false,
        matches: (review.isHidden || false) === (actualReportCount >= 10)
      }
    })
  } catch (error) {
    console.error('[ADMIN_REVIEW_STATUS]', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal Error"
    }, { status: 500 })
  }
}

