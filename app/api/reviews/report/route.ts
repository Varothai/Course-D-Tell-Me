import { getServerSession } from "next-auth/next"
import { NextResponse } from 'next/server'
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.name) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { reviewId, reason } = body

    if (!reviewId || !reason) {
      return new NextResponse('Review ID and reason are required', { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Check if user already reported this review
    const existingReport = await db.collection('reports').findOne({
      reviewId: reviewId,
      reporterId: session.user.name
    })

    if (existingReport) {
      return new NextResponse('You have already reported this review', { status: 400 })
    }

    // Create report
    const report = await db.collection('reports').insertOne({
      reviewId: reviewId,
      reporterId: session.user.name,
      reason: reason,
      createdAt: new Date()
    })

    // Get current report count
    const reportCount = await db.collection('reports').countDocuments({
      reviewId: reviewId
    })

    // Update review's report count and hide if threshold reached
    const review = await db.collection('reviews').findOneAndUpdate(
      { _id: new ObjectId(reviewId) },
      { 
        $set: {
          reportCount: reportCount,
          isHidden: reportCount >= 10
        }
      },
      { returnDocument: 'after' }
    )

    return NextResponse.json({ 
      success: true, 
      report: report, 
      review: review.value 
    })

  } catch (error) {
    console.error('[REVIEW_REPORT]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 