import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectMongoDB } from '@/lib/mongodb'
import { Review } from '@/models/review'

interface ReviewAssistantRequest {
  currentReview: string
  courseName?: string
  courseId?: string
  rating?: number
}

// Simple in-memory cache with TTL (5 minutes)
const suggestionCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Generate cache key from review content
function getCacheKey(review: string, courseId?: string, rating?: number): string {
  const normalizedReview = review.trim().toLowerCase().slice(0, 200) // Use first 200 chars for key
  return `${courseId || 'no-course'}-${rating || 0}-${normalizedReview.length}-${hashString(normalizedReview)}`
}

// Simple hash function for cache keys
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

// Clean old cache entries
function cleanCache() {
  const now = Date.now()
  for (const [key, value] of suggestionCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      suggestionCache.delete(key)
    }
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { currentReview, courseName, courseId, rating }: ReviewAssistantRequest = await request.json()

    if (!currentReview || currentReview.trim().length === 0) {
      return NextResponse.json(
        { error: "Review text is required" },
        { status: 400 }
      )
    }

    // Check cache first
    cleanCache()
    const cacheKey = getCacheKey(currentReview, courseId, rating)
    const cached = suggestionCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        suggestions: cached.data,
        cached: true
      })
    }

    // Fetch existing reviews for context if courseId is provided
    let courseContext: {
      commonTopics: string[]
      averageRating: number
      reviewCount: number
      commonKeywords: string[]
    } | null = null

    if (courseId) {
      try {
        await connectMongoDB()
        const existingReviews = await Review.find({
          courseId,
          isHidden: { $ne: true }
        })
          .select('review rating')
          .limit(50) // Analyze up to 50 recent reviews
          .lean()

        if (existingReviews.length > 0) {
          const reviewsData: Array<{ review: string; rating: number }> = existingReviews.map((r: any) => ({ 
            review: String(r.review || ''), 
            rating: Number(r.rating || 0) 
          }))
          courseContext = analyzeCourseContext(reviewsData)
        }
      } catch (error) {
        console.error('Error fetching course context:', error)
        // Continue without context if fetch fails
      }
    }

    // Generate suggestions with context
    const suggestions = await generateReviewSuggestions(
      currentReview, 
      courseName, 
      courseId, 
      rating,
      courseContext
    )

    // Cache the result
    suggestionCache.set(cacheKey, {
      data: suggestions,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      suggestions
    })
  } catch (error) {
    console.error('Review assistant error:', error)
    return NextResponse.json(
      { error: "Failed to generate suggestions", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Analyze existing reviews to extract common topics and patterns
function analyzeCourseContext(reviews: Array<{ review: string; rating: number }>): {
  commonTopics: string[]
  averageRating: number
  reviewCount: number
  commonKeywords: string[]
} {
  const allText = reviews.map(r => r.review.toLowerCase()).join(' ')
  const ratings = reviews.map(r => r.rating)
  const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length

  // Extract common keywords (excluding common words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'ของ', 'ที่', 'และ', 'หรือ', 'แต่', 'ใน', 'บน', 'ที่', 'เพื่อ', 'ของ', 'กับ', 'โดย', 'เป็น', 'คือ', 'มี', 'จะ', 'ได้', 'ให้', 'ทำ', 'ไป', 'มา', 'นี้', 'นั้น', 'ทุก', 'ทั้ง', 'บาง', 'ไม่', 'ก็', 'แล้ว', 'ยัง', 'อีก'])

  const words = allText.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w))
  const wordFreq = new Map<string, number>()
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
  })

  const commonKeywords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)

  // Detect common topics based on keyword patterns
  const commonTopics: string[] = []
  const topicKeywords = {
    instructor: ['instructor', 'professor', 'teacher', 'lecturer', 'อาจารย์', 'ผู้สอน'],
    difficulty: ['difficult', 'hard', 'easy', 'challenging', 'ยาก', 'ง่าย', 'ท้าทาย'],
    workload: ['homework', 'assignment', 'project', 'workload', 'การบ้าน', 'งาน', 'โปรเจค'],
    content: ['content', 'material', 'curriculum', 'syllabus', 'เนื้อหา', 'หลักสูตร'],
    exam: ['exam', 'test', 'quiz', 'midterm', 'final', 'สอบ', 'ทดสอบ']
  }

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    const mentions = keywords.filter(kw => allText.includes(kw)).length
    if (mentions >= 3) {
      commonTopics.push(topic)
    }
  })

  return {
    commonTopics,
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: reviews.length,
    commonKeywords
  }
}

