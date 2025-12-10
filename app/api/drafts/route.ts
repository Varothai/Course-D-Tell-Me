import { connectMongoDB } from "@/lib/mongodb"
import { Draft } from "@/models/draft"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectMongoDB()
    
    const drafts = await Draft.find({ userId: session.user?.id })
      .sort({ lastSaved: -1 })
      .lean()
      .exec()
    
    const transformedDrafts = drafts.map(draft => {
      const { _id, __v, ...rest } = draft as { _id: { toString: () => string }, __v: any, [key: string]: any }
      return {
        ...rest,
        _id: _id.toString(),
        id: _id.toString()
      }
    })
    
    return NextResponse.json({ success: true, drafts: transformedDrafts })
  } catch (error) {
    console.error("Error fetching drafts:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const draftData = await req.json()
    await connectMongoDB()

    const draft = {
      userId: session.user?.id,
      courseId: draftData.courseId || "",
      courseName: draftData.courseName || "",
      rating: draftData.rating || 0,
      review: draftData.review || "",
      faculty: draftData.faculty || "",
      major: draftData.major || "",
      customMajor: draftData.customMajor || "",
      studyPlan: draftData.studyPlan || "",
      section: draftData.section || "",
      programType: draftData.programType || "",
      electiveType: draftData.electiveType || "none",
      readingAmount: draftData.readingAmount || 0,
      contentDifficulty: draftData.contentDifficulty || 0,
      teachingQuality: draftData.teachingQuality || 0,
      grade: draftData.grade || "",
      isAnonymous: draftData.isAnonymous || false,
      lastSaved: new Date()
    }

    const created = await Draft.create(draft)
    
    return NextResponse.json({ 
      success: true, 
      draft: created.toJSON() 
    }, { status: 201 })
  } catch (error) {
    console.error("Error saving draft:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { draftId, ...draftData } = await req.json()
    await connectMongoDB()

    const updatedDraft = await Draft.findOneAndUpdate(
      { _id: draftId, userId: session.user?.id },
      { 
        ...draftData,
        lastSaved: new Date()
      },
      { new: true }
    )

    if (!updatedDraft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      draft: updatedDraft.toJSON() 
    })
  } catch (error) {
    console.error("Error updating draft:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const draftId = searchParams.get('draftId')
    
    if (!draftId) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 })
    }

    await connectMongoDB()
    
    const result = await Draft.findOneAndDelete({ 
      _id: draftId, 
      userId: session.user?.id 
    })
    
    if (!result) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting draft:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

