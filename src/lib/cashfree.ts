import crypto from 'crypto'

const BASE_URL =
  process.env.CASHFREE_ENV === 'PRODUCTION'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'

const API_VERSION = '2023-08-01'

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId     = process.env.CASHFREE_CLIENT_ID
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET must be set.')
  }
  return { clientId, clientSecret }
}

export interface InitiatePaymentParams {
  orderId: string
  amount: number // in INR (decimal, e.g. 1500.00)
  customerId: string
  customerEmail: string
  customerPhone: string
  customerName?: string
  returnUrl: string
  notifyUrl: string
}

export async function initiatePayment(params: InitiatePaymentParams) {
  const { clientId, clientSecret } = getCredentials()

  const payload = {
    order_id: params.orderId,
    order_amount: Number(params.amount.toFixed(2)),
    order_currency: 'INR',
    customer_details: {
      customer_id: params.customerId,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      customer_name: params.customerName || undefined,
    },
    order_meta: {
      return_url: params.returnUrl,
      notify_url: params.notifyUrl,
    },
  }

  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
      'x-api-version': API_VERSION,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Cashfree order creation failed:', errorText)
    return { success: false, error: errorText }
  }

  const data = await response.json()
  return { success: true, data }
}

export function verifyWebhookSignature(
  rawBody: string,
  timestamp: string,
  receivedSignature: string
): boolean {
  const { clientSecret } = getCredentials()
  const expectedSignature = crypto
    .createHmac('sha256', clientSecret)
    .update(timestamp + rawBody)
    .digest('base64')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    )
  } catch {
    return false
  }
}

export async function checkPaymentStatus(orderId: string) {
  const { clientId, clientSecret } = getCredentials()

  const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
    headers: {
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
      'x-api-version': API_VERSION,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Cashfree fetch order failed:', errorText)
    return { success: false, error: errorText }
  }

  const data = await response.json()
  return { success: true, data }
}
