import { getServerSession } from "next-auth/next"
import { NextResponse } from 'next/server'
import { connectMongoDB } from "@/lib/mongodb"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { CommentReport } from "@/models/comment-report"
import { Review } from "@/models/review"
import mongoose from "mongoose"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { commentId, commentType, reason, reviewId } = body

    if (!commentId || !commentType || !reason) {
      return NextResponse.json({ error: "Comment ID, type, and reason are required" }, { status: 400 })
    }

    if (commentType !== 'review' && commentType !== 'qa') {
      return NextResponse.json({ error: "Invalid comment type" }, { status: 400 })
    }

    // Convert commentId to ObjectId
    let commentObjectId: mongoose.Types.ObjectId
    try {
      commentObjectId = new mongoose.Types.ObjectId(commentId)
    } catch (error) {
      return NextResponse.json({ error: "Invalid comment ID format" }, { status: 400 })
    }

    await connectMongoDB()

    // Use email as reporterId for consistency
    const reporterId = session.user.email

    // Check if user already reported this comment
    const existingReport = await CommentReport.findOne({
      commentId: commentObjectId,
      commentType: commentType,
      reporterId: reporterId
    })

    if (existingReport) {
      return NextResponse.json({ error: "You have already reported this comment" }, { status: 400 })
    }

    // Create report
    const report = await CommentReport.create({
      commentId: commentObjectId,
      commentType: commentType,
      reporterId: reporterId,
      reason: reason
    })

    // Get current report count
    const reportCount = await CommentReport.countDocuments({
      commentId: commentObjectId,
      commentType: commentType
    })

    // Update comment's report count and hide if threshold reached
    if (commentType === 'review') {
      if (!reviewId) {
        return NextResponse.json({ error: "Review ID is required for review comments" }, { status: 400 })
      }

      let reviewObjectId: mongoose.Types.ObjectId
      try {
        reviewObjectId = new mongoose.Types.ObjectId(reviewId)
      } catch (error) {
        return NextResponse.json({ error: "Invalid review ID format" }, { status: 400 })
      }

      const review = await Review.findById(reviewObjectId)
      if (!review) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 })
      }

      // Find and update the comment
      const commentIndex = review.comments.findIndex(
        (c: any) => c._id.toString() === commentId
      )

      if (commentIndex === -1) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 })
      }

      review.comments[commentIndex].reportCount = reportCount
      review.comments[commentIndex].isHidden = reportCount >= 10

      await review.save()

      return NextResponse.json({ 
        success: true, 
        report: report.toJSON(), 
        reportCount: reportCount,
        isHidden: reportCount >= 10
      })
    } else {
      // QA comment - handled in separate endpoint
      return NextResponse.json({ 
        success: true, 
        report: report.toJSON(), 
        reportCount: reportCount,
        isHidden: reportCount >= 10
      })
    }

  } catch (error) {
    console.error('[COMMENT_REPORT]', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal Error" 
    }, { status: 500 })
  }
}

