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
    const { content, userEmail } = await req.json()
    
    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    await connectMongoDB()
    
    const question = await Question.findById(params.id)
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const newComment = {
      content: content.trim(),
      userName: session.user?.name || "Anonymous",
      userEmail: userEmail || session.user?.email,
      timestamp: new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).toUpperCase()
    }

    question.comments.push(newComment)
    await question.save()
    
    return NextResponse.json({ 
      success: true, 
      comment: newComment 
    }, { status: 200 })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 