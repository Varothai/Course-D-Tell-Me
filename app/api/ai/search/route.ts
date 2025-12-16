import { NextResponse } from 'next/server'
import Papa from 'papaparse'

interface Course {
  courseno: string
  title_short_en: string
  [key: string]: any
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      )
    }

    // Fetch courses data
    const courses = await fetchCourses()
    
    // Perform semantic search
    const results = await semanticSearch(query, courses)

    return NextResponse.json({
      success: true,
      results: results.slice(0, 10) // Return top 10 results
    })
  } catch (error) {
    console.error('AI search error:', error)
    return NextResponse.json(
      { error: "Search failed", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function fetchCourses(): Promise<Course[]> {
  try {
    // Fetch courses CSV from the public directory
    // Note: In production, you might want to cache this or fetch from a database
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/courses/courses.csv`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      // Fallback: return empty array if CSV fetch fails
      console.warn('Failed to fetch courses CSV, returning empty results')
      return []
    }
    
    const csvText = await response.text()
    const parsedData = Papa.parse(csvText, {
      header: true,
      dynamicTyping: false,
    })
    return parsedData.data as Course[]
  } catch (error) {
    console.error('Error fetching courses:', error)
    return []
  }
}

async function semanticSearch(query: string, courses: Course[]): Promise<Array<{ course: Course; score: number; reason: string }>> {
  const normalizedQuery = query.toLowerCase().trim()
  const queryWords = normalizedQuery.split(/\s+/)
  
  const results: Array<{ course: Course; score: number; reason: string }> = []

  courses.forEach(course => {
    let score = 0
    const reasons: string[] = []

    const courseNo = (course.courseno || '').toLowerCase()
    const courseName = (course.title_short_en || '').toLowerCase()

    // Exact course ID match
    if (courseNo === normalizedQuery) {
      score += 100
      reasons.push('Exact course ID match')
    } else if (courseNo.includes(normalizedQuery) || normalizedQuery.includes(courseNo)) {
      score += 50
      reasons.push('Partial course ID match')
    }

    // Course name matching
    queryWords.forEach(word => {
      if (courseName.includes(word)) {
        score += 20
        if (!reasons.includes('Course name contains keywords')) {
          reasons.push('Course name contains keywords')
        }
      }
    })

    // Semantic matching - check for related terms
    const semanticMatches: Record<string, string[]> = {
      'programming': ['code', 'program', 'software', 'development', 'computer'],
      'math': ['mathematics', 'calculus', 'algebra', 'statistics'],
      'science': ['physics', 'chemistry', 'biology', 'laboratory'],
      'business': ['management', 'marketing', 'finance', 'accounting'],
      'language': ['english', 'thai', 'communication', 'writing'],
      'art': ['design', 'creative', 'visual', 'drawing'],
      'music': ['sound', 'audio', 'composition', 'performance']
    }

    Object.entries(semanticMatches).forEach(([key, terms]) => {
      if (normalizedQuery.includes(key) || queryWords.some(w => terms.includes(w))) {
        if (courseName.includes(key) || terms.some(term => courseName.includes(term))) {
          score += 15
          if (!reasons.includes('Semantic match')) {
            reasons.push('Semantic match')
          }
        }
      }
    })

    if (score > 0) {
      results.push({
        course,
        score,
        reason: reasons.join(', ')
      })
    }
  })

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return results
}
