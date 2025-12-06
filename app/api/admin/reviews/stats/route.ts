import { NextResponse } from 'next/server'
import { connectMongoDB } from "@/lib/mongodb"
import { Review } from "@/models/review"
import { Report } from "@/models/report"

/**
 * Admin endpoint to get statistics about reports
 * GET /api/admin/reviews/stats
 */
export async function GET() {
  try {
    await connectMongoDB()

    // Get total counts
    const totalReviews = await Review.countDocuments({})
    const hiddenReviews = await Review.countDocuments({ isHidden: true })
    const visibleReviews = totalReviews - hiddenReviews
    const totalReports = await Report.countDocuments({})

    // Get reviews with reports
    const reviewsWithReports = await Review.countDocuments({ 
      reportCount: { $gt: 0 } 
    })

    // Get reviews approaching threshold (5-9 reports)
    const approachingThreshold = await Review.countDocuments({
      reportCount: { $gte: 5, $lt: 10 },
      isHidden: false
    })

    // Get reviews at threshold (10+ reports but not hidden - should be 0 if working correctly)
    const atThresholdNotHidden = await Review.countDocuments({
      reportCount: { $gte: 10 },
      isHidden: false
    })

    // Get most reported reviews
    const mostReported = await Review.find({ reportCount: { $gt: 0 } })
      .sort({ reportCount: -1 })
      .limit(10)
      .select('_id courseId courseName reportCount isHidden')
      .lean()

    return NextResponse.json({
      success: true,
      stats: {
        totalReviews,
        visibleReviews,
        hiddenReviews,
        totalReports,
        reviewsWithReports,
        approachingThreshold,
        atThresholdNotHidden, // Should be 0 if system is working
        issues: atThresholdNotHidden > 0 ? 'Some reviews have 10+ reports but are not hidden!' : null
      },
      mostReported: mostReported.map(review => ({
        _id: review._id.toString(),
        courseId: review.courseId,
        courseName: review.courseName,
        reportCount: review.reportCount,
        isHidden: review.isHidden
      }))
    })
  } catch (error) {
    console.error('[ADMIN_REVIEW_STATS]', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal Error"
    }, { status: 500 })
  }
}

