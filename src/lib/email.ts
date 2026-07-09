import { Resend } from 'resend'

// Initialize Resend. Falls back to console logging in development if key is missing.
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

if (!resend) {
  console.warn('[email] RESEND_API_KEY is not set. Emails will be logged to console instead of sent.')
}

interface OrderItem {
  productName: string
  quantity: number
  priceInr: number
}

interface OrderDetails {
  id: string
  totalInr: number
  paymentStatus: string
  shippingAddressObj: {
    fullName: string
    phone: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
  items: OrderItem[]
}

const BRAND_GOLD = '#9E7F4A'
const BRAND_IVORY = '#FAF7F2'
const BRAND_DEEP = '#1A1410'
const BRAND_MID = '#5C4F3A'
const BRAND_MUTED = '#8C7B65'

/**
 * Format helper for Indian Rupee price formatting
 */
function formatPrice(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Common HTML wrapper layout matching the luxury storefront design system
 */
function getHtmlWrapper(contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,700&family=Inter:wght@400;500;600&family=Raleway:wght@500;600&display=swap');
          
          body {
            background-color: ${BRAND_IVORY};
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: ${BRAND_DEEP};
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border: 1px solid rgba(158, 127, 74, 0.18);
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(26,20,16,0.06);
          }
          .header {
            padding: 40px 20px 20px 20px;
            text-align: center;
            background-color: #ffffff;
            border-bottom: 1px solid rgba(158, 127, 74, 0.1);
          }
          .logo-arabic {
            font-family: 'Amiri', serif;
            font-size: 28px;
            color: ${BRAND_GOLD};
            margin-bottom: 4px;
            letter-spacing: 2px;
          }
          .logo-english {
            font-family: 'Raleway', sans-serif;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 4px;
            color: ${BRAND_GOLD};
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
          }
          .footer {
            padding: 30px 20px;
            text-align: center;
            background-color: ${BRAND_IVORY};
            border-top: 1px solid rgba(158, 127, 74, 0.1);
            font-family: 'Raleway', sans-serif;
            font-size: 11px;
            color: ${BRAND_MUTED};
            letter-spacing: 1px;
          }
          .button {
            display: inline-block;
            background-color: ${BRAND_GOLD};
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            font-family: 'Raleway', sans-serif;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            border-radius: 2px;
            margin: 25px 0;
            transition: background-color 0.2s ease;
          }
          .button:hover {
            background-color: #7A5C2E;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-arabic">النور</div>
            <div class="logo-english">Al Noor</div>
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Al Noor Luxury. All rights reserved.<br>
            This is an automated transactional message.
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Sends the sign-up verification email
 */
export async function sendVerificationEmail({
  email,
  name,
  token,
}: {
  email: string
  name: string
  token: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const verifyUrl = `${appUrl}/verify-email?token=${token}`

  const greeting = name ? `Dear ${name},` : 'Hello,'
  const contentHtml = `
    <h1 style="font-family: 'Bodoni Moda', serif; font-style: italic; font-weight: 700; font-size: 28px; margin-top: 0; color: ${BRAND_DEEP};">
      Welcome to Al Noor
    </h1>
    <p style="font-size: 15px; color: ${BRAND_MID}; margin-bottom: 20px;">
      ${greeting}
    </p>
    <p style="font-size: 15px; color: ${BRAND_MID};">
      Thank you for creating an account with Al Noor. To activate your account and gain access to your luxury storefront profile, please verify your email address.
    </p>
    <div style="text-align: center;">
      <a href="${verifyUrl}" class="button" target="_blank">Verify Email Address</a>
    </div>
    <p style="font-size: 13px; color: ${BRAND_MUTED}; margin-top: 20px;">
      If you did not create this account, please ignore this email. This link will expire in 24 hours.
    </p>
    <hr style="border: 0; border-top: 1px solid rgba(158, 127, 74, 0.1); margin: 25px 0;">
    <p style="font-size: 11px; color: ${BRAND_MUTED}; word-break: break-all;">
      Or copy and paste this URL into your browser:<br>
      <a href="${verifyUrl}" style="color: ${BRAND_GOLD}; text-decoration: underline;">${verifyUrl}</a>
    </p>
  `

  const html = getHtmlWrapper(contentHtml)

  if (!resend) {
    console.log('=== [DEVELOPMENT EMAIL LOG] ===')
    console.log(`To: ${email}`)
    console.log('Subject: Verify your Al Noor Account')
    console.log(`Link: ${verifyUrl}`)
    console.log('===============================')
    return { success: true, id: 'dev-mode' }
  }

  try {
    const response = await resend.emails.send({
      from: 'Al Noor Luxury <noreply@al-noor.co>',
      to: email,
      subject: 'Verify your Al Noor Account',
      html,
    })

    if (response.error) {
      console.error('[email] Resend error:', response.error)
      return { success: false, error: response.error.message }
    }

    return { success: true, id: response.data?.id }
  } catch (err) {
    console.error('[email] Exception sending verification email:', err)
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
}

/**
 * Sends order confirmation email
 */
export async function sendOrderConfirmationEmail({
  email,
  orderDetails,
}: {
  email: string
  orderDetails: OrderDetails
}): Promise<{ success: boolean; id?: string; error?: string }> {
  
  const itemsHtml = orderDetails.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(158, 127, 74, 0.1); font-size: 14px; color: ${BRAND_DEEP}; font-weight: 500;">
        ${item.productName}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(158, 127, 74, 0.1); font-size: 14px; color: ${BRAND_MID}; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(158, 127, 74, 0.1); font-size: 14px; color: ${BRAND_DEEP}; text-align: right; font-weight: 500;">
        ${formatPrice(Number(item.priceInr) * item.quantity)}
      </td>
    </tr>
  `
    )
    .join('')

  const addr = orderDetails.shippingAddressObj
  const addressHtml = `
    <div style="font-size: 13px; color: ${BRAND_MID}; background-color: ${BRAND_IVORY}; padding: 15px; border-radius: 2px; border: 1px solid rgba(158, 127, 74, 0.1); line-height: 1.5; margin-top: 10px;">
      <strong>${addr.fullName}</strong><br>
      ${addr.line1}<br>
      ${addr.line2 ? addr.line2 + '<br>' : ''}
      ${addr.city}, ${addr.state} — ${addr.pincode}<br>
      Phone: ${addr.phone}
    </div>
  `

  const paymentMethodLabel = (orderDetails.paymentStatus === 'cod_pending' || orderDetails.paymentStatus === 'cod_collected')
    ? 'Cash on Delivery'
    : 'Prepaid (Online Payment)'

  const contentHtml = `
    <h1 style="font-family: 'Bodoni Moda', serif; font-style: italic; font-weight: 700; font-size: 28px; margin-top: 0; color: ${BRAND_DEEP};">
      Thank You for Your Order
    </h1>
    <p style="font-size: 15px; color: ${BRAND_MID};">
      Your order has been confirmed. We are preparing it with the utmost care. Below is your summary.
    </p>

    <div style="margin: 25px 0; font-size: 13px; color: ${BRAND_MUTED};">
      <span style="font-weight: 600; color: ${BRAND_DEEP}; text-transform: uppercase; font-family: 'Raleway', sans-serif;">Order ID:</span> 
      <code style="font-family: monospace; font-size: 13px; color: ${BRAND_DEEP};">${orderDetails.id}</code><br>
      <span style="font-weight: 600; color: ${BRAND_DEEP}; text-transform: uppercase; font-family: 'Raleway', sans-serif;">Payment Method:</span> 
      ${paymentMethodLabel}
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="border-bottom: 2px solid ${BRAND_GOLD};">
          <th style="padding: 8px 0; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_MID}; font-family: 'Raleway', sans-serif;">Item</th>
          <th style="padding: 8px 0; text-align: center; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_MID}; font-family: 'Raleway', sans-serif; width: 60px;">Qty</th>
          <th style="padding: 8px 0; text-align: right; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_MID}; font-family: 'Raleway', sans-serif; width: 100px;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr>
          <td colspan="2" style="padding: 16px 0 8px 0; font-size: 14px; font-weight: 600; text-align: right; color: ${BRAND_MID}; font-family: 'Raleway', sans-serif;">Total:</td>
          <td style="padding: 16px 0 8px 0; font-size: 16px; font-weight: 700; text-align: right; color: ${BRAND_GOLD};">
            ${formatPrice(Number(orderDetails.totalInr))}
          </td>
        </tr>
      </tbody>
    </table>

    <h2 style="font-family: 'Raleway', sans-serif; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 35px; margin-bottom: 10px; color: ${BRAND_DEEP};">
      Shipping Destination
    </h2>
    ${addressHtml}

    <p style="font-size: 13px; color: ${BRAND_MUTED}; margin-top: 30px; line-height: 1.5; border-left: 2px solid ${BRAND_GOLD}; padding-left: 15px;">
      You can track this order directly inside your account profile dashboard. A shipping notification email with tracking information will follow once your item is handed over to Delhivery logistics.
    </p>
  `

  const html = getHtmlWrapper(contentHtml)

  if (!resend) {
    console.log('=== [DEVELOPMENT EMAIL LOG] ===')
    console.log(`To: ${email}`)
    console.log(`Subject: Your Al Noor Order Confirmation (${orderDetails.id})`)
    console.log(`Total: ${formatPrice(Number(orderDetails.totalInr))}`)
    console.log('===============================')
    return { success: true, id: 'dev-mode' }
  }

  try {
    const response = await resend.emails.send({
      from: 'Al Noor Luxury <orders@al-noor.co>',
      to: email,
      subject: `Your Al Noor Order Confirmation (${orderDetails.id})`,
      html,
    })

    if (response.error) {
      console.error('[email] Resend error:', response.error)
      return { success: false, error: response.error.message }
    }

    return { success: true, id: response.data?.id }
  } catch (err) {
    console.error('[email] Exception sending order confirmation email:', err)
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
}

/**
 * Sends order cancellation email
 */
export async function sendOrderCancellationEmail({
  email,
  orderId,
  customerName,
}: {
  email: string
  orderId: string
  customerName: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const contentHtml = `
    <h1 style="font-family: 'Bodoni Moda', serif; font-style: italic; font-weight: 700; font-size: 28px; margin-top: 0; color: ${BRAND_DEEP};">
      Order Cancelled
    </h1>
    <p style="font-size: 15px; color: ${BRAND_MID};">
      Dear ${customerName},
    </p>
    <p style="font-size: 15px; color: ${BRAND_MID};">
      Your order <strong>${orderId}</strong> has been cancelled. No payment was collected for this order.
    </p>
    <p style="font-size: 13px; color: ${BRAND_MUTED}; margin-top: 25px; line-height: 1.5; border-left: 2px solid ${BRAND_GOLD}; padding-left: 15px;">
      If you have any questions or did not request this cancellation, please reach out to our customer support.
    </p>
  `

  const html = getHtmlWrapper(contentHtml)

  if (!resend) {
    console.log('=== [DEVELOPMENT EMAIL LOG] ===')
    console.log(`To: ${email}`)
    console.log(`Subject: Your Al Noor Order has been Cancelled (${orderId})`)
    console.log('===============================')
    return { success: true, id: 'dev-mode' }
  }

  try {
    const response = await resend.emails.send({
      from: 'Al Noor Luxury <orders@al-noor.co>',
      to: email,
      subject: `Your Al Noor Order has been Cancelled (${orderId})`,
      html,
    })

    if (response.error) {
      console.error('[email] Resend error:', response.error)
      return { success: false, error: response.error.message }
    }

    return { success: true, id: response.data?.id }
  } catch (err) {
    console.error('[email] Exception sending cancellation email:', err)
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
}

/**
 * Sends order status update email
 */
export async function sendOrderStatusUpdateEmail({
  email,
  orderId,
  status,
  trackingNumber,
  customerName,
}: {
  email: string
  orderId: string
  status: string
  trackingNumber?: string | null
  customerName: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()

  let trackingHtml = ''
  if (status.toLowerCase() === 'shipped' && trackingNumber) {
    const trackUrl = `https://www.delhivery.com/track/share?waybill=${trackingNumber}`
    trackingHtml = `
      <div style="font-size: 13px; color: ${BRAND_MID}; background-color: ${BRAND_IVORY}; padding: 15px; border-radius: 2px; border: 1px solid rgba(158, 127, 74, 0.1); line-height: 1.5; margin: 20px 0;">
        <strong>Courier:</strong> Delhivery<br>
        <strong>Waybill Number:</strong> ${trackingNumber}<br>
        <div style="text-align: center; margin-top: 15px;">
          <a href="${trackUrl}" class="button" style="display: inline-block; background-color: ${BRAND_GOLD}; color: #ffffff !important; text-decoration: none; padding: 14px 28px; font-family: 'Raleway', sans-serif; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; border-radius: 2px;" target="_blank">Track Shipment</a>
        </div>
      </div>
    `
  }

  const contentHtml = `
    <h1 style="font-family: 'Bodoni Moda', serif; font-style: italic; font-weight: 700; font-size: 28px; margin-top: 0; color: ${BRAND_DEEP};">
      Order Status Update: ${statusLabel}
    </h1>
    <p style="font-size: 15px; color: ${BRAND_MID};">
      Dear ${customerName},
    </p>
    <p style="font-size: 15px; color: ${BRAND_MID};">
      The status of your order <strong>${orderId}</strong> has been updated to <strong>${statusLabel}</strong>.
    </p>
    ${trackingHtml}
    <p style="font-size: 13px; color: ${BRAND_MUTED}; margin-top: 25px; line-height: 1.5; border-left: 2px solid ${BRAND_GOLD}; padding-left: 15px;">
      You can track this order directly inside your account profile dashboard.
    </p>
  `

  const html = getHtmlWrapper(contentHtml)

  if (!resend) {
    console.log('=== [DEVELOPMENT EMAIL LOG] ===')
    console.log(`To: ${email}`)
    console.log(`Subject: Al Noor Order Status Update: ${statusLabel} (${orderId})`)
    console.log('===============================')
    return { success: true, id: 'dev-mode' }
  }

  try {
    const response = await resend.emails.send({
      from: 'Al Noor Luxury <orders@al-noor.co>',
      to: email,
      subject: `Al Noor Order Status Update: ${statusLabel} (${orderId})`,
      html,
    })

    if (response.error) {
      console.error('[email] Resend error:', response.error)
      return { success: false, error: response.error.message }
    }

    return { success: true, id: response.data?.id }
  } catch (err) {
    console.error('[email] Exception sending status update email:', err)
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
}
