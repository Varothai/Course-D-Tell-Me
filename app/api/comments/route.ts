import { connectMongoDB } from "@/lib/mongodb";
import { Comment } from "@/models/comment"; 
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { reviewId, comment, userName } = await request.json();
    console.log("Received data:", { reviewId, comment, userName });
    await connectMongoDB();

    const newComment = await Comment.create({
      reviewId,
      comment,
      userName,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    await connectMongoDB();

    const comments = await Comment.find({ reviewId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
