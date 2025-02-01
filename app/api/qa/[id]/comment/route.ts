import { connectMongoDB } from "@/lib/mongodb"
import { Question } from "@/models/qa"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { content } = await req.json()
    await connectMongoDB()
    
    const question = await Question.findById(params.id)
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    question.comments.push({
      content,
      userName: session.user?.name || "Anonymous",
      timestamp: new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).toUpperCase()
    })

    await question.save()
    
    return NextResponse.json({ success: true, question }, { status: 200 })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 