import { connectMongoDB } from "@/lib/mongodb"
import { Question } from "@/models/qa"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { question } = await req.json()
    await connectMongoDB()
    
    // Check if a similar question was recently posted by the same user
    const recentQuestion = await Question.findOne({
      question,
      userName: session.user?.name,
      timestamp: {
        $gte: new Date(Date.now() - 5000).toLocaleString() // Within last 5 seconds
      }
    })

    if (recentQuestion) {
      return NextResponse.json({ 
        success: false, 
        error: "Please wait before posting again" 
      }, { status: 429 })
    }

    const qa = await Question.create({
      question,
      userName: session.user?.name || "Anonymous"
    })
    
    return NextResponse.json({ success: true, qa }, { status: 201 })
  } catch (error) {
    console.error("Error creating Q&A:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    await connectMongoDB()
    
    // Get search query from URL
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search')?.toLowerCase() || ''
    
    // Build search query
    const query = searchQuery 
      ? { 
          $or: [
            { question: { $regex: searchQuery, $options: 'i' } },
            { userName: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      : {}
    
    // Get questions with search filter
    const qas = await Question.find(query)
      .sort({ timestamp: -1 })  // Sort by timestamp descending
      .lean()  // Convert to plain JavaScript objects
      .exec()

    // Ensure each question has a unique _id
    const uniqueQAs = Array.from(
      new Map(qas.map((qa: any) => [qa._id.toString(), qa])).values()
    )

    return NextResponse.json({ success: true, qas: uniqueQAs })
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
} 