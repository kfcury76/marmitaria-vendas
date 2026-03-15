import { NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(key: string, limit: number = 5, windowMs: number = 15 * 60 * 1000): { success: boolean } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (rateLimitMap.size > 10000) {
    for (const [k, val] of rateLimitMap) {
      if (now > val.resetTime) rateLimitMap.delete(k)
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true }
  }

  if (record.count >= limit) {
    return { success: false }
  }

  record.count++
  return { success: true }
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: 'Too many requests. Try again later.' },
    { status: 429 }
  )
}
