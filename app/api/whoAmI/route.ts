import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('cmu-entraid-example-token');

    if (!token) {
      return NextResponse.json({ ok: false, message: 'No token found' });
    }

    // Verify the token
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET as string);
    
    return NextResponse.json({ 
      ok: true,
      user: decoded 
    });
  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      message: 'Invalid token' 
    });
  }
} 