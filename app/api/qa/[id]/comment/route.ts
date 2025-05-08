import { connectMongoDB } from "@/lib/mongodb"
import { Question } from "@/models/qa"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { content } = await request.json()
    await connectMongoDB()
    
    const question = await Question.findById(params.id)
    
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const newComment = {
      content,
      userName: session.user?.name || "Anonymous",
      userEmail: session.user?.email,
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
    }, { status: 201 })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { commentId, content } = await request.json()
    await connectMongoDB()
    
    const question = await Question.findById(params.id)
    
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const commentIndex = question.comments.findIndex(
      (c: any) => c._id.toString() === commentId
    )

    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if the user is the comment owner
    if (question.comments[commentIndex].userEmail !== session.user?.email) {
      return NextResponse.json({ error: "Unauthorized to edit this comment" }, { status: 403 })
    }

    question.comments[commentIndex].content = content
    await question.save()

    return NextResponse.json({ 
      success: true, 
      comment: question.comments[commentIndex]
    })
  } catch (error) {
    console.error("Error updating comment:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { commentId } = await request.json()
    await connectMongoDB()
    
    const question = await Question.findById(params.id)
    
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const commentIndex = question.comments.findIndex(
      (c: any) => c._id.toString() === commentId
    )

    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if the user is the comment owner
    if (question.comments[commentIndex].userEmail !== session.user?.email) {
      return NextResponse.json({ error: "Unauthorized to delete this comment" }, { status: 403 })
    }

    question.comments.splice(commentIndex, 1)
    await question.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 