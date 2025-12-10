import { connectMongoDB } from "@/lib/mongodb"
import { Review } from "@/models/review"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { ObjectId } from 'mongodb'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const review = await req.json()
    console.log("Received review data:", review)

    await connectMongoDB()
    console.log("MongoDB connected")

    const newReview = {
      courseId: review.courseId,
      courseName: review.courseName,
      userId: session.user?.id,
      userName: review.isAnonymous ? "Anonymous" : session.user?.name,
      rating: review.rating,
      review: review.review,
      faculty: review.faculty,
      major: review.major,
      studyPlan: review.studyPlan,
      section: review.section,
      programType: review.programType,
      electiveType: review.electiveType,
      readingAmount: review.readingAmount,
      contentDifficulty: review.contentDifficulty,
      teachingQuality: review.teachingQuality,
      grade: review.grade,
      customMajor: review.customMajor,
      likes: 0,
      dislikes: 0,
      reactions: {
        thumbsUp: [],
        heart: [],
        laugh: [],
        surprised: [],
        sad: []
      },
      comments: [],
      isBookmarked: false,
      isAnonymous: review.isAnonymous || false,
      reportCount: 0,
      isHidden: false,
      timestamp: new Date()
    }
    console.log("Saving review to database:", newReview)

    const created = await Review.create(newReview)
    console.log("Saved review:", created.toJSON())

    return NextResponse.json({ 
      success: true, 
      review: created.toJSON() 
    }, { status: 201 })
  } catch (error) {
    console.error("Full error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    await connectMongoDB()
    
    const reviews = await Review.find({ isHidden: { $ne: true } })
      .sort({ timestamp: -1 })
      .lean()
      .exec()
    
    const transformedReviews = reviews.map(review => {
      const { _id, __v, ...rest } = review as { _id: { toString: () => string }, __v: any, [key: string]: any }
      return {
        ...rest,
        _id: _id.toString(),
        id: _id.toString(),
        reactions: review.reactions || {
          thumbsUp: [],
          heart: [],
          laugh: [],
          surprised: [],
          sad: []
        },
        timestamp: review.timestamp || new Date().toLocaleString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).toUpperCase()
      }
    })
    
    return NextResponse.json({ success: true, reviews: transformedReviews })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { reviewId, action, comment, commentId, newComment, reaction, userId } = body;
    
    await connectMongoDB();

    let updatedReview;

    if (action === 'like') {
      updatedReview = await Review.findById(reviewId);
      if (!updatedReview) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }
      updatedReview.likes += 1;
      await updatedReview.save();
    } else if (action === 'dislike') {
      updatedReview = await Review.findById(reviewId);
      if (!updatedReview) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }
      updatedReview.dislikes += 1;
      await updatedReview.save();
    } else if (action === 'comment') {
      updatedReview = await Review.findById(reviewId);
      
      if (!updatedReview) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }

      const newComment = {
        comment: comment,
        userName: session.user?.name || 'Anonymous',
        createdAt: new Date()
      };

      updatedReview.comments = updatedReview.comments || [];
      updatedReview.comments.push(newComment);
      await updatedReview.save();
    } else if (action === 'editComment') {
      updatedReview = await Review.findById(reviewId);
      
      if (!updatedReview) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }

      const commentIndex = updatedReview.comments.findIndex(
        (c: any) => c._id.toString() === commentId
      );

      if (commentIndex === -1) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }

      // Check if the user is the comment owner
      if (updatedReview.comments[commentIndex].userName !== session.user?.name) {
        return NextResponse.json({ error: "Unauthorized to edit this comment" }, { status: 403 });
      }

      updatedReview.comments[commentIndex].comment = newComment;
      await updatedReview.save();
    } else if (action === 'deleteComment') {
      updatedReview = await Review.findById(reviewId);
      
      if (!updatedReview) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }

      const commentIndex = updatedReview.comments.findIndex(
        (c: any) => c._id.toString() === commentId
      );

      if (commentIndex === -1) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }

      // Check if the user is the comment owner
      if (updatedReview.comments[commentIndex].userName !== session.user?.name) {
        return NextResponse.json({ error: "Unauthorized to delete this comment" }, { status: 403 });
      }

      updatedReview.comments.splice(commentIndex, 1);
      await updatedReview.save();
    } else if (action === 'react') {
      updatedReview = await Review.findById(reviewId);
      
      if (!updatedReview) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }

      if (!updatedReview.reactions) {
        updatedReview.reactions = {
          thumbsUp: [],
          heart: [],
          laugh: [],
          surprised: [],
          sad: []
        };
      }

      const userEmail = userId || session.user?.email || session.user?.id;
      if (!userEmail) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
      }

      // Remove user from all reaction arrays first
      Object.keys(updatedReview.reactions).forEach((key) => {
        const reactionKey = key as keyof typeof updatedReview.reactions;
        updatedReview.reactions[reactionKey] = updatedReview.reactions[reactionKey].filter(
          (id: string) => id !== userEmail
        );
      });

      // Add user to the selected reaction array if reaction is provided
      if (reaction && reaction !== 'none') {
        const validReactions = ['thumbsUp', 'heart', 'laugh', 'surprised', 'sad'];
        if (validReactions.includes(reaction)) {
          updatedReview.reactions[reaction as keyof typeof updatedReview.reactions].push(userEmail);
        }
      }

      await updatedReview.save();
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Transform the review data for response
    const transformedReview = {
      ...updatedReview.toObject(),
      _id: updatedReview._id.toString(),
      id: updatedReview._id.toString(),
      reactions: updatedReview.reactions || {
        thumbsUp: [],
        heart: [],
        laugh: [],
        surprised: [],
        sad: []
      }
    };

    return NextResponse.json({ 
      success: true, 
      review: transformedReview
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 