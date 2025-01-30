import { NextResponse } from 'next/server'
import translate from 'google-translate-api-browser'

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json()

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const result = await translate(text, { to: targetLang })
    
    return NextResponse.json({
      success: true,
      translatedText: result.text
    })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: "Translation failed", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
