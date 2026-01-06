import { NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import { Review } from '@/models/review'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Common stop words to filter out (English)
const stopWords = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'from','as','is','was','are','were','been','be','have','has','had','do','does','did',
  'will','would','could','should','may','might','must','can','this','that','these','those',
  'i','you','he','she','it','we','they','me','him','her','us','them',
  'my','your','his','her','its','our','their','mine','yours','hers','ours','theirs',
  'what','which','who','whom','whose','where','when','why','how','all','each','every',
  'both','few','more','most','other','some','such','no','nor','not','only','own','same',
  'so','than','too','very','just','now','then','here','there','up','down','out','off',
  'over','under','again','further','once','course','courses','class','classes','student','students',
  'professor','professors','teacher','teachers','instructor','instructors','lecture','lectures',
  'review','reviews','rating','ratings','grade','grades','homework','assignment','assignments',
  'exam','exams','test','tests','quiz','quizzes','project','projects','midterm','final',
  'semester','year','term','credit','credits','hour','hours','week','weeks','day','days',
  'time','times','much','many','more','most','less','least','really','quite','pretty','rather','also','well',
  'recommend','recommended','recommendation','maybe','perhaps',
  'think','thought','feel','felt','know','knew','see','saw','get','got','give','gave',
  'take','took','make','made','go','went','come','came','say','said','tell','told',
  'ask','asked','try','tried','use','used','work','worked','need','needed','want','wanted',
  'like','liked','love','loved','hate','hated','enjoy','enjoyed','prefer','preferred',
  // filler/adverbs not helpful for the cloud
  'really','very','quite','pretty','rather','kinda','sorta','maybe','perhaps','somewhat','actually','literally',
  'thing','things','stuff','lot','lots','bit','bunch'
])

const englishNegations = new Set([
  'not','no',"don't",'dont',"didn't",'didnt',"isn't",'isnt',"wasn't",'wasnt',"aren't",'arent',"can't",'cant',"couldn't",'couldnt',"won't",'wont','never'
])

const englishNegationFillers = new Set([
  'so','very','really','quite','pretty','rather','kinda','sorta','somewhat','bit','little','at','all','that','too','super','extremely','fairly'
])

// Thai stop words and filler particles
const thaiStopWords = new Set([
  'ที่','และ','หรือ','แต่','ใน','บน','กับ','จาก','เป็น','คือ','จะ','ได้','ให้','ไป','มา',
  'นี้','นั้น','เขา','เธอ','เรา','พวก','ของ','ก็','แล้ว','ยัง','อีก','มาก','น้อย','ดี','ไม่',
  'วิชา','รายวิชา','อาจารย์','ผู้สอน','นักศึกษา','นักเรียน','การเรียน','การสอน','คะแนน','เกรด',
  'การบ้าน','งาน','สอบ','ข้อสอบ','โปรเจค','รายงาน','ภาคเรียน','เทอม','หน่วยกิต','ชั่วโมง',
  'สัปดาห์','วัน','เวลา','ดี','ไม่ดี','ดีมาก','แย่','น่าสนใจ','น่าเบื่อ','สนุก','แนะนำ',
  'คิดว่า','รู้สึก','รู้','เห็น','ได้','ให้','เอา','ทำ','ไป','มา','พูด','บอก','ถาม','ลอง','ใช้','ทำงาน','ต้องการ','อยาก','ชอบ','รัก','เกลียด',
  // fillers/particles commonly not useful in clouds
  'ค่ะ','คะ','ครับ','นะ','เลย','หน่อย','แบบ','ประมาณ','จริงๆ','มากๆ','โคตร','อาจ','ถ้า','หรือว่า','ก็ได้','ไม่มี','นิด','หน่อย','กลาง','ภาค','นอล'
])

function isThai(text: string): boolean {
  return /[\u0E00-\u0E7F]/.test(text)
}

function segmentThai(text: string): string[] {
  // Use Intl.Segmenter when available to extract Thai words
  if (typeof (Intl as any).Segmenter === 'function') {
    const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' })
    const rawTokens = Array.from(segmenter.segment(text))
      .map((s: any) => (typeof s === 'string' ? s : s.segment))
      .map((s: string) => s.trim())
      .filter(Boolean)

    // Merge simple negation pairs เช่น "ไม่" + "ยาก" -> "ไม่ยาก"
    const merged: string[] = []
    for (let i = 0; i < rawTokens.length; i++) {
      const current = rawTokens[i]
      const next = rawTokens[i + 1]
      if (current === 'ไม่' && next) {
        merged.push(current + next)
        i += 1
        continue
      }
      merged.push(current)
    }
    return merged
  }
  // Fallback: split into characters (Thai has no spaces, but this prevents whole-sentence tokens)
  return text.split('').filter(Boolean)
}

function extractWords(text: string): string[] {
  // Remove URLs, emails, and special characters
  text = text
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/[^\w\s\u0E00-\u0E7F]/g, ' ')
    .toLowerCase()
  
  // Thai text often lacks spaces; use segmenter to avoid whole-sentence tokens
  if (isThai(text)) {
    return segmentThai(text).filter(word => word.length > 1) // allow short Thai syllables
  }

  // Non-Thai: split by whitespace
  const raw = text.split(/\s+/).filter(word => word.length > 1)

  // Merge English negations: "not so hard" -> "not hard"
  const merged: string[] = []
  for (let i = 0; i < raw.length; i++) {
    const current = raw[i]
    const next = raw[i + 1]
    if (englishNegations.has(current) && next) {
      // Skip filler intensifiers after negation (e.g., "not so hard" -> "not hard")
      let lookaheadIndex = i + 1
      let target = next
      while (lookaheadIndex + 1 < raw.length && englishNegationFillers.has(target)) {
        target = raw[lookaheadIndex + 1]
        lookaheadIndex += 1
      }
      merged.push(`${current} ${target}`)
      i = lookaheadIndex
      continue
    }
    merged.push(current)
  }

  // Filter very short tokens and stop words
  return merged.filter(word => word.length > 2 && !stopWords.has(word))
}

function countWords(reviews: any[]): Map<string, number> {
  const wordCount = new Map<string, number>()
  const hasThai = reviews.some(r => isThai(r.review || ''))
  
  reviews.forEach(review => {
    const text = review.review || ''
    if (!text.trim()) return
    
    const words = extractWords(text)
    const isThaiText = isThai(text)
    const relevantStopWords = isThaiText ? thaiStopWords : stopWords
    
    words.forEach(word => {
      // Skip stop words and very short words
      if (word.length < 3 || relevantStopWords.has(word)) return
      
      // Skip numbers
      if (/^\d+$/.test(word)) return
      
      // Keep negation phrase as-is for clarity (e.g., "not hard")
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })
  })
  
  return wordCount
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

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
      .select('review')
      .lean()
      .exec()

    if (reviews.length === 0) {
      return NextResponse.json({
        success: true,
        words: []
      })
    }

    // Count words
    const wordCount = countWords(reviews)
    
    // Convert to array and sort by frequency
    const words = Array.from(wordCount.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50) // Top 50 words

    return NextResponse.json({
      success: true,
      words
    })
  } catch (error) {
    console.error('Word cloud error:', error)
    return NextResponse.json(
      { error: "Failed to generate word cloud", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
