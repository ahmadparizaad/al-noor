import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
})

export { cloudinary }

export function cloudinaryUrl(publicId: string, opts?: { width?: number; quality?: number }): string {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality:      opts?.quality ?? 'auto',
    width:        opts?.width,
    crop:         opts?.width ? 'fill' : undefined,
  })
}
