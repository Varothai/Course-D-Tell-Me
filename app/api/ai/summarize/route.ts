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
          keyPoints: { en: [], th: [] },
          sentiment: 'neutral',
          recommendations: { en: [], th: [] },
          commonThemes: [],
          summaryText: { en: '', th: '' },
          primaryLanguage: 'en' as const,
          metrics: {
            averageDifficulty: 0,
            averageWorkload: 0,
            averageTeachingQuality: 0
          }
        }
      })
    }

    // Generate AI summary (including prose in Thai + English)
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

// Thai theme names for summary
const themeNamesTh: Record<string, string> = {
  'Teaching Quality': 'คุณภาพการสอน',
  'Difficulty': 'ความยาก',
  'Workload': 'ภาระงาน',
  'Engagement': 'ความน่าสนใจ',
  'Assessment': 'การประเมิน'
}

// Detect if reviews are mostly Thai
function detectPrimaryLanguage(reviews: any[]): 'th' | 'en' {
  const thaiChars = /[\u0E00-\u0E7F]/
  let thaiCount = 0
  let enCount = 0
  for (const r of reviews) {
    const text = (r.review || '').trim()
    if (!text) continue
    const thaiRatio = (text.match(/[\u0E00-\u0E7F]/g) || []).length / text.length
    if (thaiRatio > 0.3) thaiCount++
    else enCount++
  }
  return thaiCount >= enCount ? 'th' : 'en'
}

async function generateSummary(reviews: any[]): Promise<{
  overallRating: number
  totalReviews: number
  keyPoints: { en: string[]; th: string[] }
  sentiment: 'positive' | 'neutral' | 'negative'
  recommendations: { en: string[]; th: string[] }
  commonThemes: {
    theme: string
    frequency: number
    sentiment: 'positive' | 'neutral' | 'negative'
  }[]
  summaryText: { en: string; th: string }
  primaryLanguage: 'th' | 'en'
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

  // Generate key points (bilingual) - only supplementary info not in prose
  const keyPointsEn: string[] = []
  const keyPointsTh: string[] = []
  if (commonThemes.some(t => t.theme === 'Workload' && t.sentiment === 'negative')) {
    keyPointsEn.push("Notable workload reported")
    keyPointsTh.push("มีภาระงานค่อนข้างมาก")
  }
  if (commonThemes.some(t => t.theme === 'Difficulty' && t.sentiment === 'negative')) {
    keyPointsEn.push("Consider prerequisites before enrolling")
    keyPointsTh.push("ควรตรวจสอบ prerequisite ก่อนลงทะเบียน")
  }
  if (commonThemes.some(t => t.theme === 'Teaching Quality' && t.sentiment === 'positive')) {
    keyPointsEn.push("Teaching quality is well regarded")
    keyPointsTh.push("คุณภาพการสอนได้รับการยอมรับ")
  }
  if (mostCommonGrade) {
    keyPointsEn.push(`Most common grade: ${mostCommonGrade}`)
    keyPointsTh.push(`เกรดที่พบมากที่สุด: ${mostCommonGrade}`)
  }

  // Recommendations (bilingual)
  const recommendationsEn: string[] = []
  const recommendationsTh: string[] = []
  if (overallRating >= 4) {
    recommendationsEn.push("Highly recommended based on reviews")
    recommendationsTh.push("แนะนำอย่างยิ่งจากรีวิว")
  } else if (overallRating <= 2) {
    recommendationsEn.push("Read detailed reviews before enrolling")
    recommendationsTh.push("อ่านรีวิวโดยละเอียดก่อนลงทะเบียน")
  }

  // Build short prose summary (Thai + English)
  const primaryLanguage = detectPrimaryLanguage(reviews)
  const summaryText = buildSummaryProse({
    overallRating,
    totalReviews: reviews.length,
    sentiment,
    commonThemes
  })

  return {
    overallRating: Math.round(overallRating * 10) / 10,
    totalReviews: reviews.length,
    keyPoints: { en: keyPointsEn, th: keyPointsTh },
    sentiment,
    recommendations: { en: recommendationsEn, th: recommendationsTh },
    commonThemes,
    summaryText,
    primaryLanguage,
    metrics: {
      averageDifficulty: Math.round(averageDifficulty * 10) / 10,
      averageWorkload: Math.round(averageWorkload * 10) / 10,
      averageTeachingQuality: Math.round(averageTeachingQuality * 10) / 10,
      mostCommonGrade: mostCommonGrade
    }
  }
}

function buildSummaryProse(data: {
  overallRating: number
  totalReviews: number
  sentiment: 'positive' | 'neutral' | 'negative'
  commonThemes: Array<{ theme: string; frequency: number; sentiment: string }>
}): { en: string; th: string } {
  const { overallRating, totalReviews, sentiment, commonThemes } = data
  const topThemes = commonThemes.slice(0, 2)

  // Compact English: one sentence with rating + themes + takeaway
  const themePart = topThemes.length > 0
    ? `${topThemes.map(t => t.theme.toLowerCase()).join(' and ')} are often discussed. `
    : ''
  const takeaway = sentiment === 'positive'
    ? 'Students generally recommend this course.'
    : sentiment === 'negative'
    ? 'Consider reading full reviews before enrolling.'
    : 'Reviews are mixed—check individual feedback.'
  const en = `Based on ${totalReviews} review${totalReviews !== 1 ? 's' : ''} (avg ${overallRating.toFixed(1)}/5): ${themePart}${takeaway}`

  // Compact Thai
  const themePartTh = topThemes.length > 0
    ? `${topThemes.map(t => themeNamesTh[t.theme] || t.theme).join(' และ ')} ถูกพูดถึงบ่อย. `
    : ''
  const takeawayTh = sentiment === 'positive'
    ? 'ผู้รีวิวส่วนใหญ่แนะนำรายวิชานี้.'
    : sentiment === 'negative'
    ? 'ควรอ่านรีวิวเต็มก่อนลงทะเบียน.'
    : 'รีวิวหลากหลาย แนะนำให้อ่านแต่ละความคิดเห็น.'
  const th = `จาก ${totalReviews} รีวิว (เฉลี่ย ${overallRating.toFixed(1)}/5): ${themePartTh}${takeawayTh}`

  return { en, th }
}
