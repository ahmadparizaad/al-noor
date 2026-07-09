import { getAdminQrCodes } from '@/lib/actions/qr'
import QrCodesClient from './QrCodesClient'

export const dynamic = 'force-dynamic'

export default async function QrCodesPage() {
  const qrCodes = await getAdminQrCodes()

  return <QrCodesClient qrCodes={qrCodes} />
}