// Helper function to get keywords for a topic
function getTopicKeywords(topic: string, isThai: boolean): string[] {
  const topicMap: Record<string, { en: string[]; th: string[] }> = {
    instructor: {
      en: ['instructor', 'professor', 'teacher', 'lecturer', 'teaches', 'teaching'],
      th: ['อาจารย์', 'ผู้สอน', 'ครู', 'อาจารย์ผู้สอน', 'สอน', 'การสอน']
    },
    difficulty: {
      en: ['difficult', 'hard', 'easy', 'challenging', 'difficulty', 'level'],
      th: ['ยาก', 'ง่าย', 'ยากมาก', 'ง่ายมาก', 'ท้าทาย', 'ระดับความยาก']
    },
    workload: {
      en: ['homework', 'assignment', 'project', 'workload', 'work', 'task'],
      th: ['การบ้าน', 'งาน', 'โปรเจค', 'โปรเจกต์', 'ภาระงาน']
    },
    content: {
      en: ['content', 'material', 'curriculum', 'syllabus'],
      th: ['เนื้อหา', 'หลักสูตร', 'บทเรียน']
    },
    exam: {
      en: ['exam', 'test', 'quiz', 'midterm', 'final'],
      th: ['สอบ', 'ทดสอบ', 'ข้อสอบ', 'สอบกลางภาค', 'สอบปลายภาค']
    }
  }
  
  return topicMap[topic] ? (isThai ? topicMap[topic].th : topicMap[topic].en) : []
}

// Helper function to get display name for a topic
function getTopicName(topic: string, isThai: boolean): string {
  const topicNames: Record<string, { en: string; th: string }> = {
    instructor: { en: 'instructor', th: 'อาจารย์' },
    difficulty: { en: 'difficulty', th: 'ความยาก' },
    workload: { en: 'workload', th: 'ภาระงาน' },
    content: { en: 'content', th: 'เนื้อหา' },
    exam: { en: 'exams', th: 'การสอบ' }
  }
  
  return topicNames[topic] ? (isThai ? topicNames[topic].th : topicNames[topic].en) : topic
}

// Detect if text contains Thai characters
function isThai(text: string): boolean {
  return /[\u0E00-\u0E7F]/.test(text)
}

// Count words - for Thai, count characters since Thai doesn't use spaces
function countWords(text: string, isThaiText: boolean): number {
  if (isThaiText) {
    // For Thai, count Thai characters (approximate word count)
    const thaiChars = text.match(/[\u0E00-\u0E7F]/g) || []
    return Math.ceil(thaiChars.length / 3) // Rough estimate: ~3 chars per word
  } else {
    // For English, count words by spaces
    return text.split(/\s+/).filter(word => word.length > 0).length
  }
}

