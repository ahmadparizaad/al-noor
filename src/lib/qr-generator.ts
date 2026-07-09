import QRCode from 'qrcode'
import { cloudinary } from '@/lib/cloudinary'

interface GenerateQrInput {
  slug: string
  color: string
}

interface GenerateQrResult {
  qrPngUrl: string
  qrSvgUrl: string
}

function buildTargetUrl(slug: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${appUrl}/r/${slug}`
}

async function uploadToCloudinary(buffer: Buffer, publicId: string, format: 'png' | 'svg'): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(
      `data:image/${format === 'svg' ? 'svg+xml' : 'png'};base64,${buffer.toString('base64')}`,
      {
        folder: 'al-noor/qr-codes',
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        format,
      }
    )
    return result.secure_url
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to upload QR code image: ${message}`)
  }
}

export async function generateQRCode({ slug, color }: GenerateQrInput): Promise<GenerateQrResult> {
  const targetUrl = buildTargetUrl(slug)

  const qrOptions = {
    errorCorrectionLevel: 'H' as const,
    margin: 4,
    width: 1000,
    color: {
      dark: color,
      light: '#FFFFFF',
    },
  }

  const [pngBuffer, svgString] = await Promise.all([
    QRCode.toBuffer(targetUrl, { ...qrOptions, type: 'png' }),
    QRCode.toString(targetUrl, { ...qrOptions, type: 'svg' }),
  ])

  const [qrPngUrl, qrSvgUrl] = await Promise.all([
    uploadToCloudinary(pngBuffer, `${slug}-png`, 'png'),
    uploadToCloudinary(Buffer.from(svgString, 'utf-8'), `${slug}-svg`, 'svg'),
  ])

  return { qrPngUrl, qrSvgUrl }
}
