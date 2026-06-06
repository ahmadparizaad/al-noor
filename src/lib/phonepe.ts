import crypto from 'crypto'

const BASE_URL =
  process.env.PHONEPE_ENV === 'PRODUCTION'
    ? 'https://api.phonepe.com/apis/hermes'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox'

const CLIENT_VERSION = Number(process.env.PHONEPE_CLIENT_VERSION ?? 1)

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId     = process.env.PHONEPE_CLIENT_ID
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET must be set.')
  }
  return { clientId, clientSecret }
}

function generateChecksum(payload: string, endpoint: string, clientSecret: string): string {
  const data = payload + endpoint + clientSecret
  return crypto.createHash('sha256').update(data).digest('hex') + '###' + CLIENT_VERSION
}

export interface InitiatePaymentParams {
  transactionId: string
  amountPaise: number   // amount in paise (INR × 100)
  userId: string
  redirectUrl: string
  callbackUrl: string
  mobileNumber?: string
}

export async function initiatePayment(params: InitiatePaymentParams) {
  const { clientId, clientSecret } = getCredentials()

  const payload = {
    merchantId: clientId,
    merchantTransactionId: params.transactionId,
    merchantUserId: params.userId,
    amount: params.amountPaise,
    redirectUrl: params.redirectUrl,
    redirectMode: 'REDIRECT',
    callbackUrl: params.callbackUrl,
    mobileNumber: params.mobileNumber,
    paymentInstrument: { type: 'PAY_PAGE' },
  }

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64')
  const endpoint = '/pg/v1/pay'
  const checksum = generateChecksum(base64Payload, endpoint, clientSecret)

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
    },
    body: JSON.stringify({ request: base64Payload }),
  })

  return response.json()
}

export function verifyCallbackChecksum(
  responseBody: string,
  receivedChecksum: string
): boolean {
  const { clientSecret } = getCredentials()
  const endpoint = '/pg/v1/pay'
  const expected = generateChecksum(responseBody, endpoint, clientSecret)
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receivedChecksum))
  } catch {
    return false  // buffers differ in length — checksums don't match
  }
}

export async function checkPaymentStatus(transactionId: string) {
  const { clientId, clientSecret } = getCredentials()
  const endpoint = `/pg/v1/status/${clientId}/${transactionId}`
  const checksum = generateChecksum('', endpoint, clientSecret)

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'X-MERCHANT-ID': clientId,
    },
  })

  return response.json()
}
