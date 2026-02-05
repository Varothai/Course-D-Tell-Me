import { connectMongoDB } from "@/lib/mongodb"
import { Review } from "@/models/review"

/**
 * Server-side only. Fetches reviews for the homepage so they can be
 * included in the initial HTML and appear immediately (no client fetch delay).
 */
export async function getReviewsForHome() {
  try {
    await connectMongoDB()

    const reviews = await Review.find({ isHidden: { $ne: true } })
      .sort({ timestamp: -1 })
      .lean()
      .exec()

    const transformedReviews = reviews.map((review) => {
      const r = review as {
        _id: { toString: () => string }
        __v?: unknown
        createdAt?: Date
        timestamp?: Date
        likes?: number | string[]
        dislikes?: number | string[]
        reactions?: unknown
        isAnonymous?: boolean
        [key: string]: unknown
      }
      const { _id, __v, ...rest } = r
      const idStr = _id.toString()
      const createdAt = r.createdAt || r.timestamp || new Date()
      const timestamp = r.timestamp || createdAt

      return {
        ...rest,
        _id: idStr,
        id: idStr,
        createdAt:
          typeof createdAt === "object" && "toLocaleDateString" in createdAt
            ? (createdAt as Date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : String(createdAt),
        timestamp:
          typeof timestamp === "object" && "toISOString" in timestamp
            ? (timestamp as Date).toISOString()
            : String(timestamp),
        likes: Array.isArray(r.likes) ? r.likes : [],
        dislikes: Array.isArray(r.dislikes) ? r.dislikes : [],
        hasLiked: false,
        hasDisliked: false,
        reactions: r.reactions || {
          thumbsUp: [],
          heart: [],
          laugh: [],
          surprised: [],
          sad: [],
        },
        isAnonymous: r.isAnonymous || false,
      }
    })

    return transformedReviews
  } catch (err) {
    console.error("Error fetching reviews for home:", err)
    return []
  }
}
