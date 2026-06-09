import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '@/lib/cloudinary'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { paramsToSign } = await req.json() as { paramsToSign: Record<string, string> }
  const ALLOWED_KEYS = new Set(['folder', 'timestamp'])
  const safe: Record<string, string> = Object.fromEntries(
    Object.entries(paramsToSign).filter(([k]) => ALLOWED_KEYS.has(k))
  )
  safe.folder = 'al-noor/products'
  const signature = cloudinary.utils.api_sign_request(safe, process.env.CLOUDINARY_API_SECRET!)

  return NextResponse.json({
    signature,
    apiKey:    process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  })
}
