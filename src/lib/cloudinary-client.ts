const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

export function toCloudinaryUrl(publicId: string, opts?: { width?: number }): string {
  if (!publicId) return ''
  if (publicId.startsWith('http')) return publicId
  if (!CLOUD_NAME) {
    console.warn('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set')
    return publicId
  }
  const transforms = ['f_auto', 'q_auto', ...(opts?.width ? [`w_${opts.width}`] : [])].join(',')
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`
}
