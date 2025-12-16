import { NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import { Review } from '@/models/review'

export async function POST(request: Request) {
  try {
    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      )
    }

    await connectMongoDB()

    // Fetch all reviews for the course
    const reviews = await Review.find({ 
      courseId,
      isHidden: { $ne: true }
    })
      .sort({ timestamp: -1 })
      .lean()
      .exec()

    if (reviews.length === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          overallRating: 0,
          totalReviews: 0,
          keyPoints: [],
          sentiment: 'neutral',
          recommendations: [],
          commonThemes: [],
          metrics: {
            averageDifficulty: 0,
            averageWorkload: 0,
            averageTeachingQuality: 0
          }
        }
      })
    }

    // Generate AI summary
    const summary = await generateSummary(reviews)

    return NextResponse.json({
      success: true,
      summary
    })
  } catch (error) {
    console.error('Summarization error:', error)
    return NextResponse.json(
      { error: "Failed to generate summary", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function generateSummary(reviews: any[]): Promise<{
  overallRating: number
  totalReviews: number
  keyPoints: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  recommendations: string[]
  commonThemes: {
    theme: string
    frequency: number
    sentiment: 'positive' | 'neutral' | 'negative'
  }[]
  metrics: {
    averageDifficulty: number
    averageWorkload: number
    averageTeachingQuality: number
    mostCommonGrade?: string
  }
}> {
  // Calculate overall rating
  const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0)
  const overallRating = totalRating / reviews.length

  // Calculate metrics
  const difficultyScores = reviews.map(r => r.contentDifficulty || 0).filter(score => score > 0)
  const workloadScores = reviews.map(r => r.readingAmount || 0).filter(score => score > 0)
  const teachingScores = reviews.map(r => r.teachingQuality || 0).filter(score => score > 0)
  
  const averageDifficulty = difficultyScores.length > 0 
    ? difficultyScores.reduce((a, b) => a + b, 0) / difficultyScores.length 
    : 0
  const averageWorkload = workloadScores.length > 0
    ? workloadScores.reduce((a, b) => a + b, 0) / workloadScores.length
    : 0
  const averageTeachingQuality = teachingScores.length > 0
    ? teachingScores.reduce((a, b) => a + b, 0) / teachingScores.length
    : 0

  // Find most common grade
  const gradeCounts: Record<string, number> = {}
  reviews.forEach(review => {
    if (review.grade) {
      gradeCounts[review.grade] = (gradeCounts[review.grade] || 0) + 1
    }
  })
  const mostCommonGrade = Object.entries(gradeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  // Extract key themes and sentiments
  const themes: Record<string, { count: number; ratings: number[] }> = {}
  
  reviews.forEach(review => {
    const text = (review.review || '').toLowerCase()
    const rating = review.rating || 0

    // Extract common themes
    if (text.includes('professor') || text.includes('instructor') || text.includes('teacher')) {
      if (!themes['Teaching Quality']) themes['Teaching Quality'] = { count: 0, ratings: [] }
      themes['Teaching Quality'].count++
      themes['Teaching Quality'].ratings.push(rating)
    }
    if (text.includes('difficult') || text.includes('hard') || text.includes('easy') || text.includes('challenging')) {
      if (!themes['Difficulty']) themes['Difficulty'] = { count: 0, ratings: [] }
      themes['Difficulty'].count++
      themes['Difficulty'].ratings.push(rating)
    }
    if (text.includes('homework') || text.includes('assignment') || text.includes('project') || text.includes('workload')) {
      if (!themes['Workload']) themes['Workload'] = { count: 0, ratings: [] }
      themes['Workload'].count++
      themes['Workload'].ratings.push(rating)
    }
    if (text.includes('interesting') || text.includes('enjoyable') || text.includes('fun') || text.includes('boring')) {
      if (!themes['Engagement']) themes['Engagement'] = { count: 0, ratings: [] }
      themes['Engagement'].count++
      themes['Engagement'].ratings.push(rating)
    }
    if (text.includes('grade') || text.includes('grading') || text.includes('exam') || text.includes('test')) {
      if (!themes['Assessment']) themes['Assessment'] = { count: 0, ratings: [] }
      themes['Assessment'].count++
      themes['Assessment'].ratings.push(rating)
    }
  })

  // Convert themes to common themes format
  const commonThemes = Object.entries(themes)
    .map(([theme, data]) => {
      const avgRating = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
      return {
        theme,
        frequency: data.count,
        sentiment: avgRating >= 3.5 ? 'positive' : avgRating >= 2.5 ? 'neutral' : 'negative' as 'positive' | 'neutral' | 'negative'
      }
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5)

  // Determine overall sentiment
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  if (overallRating >= 4) sentiment = 'positive'
  else if (overallRating <= 2) sentiment = 'negative'

  // Generate key points
  const keyPoints: string[] = []
  
  if (overallRating >= 4) {
    keyPoints.push(`Highly rated course with an average rating of ${overallRating.toFixed(1)}/5`)
  } else if (overallRating <= 2) {
    keyPoints.push(`Lower rated course with an average rating of ${overallRating.toFixed(1)}/5`)
  } else {
    keyPoints.push(`Moderately rated course with an average rating of ${overallRating.toFixed(1)}/5`)
  }

  if (commonThemes.length > 0) {
    const topTheme = commonThemes[0]
    keyPoints.push(`${topTheme.theme} is frequently mentioned (${topTheme.frequency} reviews)`)
  }

  // Generate recommendations
  const recommendations: string[] = []
  
  if (overallRating >= 4) {
    recommendations.push("This course is highly recommended based on student reviews")
  } else if (overallRating <= 2) {
    recommendations.push("Consider reading detailed reviews before enrolling")
  }

  if (commonThemes.some(t => t.theme === 'Workload' && t.sentiment === 'negative')) {
    recommendations.push("Be prepared for a significant workload")
  }

  if (commonThemes.some(t => t.theme === 'Difficulty' && t.sentiment === 'negative')) {
    recommendations.push("This course may be challenging - ensure you have the prerequisites")
  }

  return {
    overallRating: Math.round(overallRating * 10) / 10,
    totalReviews: reviews.length,
    keyPoints,
    sentiment,
    recommendations,
    commonThemes,
    metrics: {
      averageDifficulty: Math.round(averageDifficulty * 10) / 10,
      averageWorkload: Math.round(averageWorkload * 10) / 10,
      averageTeachingQuality: Math.round(averageTeachingQuality * 10) / 10,
      mostCommonGrade: mostCommonGrade
    }
  }
}
