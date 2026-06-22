import { NextRequest, NextResponse } from 'next/server'
import { checkPincodeServiceability } from '@/lib/delhivery'

export async function GET(req: NextRequest) {
  const pincode = req.nextUrl.searchParams.get('pincode')

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { error: 'Invalid pincode. Must be a 6-digit number.' },
      { status: 400 }
    )
  }

  try {
    const result = await checkPincodeServiceability(pincode)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in shipping serviceability route:', error)
    return NextResponse.json(
      { error: 'Failed to verify shipping serviceability' },
      { status: 500 }
    )
  }
}
