import { connectMongoDB } from "@/lib/mongodb"
import { Question } from "@/models/qa"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { question, userName } = await request.json()
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