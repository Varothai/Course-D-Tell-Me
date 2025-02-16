import { connectMongoDB } from "@/lib/mongodb";
import { Comment } from "@/models/comment"; 
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reviewId, comment, userName } = await request.json();
    
    if (!comment?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    await connectMongoDB();

    const newComment = await Comment.create({
      reviewId,
      comment: comment.trim(),
      userName: userName || session.user?.name || "Anonymous",
      userEmail: session.user?.email,
      createdAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      comment: newComment 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    
    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    await connectMongoDB();

    const comments = await Comment.find({ reviewId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
