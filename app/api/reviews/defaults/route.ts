import { connectMongoDB } from "@/lib/mongodb"
import { Review } from "@/models/review"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectMongoDB()
    
    // Get the most recent review for this user
    const mostRecentReview = await Review.findOne({ 
      userId: session.user?.id 
    })
    .sort({ timestamp: -1 })
    .select('faculty major programType studyPlan')
    .lean()

    if (!mostRecentReview) {
      return NextResponse.json({ 
        success: true, 
        defaults: null 
      })
    }

    return NextResponse.json({ 
      success: true, 
      defaults: {
        faculty: mostRecentReview.faculty || null,
        major: mostRecentReview.major || null,
        programType: mostRecentReview.programType || mostRecentReview.studyPlan || null,
      }
    })
  } catch (error) {
    console.error("Error fetching default values:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
