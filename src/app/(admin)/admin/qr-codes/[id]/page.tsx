import { notFound } from 'next/navigation'
import { getAdminQrCode, getQrAnalytics } from '@/lib/actions/qr'
import QrDetailClient from './QrDetailClient'

export const dynamic = 'force-dynamic'

export default async function QrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const qrCode = await getAdminQrCode(id)

  if (!qrCode) notFound()

  const analytics = await getQrAnalytics(id)

  return <QrDetailClient qrCode={qrCode} analytics={analytics} />
}
