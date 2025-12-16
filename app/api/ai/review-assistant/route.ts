import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

interface ReviewAssistantRequest {
  currentReview: string
  courseName?: string
  courseId?: string
  rating?: number
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

    // AI-powered review suggestions
    // In production, replace this with actual AI API calls (OpenAI, Anthropic, etc.)
    const suggestions = await generateReviewSuggestions(currentReview, courseName, courseId, rating)

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
  rating?: number
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
    en: ['professor', 'instructor', 'teacher', 'lecturer'],
    th: ['อาจารย์', 'ผู้สอน', 'ครู', 'อาจารย์ผู้สอน']
  }
  
  const difficultyKeywords = {
    en: ['difficulty', 'difficult', 'hard', 'easy', 'challenging', 'simple', 'complex'],
    th: ['ยาก', 'ง่าย', 'ยากมาก', 'ง่ายมาก', 'ท้าทาย', 'ซับซ้อน', 'ระดับความยาก']
  }
  
  const workloadKeywords = {
    en: ['homework', 'assignment', 'project', 'workload', 'work', 'task'],
    th: ['การบ้าน', 'งาน', 'โปรเจค', 'โปรเจกต์', 'ภาระงาน', 'งานที่ได้รับ', 'งานที่ต้องทำ']
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
