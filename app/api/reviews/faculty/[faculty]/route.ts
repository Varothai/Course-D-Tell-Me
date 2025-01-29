import { connectMongoDB } from "@/lib/mongodb";
import { Review } from "@/models/review";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { faculty: string } }
) {
  try {
    await connectMongoDB();
    const { faculty } = params;
    console.log("Fetching reviews for faculty:", faculty);
    
    const reviews = await Review.find({ faculty }).sort({ createdAt: -1 });
    console.log(`Found ${reviews.length} reviews for faculty ${faculty}`);
    
    return NextResponse.json({ 
      success: true, 
      reviews: reviews.map(review => review.toJSON()) 
    });
  } catch (error) {
    console.error("Error fetching reviews by faculty:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 