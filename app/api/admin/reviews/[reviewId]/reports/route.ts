import { NextResponse } from 'next/server'
import { connectMongoDB } from "@/lib/mongodb"
import { Report } from "@/models/report"
import mongoose from "mongoose"

/**
 * Admin endpoint to get all reports for a specific review
 * GET /api/admin/reviews/[reviewId]/reports
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

    // Get all reports for this review
    const reports = await Report.find({ reviewId: reviewObjectId })
      .sort({ createdAt: -1 })
      .lean()

    const count = reports.length

    return NextResponse.json({
      success: true,
      reviewId: reviewId,
      count,
      reports: reports.map(report => ({
        _id: report._id.toString(),
        reporterId: report.reporterId,
        reason: report.reason,
        createdAt: report.createdAt
      }))
    })
  } catch (error) {
    console.error('[ADMIN_REVIEW_REPORTS]', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal Error"
    }, { status: 500 })
  }
}

