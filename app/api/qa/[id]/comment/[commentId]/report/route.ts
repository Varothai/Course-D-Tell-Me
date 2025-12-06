import { getServerSession } from "next-auth/next"
import { NextResponse } from 'next/server'
import { connectMongoDB } from "@/lib/mongodb"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { CommentReport } from "@/models/comment-report"
import { Question } from "@/models/qa"
import mongoose from "mongoose"

export async function POST(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 })
    }

    // Convert IDs to ObjectId
    let qaObjectId: mongoose.Types.ObjectId
    let commentObjectId: mongoose.Types.ObjectId
    try {
      qaObjectId = new mongoose.Types.ObjectId(params.id)
      commentObjectId = new mongoose.Types.ObjectId(params.commentId)
    } catch (error) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    await connectMongoDB()

    const question = await Question.findById(qaObjectId)
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Use email as reporterId for consistency
    const reporterId = session.user.email

    // Check if user already reported this comment
    const existingReport = await CommentReport.findOne({
      commentId: commentObjectId,
      commentType: 'qa',
      reporterId: reporterId
    })

    if (existingReport) {
      return NextResponse.json({ error: "You have already reported this comment" }, { status: 400 })
    }

    // Create report
    const report = await CommentReport.create({
      commentId: commentObjectId,
      commentType: 'qa',
      reporterId: reporterId,
      reason: reason
    })

    // Get current report count
    const reportCount = await CommentReport.countDocuments({
      commentId: commentObjectId,
      commentType: 'qa'
    })

    // Find and update the comment
    const commentIndex = question.comments.findIndex(
      (c: any) => c._id.toString() === params.commentId
    )

    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    question.comments[commentIndex].reportCount = reportCount
    question.comments[commentIndex].isHidden = reportCount >= 10

    await question.save()

    return NextResponse.json({ 
      success: true, 
      report: report.toJSON(), 
      reportCount: reportCount,
      isHidden: reportCount >= 10
    })

  } catch (error) {
    console.error('[QA_COMMENT_REPORT]', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal Error" 
    }, { status: 500 })
  }
}

