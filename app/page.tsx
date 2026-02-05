import { getReviewsForHome } from "@/lib/fetch-reviews"
import HomeClient from "@/components/home-client"

export default async function HomePage() {
  const initialReviews = await getReviewsForHome()
  return <HomeClient initialReviews={initialReviews} />
}
