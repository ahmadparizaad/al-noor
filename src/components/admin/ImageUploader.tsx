'use client'

import { useRef, useState, useCallback } from 'react'
import { useImageUpload, type UploadedImage } from '@/hooks/useImageUpload'

interface ImageUploaderProps {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxImages?: number
}

const T = {
  gold:        '#9E7F4A',
  goldDark:    '#7A5C2E',
  goldPale:    '#EDD9B8',
  deep:        '#1A1410',
  muted:       '#8C7B65',
  light:       '#B8A99A',
  border:      'rgba(158,127,74,0.18)',
  borderGold:  'rgba(158,127,74,0.40)',
  red:         '#C0392B',
  card:        '#FFFFFF',
  parchment:   '#F0EBE2',
  shadowSm:    '0 1px 4px rgba(26,20,16,0.06)',
}

const FONT = "'Inter', system-ui, sans-serif"
const ACCEPTED = 'image/jpeg,image/png,image/webp'
const MAX_SIZE_MB = 10

export function ImageUploader({ images, onChange, maxImages = 8 }: ImageUploaderProps) {
  const { upload, deleteImage, uploading, error } = useImageUpload()
  const [dragOver, setDragOver]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(async (files: FileList) => {
    const remaining = maxImages - images.length
    if (remaining <= 0) return
    const toUpload = Array.from(files).slice(0, remaining)

    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > MAX_SIZE_MB * 1024 * 1024) continue

      const result = await upload(file)
      if (result) {
        onChange([...images, result])
      }
    }
  }, [images, maxImages, upload, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files)
  }, [processFiles])

  const handleDelete = useCallback(async (img: UploadedImage) => {
    setDeletingId(img.publicId)
    await deleteImage(img.publicId)
    onChange(images.filter(i => i.publicId !== img.publicId))
    setDeletingId(null)
  }, [images, deleteImage, onChange])

  const handleMoveLeft = (idx: number) => {
    if (idx === 0) return
    const next = [...images]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    onChange(next)
  }

  const handleMoveRight = (idx: number) => {
    if (idx === images.length - 1) return
    const next = [...images]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    onChange(next)
  }

  const canAdd = images.length < maxImages

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Drop zone */}
      {canAdd && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? T.gold : T.border}`,
            borderRadius: '4px',
            padding: '24px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: dragOver ? T.goldPale : T.parchment,
            transition: 'all 0.15s',
            marginBottom: images.length > 0 ? '14px' : 0,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files) { processFiles(e.target.files); e.target.value = '' } }}
            disabled={uploading}
          />
          {uploading ? (
            <span style={{ fontSize: '13px', color: T.gold }}>Uploading…</span>
          ) : (
            <>
              <div style={{ fontSize: '22px', marginBottom: '8px', color: T.light }}>📷</div>
              <div style={{ fontSize: '13px', color: T.muted, lineHeight: 1.5 }}>
                Drop images here or <span style={{ color: T.gold, fontWeight: 600 }}>click to browse</span>
              </div>
              <div style={{ fontSize: '11px', color: T.light, marginTop: '4px' }}>
                JPG, PNG, WebP · Max {MAX_SIZE_MB}MB each · Up to {maxImages} images
              </div>
            </>
          )}
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {images.map((img, idx) => (
            <div
              key={img.publicId}
              style={{
                position: 'relative',
                border: `1px solid ${idx === 0 ? T.gold : T.border}`,
                borderRadius: '3px',
                overflow: 'hidden',
                background: T.card,
                boxShadow: T.shadowSm,
              }}
            >
              {/* Primary badge */}
              {idx === 0 && (
                <div style={{
                  position: 'absolute', top: 4, left: 4, zIndex: 2,
                  background: T.gold, color: '#fff', fontSize: '9px',
                  padding: '2px 5px', borderRadius: '2px', fontWeight: 700, letterSpacing: '0.05em'
                }}>
                  PRIMARY
                </div>
              )}

              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Product image ${idx + 1}`}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
              />

              {/* Controls overlay */}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(26,20,16,0.55)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '6px', opacity: 0, transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleMoveLeft(idx)}
                    disabled={idx === 0}
                    title="Move left"
                    style={{ padding: '3px 8px', fontSize: '12px', background: idx === 0 ? 'rgba(255,255,255,0.2)' : T.card, color: T.deep, border: 'none', borderRadius: '2px', cursor: idx === 0 ? 'default' : 'pointer' }}
                  >←</button>
                  <button
                    onClick={() => handleMoveRight(idx)}
                    disabled={idx === images.length - 1}
                    title="Move right"
                    style={{ padding: '3px 8px', fontSize: '12px', background: idx === images.length - 1 ? 'rgba(255,255,255,0.2)' : T.card, color: T.deep, border: 'none', borderRadius: '2px', cursor: idx === images.length - 1 ? 'default' : 'pointer' }}
                  >→</button>
                </div>
                <button
                  onClick={() => handleDelete(img)}
                  disabled={deletingId === img.publicId}
                  style={{ padding: '3px 10px', fontSize: '11px', background: T.red, color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', fontWeight: 600 }}
                >
                  {deletingId === img.publicId ? '…' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: T.red }}>{error}</div>
      )}

      {images.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: T.muted }}>
          First image is used as the primary product photo. Hover to reorder or remove.
          {canAdd && ` ${maxImages - images.length} slot${maxImages - images.length !== 1 ? 's' : ''} remaining.`}
        </div>
      )}
    </div>
  )
}
