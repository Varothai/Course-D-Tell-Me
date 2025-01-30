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
    const { question, userName } = await req.json()
    await connectMongoDB()
    
    const qa = await Question.create({
      question,
      userName
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

export async function GET() {
  try {
    await connectMongoDB()
    const qas = await Question.find().sort({ timestamp: -1 })
    return NextResponse.json({ success: true, qas })
  } catch (error) {
    console.error("Error fetching Q&As:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 