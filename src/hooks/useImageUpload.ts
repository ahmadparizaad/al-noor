'use client'

import { useState, useCallback } from 'react'

export interface UploadedImage {
  publicId: string
  url: string
  width: number
  height: number
}

interface SignResponse {
  signature: string
  apiKey: string
  cloudName: string
}

async function getSignature(paramsToSign: Record<string, string>): Promise<SignResponse> {
  const res = await fetch('/api/upload/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paramsToSign }),
  })
  if (!res.ok) throw new Error('Failed to get upload signature')
  return res.json() as Promise<SignResponse>
}

export function useImageUpload(folder = 'al-noor/products') {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const upload = useCallback(async (file: File): Promise<UploadedImage | null> => {
    setError(null)
    setUploading(true)
    try {
      const timestamp = String(Math.round(Date.now() / 1000))
      const paramsToSign: Record<string, string> = { folder, timestamp }
      const { signature, apiKey, cloudName } = await getSignature(paramsToSign)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      formData.append('timestamp', timestamp)
      formData.append('api_key', apiKey)
      formData.append('signature', signature)

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json() as { public_id: string; secure_url: string; width: number; height: number }
      return { publicId: data.public_id, url: data.secure_url, width: data.width, height: data.height }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }, [folder])

  const deleteImage = useCallback(async (publicId: string): Promise<boolean> => {
    const res = await fetch('/api/upload/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    })
    return res.ok
  }, [])

  return { upload, deleteImage, uploading, error }
}
