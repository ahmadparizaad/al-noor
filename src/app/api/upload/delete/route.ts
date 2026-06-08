import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '@/lib/cloudinary'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { publicId } = await req.json() as { publicId: string }
  if (!publicId) return NextResponse.json({ error: 'publicId required' }, { status: 400 })

  const result = await cloudinary.uploader.destroy(publicId)
  return NextResponse.json({ result })
}