async function generateReviewSuggestions(
  review: string,
  courseName?: string,
  courseId?: string,
  rating?: number,
  courseContext?: {
    commonTopics: string[]
    averageRating: number
    reviewCount: number
    commonKeywords: string[]
  } | null
): Promise<{
  improvements: string[]
  suggestions: string[]
  completeness: {
    missing: string[]
    score: number
  }
}> {
  const isThaiText = isThai(review)
  const wordCount = countWords(review, isThaiText)
  const hasRating = rating !== undefined && rating > 0
  const hasContent = review.length > 50
  
  // Thai and English keywords for checking completeness
  const instructorKeywords = {
    en: ['professor', 'instructor', 'teacher', 'lecturer', 'teaches', 'teaching'],
    th: ['อาจารย์', 'ผู้สอน', 'ครู', 'อาจารย์ผู้สอน', 'สอน', 'การสอน']
  }
  
  const difficultyKeywords = {
    en: ['difficulty', 'difficult', 'hard', 'easy', 'challenging', 'simple', 'complex', 'level'],
    th: ['ยาก', 'ง่าย', 'ยากมาก', 'ง่ายมาก', 'ท้าทาย', 'ซับซ้อน', 'ระดับความยาก', 'ระดับ']
  }
  
  const workloadKeywords = {
    en: ['homework', 'assignment', 'project', 'workload', 'work', 'task', 'reading', 'readings'],
    th: ['การบ้าน', 'งาน', 'โปรเจค', 'โปรเจกต์', 'ภาระงาน', 'งานที่ได้รับ', 'งานที่ต้องทำ', 'การอ่าน']
  }
  
  const keywords = isThaiText ? {
    instructor: instructorKeywords.th,
    difficulty: difficultyKeywords.th,
    workload: workloadKeywords.th
  } : {
    instructor: instructorKeywords.en,
    difficulty: difficultyKeywords.en,
    workload: workloadKeywords.en
  }
  
  const missing: string[] = []
  
  // Check for minimum content (adjusted for Thai)
  const minWords = isThaiText ? 30 : 50
  if (wordCount < minWords) {
    missing.push(isThaiText 
      ? "ลองเพิ่มรายละเอียดเกี่ยวกับประสบการณ์ของคุณ"
      : "Consider adding more details about your experience")
  }
  
  if (!hasRating) {
    missing.push(isThaiText 
      ? "อย่าลืมให้คะแนน"
      : "Don't forget to add a rating")
  }
  
  const reviewLower = review.toLowerCase()
  const hasInstructor = keywords.instructor.some(keyword => reviewLower.includes(keyword))
  if (!hasInstructor) {
    missing.push(isThaiText 
      ? "ลองกล่าวถึงสไตล์การสอนของอาจารย์"
      : "Consider mentioning the instructor's teaching style")
  }
  
  const hasDifficulty = keywords.difficulty.some(keyword => reviewLower.includes(keyword))
  if (!hasDifficulty) {
    missing.push(isThaiText 
      ? "กล่าวถึงระดับความยากของรายวิชา"
      : "Mention the course difficulty level")
  }
  
  const hasWorkload = keywords.workload.some(keyword => reviewLower.includes(keyword))
  if (!hasWorkload) {
    missing.push(isThaiText 
      ? "แชร์ข้อมูลเกี่ยวกับภาระงานและการบ้าน"
      : "Share information about workload and assignments")
  }

  const completenessScore = Math.min(100, Math.round(
    (hasRating ? 20 : 0) +
    (hasContent ? 30 : 0) +
    (wordCount >= minWords ? 30 : wordCount * (30 / minWords)) +
    (missing.length === 0 ? 20 : Math.max(0, 20 - missing.length * 5))
  ))

  // Generate improvement suggestions
  const improvements: string[] = []
  const suggestions: string[] = []

  // Dynamic suggestions based on course context
  if (courseContext && courseContext.reviewCount > 0) {
    // Check if user mentions topics that others commonly discuss
    const mentionedTopics = courseContext.commonTopics.filter(topic => {
      const topicKeywords = getTopicKeywords(topic, isThaiText)
      return topicKeywords.some(kw => reviewLower.includes(kw))
    })
    
    const missingTopics = courseContext.commonTopics.filter(topic => !mentionedTopics.includes(topic))
    
    // Suggest topics that others frequently mention but user hasn't
    if (missingTopics.length > 0 && missingTopics.length < courseContext.commonTopics.length) {
      const topicNames = missingTopics.map(t => getTopicName(t, isThaiText)).join(', ')
      suggestions.push(isThaiText
        ? `รีวิวอื่นๆ มักกล่าวถึง: ${topicNames} ลองพิจารณาเพิ่มประเด็นเหล่านี้`
        : `Other reviews often mention: ${topicNames}. Consider adding these aspects.`)
    }
    
    // Rating comparison suggestion
    if (hasRating && courseContext.averageRating > 0) {
      const ratingDiff = rating! - courseContext.averageRating
      if (Math.abs(ratingDiff) > 1) {
        if (ratingDiff > 1) {
          suggestions.push(isThaiText
            ? `คุณให้คะแนนสูงกว่าค่าเฉลี่ย (${courseContext.averageRating.toFixed(1)}) มาก ลองอธิบายว่าอะไรทำให้รายวิชานี้โดดเด่น`
            : `Your rating is significantly higher than average (${courseContext.averageRating.toFixed(1)}). Consider explaining what made this course stand out.`)
        } else {
          suggestions.push(isThaiText
            ? `คุณให้คะแนนต่ำกว่าค่าเฉลี่ย (${courseContext.averageRating.toFixed(1)}) มาก ลองอธิบายรายละเอียดว่าอะไรที่ควรปรับปรุง`
            : `Your rating is significantly lower than average (${courseContext.averageRating.toFixed(1)}). Consider explaining what specifically could be improved.`)
        }
      }
    }

    // Suggest using common keywords if review is generic
    if (courseContext.commonKeywords.length > 0 && wordCount < minWords * 1.5) {
      const userHasCommonKeywords = courseContext.commonKeywords.some(kw => reviewLower.includes(kw))
      if (!userHasCommonKeywords) {
        suggestions.push(isThaiText
          ? `ลองเพิ่มรายละเอียดเฉพาะเจาะจงเกี่ยวกับรายวิชานี้ เพื่อให้รีวิวของคุณมีประโยชน์มากขึ้น`
          : `Consider adding more specific details about this course to make your review more helpful.`)
      }
    }
  }

  // Check for common issues
  const minLength = isThaiText ? 80 : 100
  if (review.length < minLength) {
    improvements.push(isThaiText 
      ? "รีวิวของคุณค่อนข้างสั้น ลองเพิ่มรายละเอียดเฉพาะเจาะจงเกี่ยวกับประสบการณ์ของคุณ"
      : "Your review is quite short. Consider adding more specific details about your experience.")
  }

  // Check sentence count (Thai uses different sentence endings)
  const sentenceEndings = isThaiText ? /[。！？\.!?]/g : /[.!?]+/g
  const sentences = review.split(sentenceEndings).filter(s => s.trim().length > 0)
  if (sentences.length < 3) {
    improvements.push(isThaiText 
      ? "ลองแบ่งรีวิวของคุณเป็นหลายประโยคเพื่อให้อ่านง่ายขึ้น"
      : "Try breaking your review into multiple sentences for better readability.")
  }

  // Check for balance - Thai and English positive/negative words
  const positiveWords = {
    en: ['good', 'great', 'excellent', 'amazing', 'wonderful', 'helpful', 'interesting', 'enjoyed', 'love', 'best', 'awesome', 'fantastic'],
    th: ['ดี', 'ดีมาก', 'เยี่ยม', 'ยอดเยี่ยม', 'น่าสนใจ', 'สนุก', 'ชอบ', 'รัก', 'ดีที่สุด', 'สุดยอด', 'ดีเยี่ยม', 'น่าประทับใจ']
  }
  
  const negativeWords = {
    en: ['bad', 'terrible', 'awful', 'boring', 'difficult', 'hard', 'confusing', 'waste', 'worst', 'hate', 'poor', 'disappointing'],
    th: ['แย่', 'แย่มาก', 'น่าเบื่อ', 'ยาก', 'สับสน', 'เสียเวลา', 'แย่ที่สุด', 'เกลียด', 'ไม่ดี', 'ผิดหวัง', 'ไม่น่าสนใจ']
  }
  
  const posWords = isThaiText ? positiveWords.th : positiveWords.en
  const negWords = isThaiText ? negativeWords.th : negativeWords.en
  
  const hasPositive = posWords.some(word => reviewLower.includes(word))
  const hasNegative = negWords.some(word => reviewLower.includes(word))

  if (hasPositive && hasNegative) {
    suggestions.push(isThaiText 
      ? "รีวิวของคุณมีความสมดุล ลองอธิบายสิ่งที่ทำได้ดีและสิ่งที่ควรปรับปรุง"
      : "Your review has a balanced perspective. Consider explaining what worked well and what could be improved.")
  } else if (hasPositive) {
    suggestions.push(isThaiText 
      ? "รีวิวเชิงบวกที่ดี! ลองเพิ่มตัวอย่างเฉพาะเจาะจงว่าอะไรทำให้รายวิชานี้ดี"
      : "Great positive review! Consider adding specific examples of what made the course great.")
  } else if (hasNegative) {
    suggestions.push(isThaiText 
      ? "หากคุณมีความกังวล ลองแนะนำสิ่งที่สามารถทำให้รายวิชาดีขึ้นได้"
      : "If you had concerns, consider suggesting what could have made the course better.")
  }

  // Structure suggestions
  if (!review.includes('\n') && review.length > (isThaiText ? 150 : 200)) {
    suggestions.push(isThaiText 
      ? "ลองจัดระเบียบรีวิวของคุณเป็นย่อหน้าเพื่อให้อ่านง่ายขึ้น"
      : "Consider organizing your review into paragraphs for better readability.")
  }

  // Specific content suggestions based on rating
  if (rating) {
    if (rating >= 4) {
      suggestions.push(isThaiText 
        ? "เนื่องจากคุณให้คะแนนสูง แชร์แง่มุมเฉพาะที่ทำให้รายวิชานี้โดดเด่น"
        : "Since you rated this highly, share what specific aspects made it stand out.")
    } else if (rating <= 2) {
      suggestions.push(isThaiText 
        ? "สำหรับคะแนนที่ต่ำกว่า จะเป็นประโยชน์หากอธิบายว่าอะไรที่ไม่ได้ผลและสิ่งที่ควรปรับปรุง"
        : "For lower ratings, it's helpful to explain what specifically didn't work and what could be improved.")
    }
  }

  return {
    improvements,
    suggestions,
    completeness: {
      missing,
      score: completenessScore
    }
  }
}
