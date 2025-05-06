import { connectMongoDB } from "@/lib/mongodb"
import { Question } from "@/models/qa"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { question } = await request.json()
    await connectMongoDB()
    
    // Find the question first to check ownership
    const existingQuestion = await Question.findById(params.id)

    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Check if the user owns this question
    if (existingQuestion.userName !== session.user?.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update the question
    const updatedQuestion = await Question.findByIdAndUpdate(
      params.id,
      { question },
      { new: true }
    )

    if (!updatedQuestion) {
      return NextResponse.json(
        { error: "Failed to update question" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, question: updatedQuestion })
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
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
    await connectMongoDB()
    
    // Find the question first to check ownership
    const existingQuestion = await Question.findById(params.id)

    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Check if the user owns this question
    if (existingQuestion.userName !== session.user?.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the question
    const deletedQuestion = await Question.findByIdAndDelete(params.id)

    if (!deletedQuestion) {
      return NextResponse.json(
        { error: "Failed to delete question" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
} 