import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = cookies()
  
  // Remove the authentication cookie
  cookieStore.delete('cmu-entraid-example-token')
  
  return NextResponse.json({ ok: true })
}
