import { formatPrice } from './products-data'

const token = process.env.WHATSAPP_ACCESS_TOKEN
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

/**
 * Clean phone number to E.164 without leading '+' (e.g. +91 99999 99999 -> 919999999999)
 */
function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Default to India (+91) if it's a standard 10-digit number starting with 6-9
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return '91' + digits
  }
  return digits
}

interface MetaApiResponse {
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

/**
 * Send template message using Meta WhatsApp Cloud API
 */
async function sendWhatsAppTemplate({
  to,
  templateName,
  parameters,
}: {
  to: string
  templateName: string
  parameters: string[]
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const cleanPhone = cleanPhoneNumber(to)

  if (!token || !phoneId) {
    console.log('=== [DEVELOPMENT WHATSAPP LOG] ===')
    console.log(`To: ${to} (Cleaned: ${cleanPhone})`)
    console.log(`Template: ${templateName}`)
    console.log(`Parameters:`, parameters)
    console.log('=================================')
    return { success: true, messageId: 'dev-mode-simulated' }
  }

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: 'en_US',
      },
      components: [
        {
          type: 'body',
          parameters: parameters.map((param) => ({
            type: 'text',
            text: param,
          })),
        },
      ],
    },
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[whatsapp] Meta API error:', data)
      return { success: false, error: data?.error?.message || 'Meta API request failed' }
    }

    const typedData = data as MetaApiResponse
    return { success: true, messageId: typedData.messages?.[0]?.id }
  } catch (err: any) {
    console.error('[whatsapp] Exception sending WhatsApp:', err)
    return { success: false, error: err.message || String(err) }
  }
}

/**
 * Sends OTP to customer
 */
export async function sendWhatsAppOtp(
  phone: string,
  otp: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Assumes a template named 'auth_otp' is created in Meta Developer console
  // Parameter 1: 6-digit OTP code
  return sendWhatsAppTemplate({
    to: phone,
    templateName: 'auth_otp',
    parameters: [otp],
  })
}

/**
 * Sends Order Confirmation details
 */
export async function sendWhatsAppOrderConfirmation(
  phone: string,
  orderDetails: {
    id: string
    totalInr: number
    shippingName: string
    itemsSummary: string
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Assumes a template named 'order_confirmation' is created in Meta Developer console
  // Parameter 1: Customer Name
  // Parameter 2: Order ID
  // Parameter 3: Total Price (formatted in INR)
  // Parameter 4: Items summary
  const totalStr = formatPrice(orderDetails.totalInr)
  return sendWhatsAppTemplate({
    to: phone,
    templateName: 'order_confirmation',
    parameters: [
      orderDetails.shippingName,
      orderDetails.id,
      totalStr,
      orderDetails.itemsSummary,
    ],
  })
}

/**
 * Sends Order Status updates (Processing, Shipped, Delivered, Cancelled)
 */
export async function sendWhatsAppOrderStatusUpdate(
  phone: string,
  orderDetails: {
    id: string
    status: string
    trackingNumber?: string | null
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Assumes a template named 'order_status_update' is created in Meta Developer console
  // Parameter 1: Order ID
  // Parameter 2: New Status
  // Parameter 3: Tracking Information or additional note
  const statusUpper = orderDetails.status.toUpperCase()
  let trackingNote = 'You can track this order in your Al Noor profile dashboard.'

  if (orderDetails.status === 'shipped' && orderDetails.trackingNumber) {
    trackingNote = `Delhivery Waybill: ${orderDetails.trackingNumber}. Track at: https://www.delhivery.com/track/share?waybill=${orderDetails.trackingNumber}`
  } else if (orderDetails.status === 'cancelled') {
    // COD-only checkout: nothing is collected before delivery, so cancellation
    // never involves a refund. Revisit this note if a prepaid/return flow ships later.
    trackingNote = 'Your order has been cancelled. No payment was collected for this order.'
  }

  return sendWhatsAppTemplate({
    to: phone,
    templateName: 'order_status_update',
    parameters: [orderDetails.id, statusUpper, trackingNote],
  })
}
