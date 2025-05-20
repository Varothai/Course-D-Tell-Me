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
    const reviews = await Review.find({ 
      userId: session.user?.id 
    }).sort({ timestamp: -1 })

    return NextResponse.json({ success: true, reviews })
  } catch (error) {
    console.error("Error fetching user reviews:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 