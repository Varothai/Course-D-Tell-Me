import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { Bookmark } from "@/models/bookmark"
import mongoose from "mongoose"
import { connectMongoDB } from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    await connectMongoDB()
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reviewId } = await req.json()

    // Check if bookmark already exists
    const existingBookmark = await Bookmark.findOne({
      userId: session.user.id,
      reviewId: reviewId,
    })

    if (existingBookmark) {
      return NextResponse.json({ error: "Review already bookmarked" }, { status: 400 })
    }

    const bookmark = await Bookmark.create({
      userId: session.user.id,
      reviewId,
    })

    return NextResponse.json(bookmark)
  } catch (error) {
    if (error instanceof mongoose.Error.DuplicateKey) {
      return NextResponse.json({ error: "Already bookmarked" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error creating bookmark" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    await connectMongoDB()
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reviewId } = await req.json()

    await Bookmark.deleteOne({
      userId: session.user.id,
      reviewId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error removing bookmark" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    await connectMongoDB()
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const reviewId = url.searchParams.get("reviewId")

    if (reviewId) {
      // Check if a specific review is bookmarked
      const bookmark = await Bookmark.findOne({
        userId: session.user.id,
        reviewId: reviewId,
      })
      return NextResponse.json({ isBookmarked: !!bookmark })
    } else {
      // Fetch all bookmarks
      const bookmarks = await Bookmark.find({
        userId: session.user.id,
      }).sort({ createdAt: -1 })
      return NextResponse.json(bookmarks)
    }
  } catch (error) {
    return NextResponse.json({ error: "Error fetching bookmarks" }, { status: 500 })
  }
}

