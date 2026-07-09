import { db } from '@/lib/db'
import { orders } from '@/lib/schema'
import { eq } from 'drizzle-orm'

const DELHI_STAGING_URL = 'https://staging-express.delhivery.com'
const DELHI_PROD_URL = 'https://track.delhivery.com'

function getDelhiUrl(path: string) {
  const env = process.env.DELHIVERY_ENV || 'staging'
  const baseUrl = env === 'production' ? DELHI_PROD_URL : DELHI_STAGING_URL
  return `${baseUrl}${path}`
}

function getDelhiToken() {
  return process.env.DELHIVERY_API_TOKEN || 'mock_delhivery_api_token'
}

function isMockMode() {
  const token = getDelhiToken()
  return token === 'mock_delhivery_api_token' || token.startsWith('mock')
}

// Must match the warehouse name registered in the Delhivery merchant dashboard exactly —
// Delhivery's create-shipment API looks pickup locations up by this name and fails with
// "ClientWarehouse matching query does not exist." if it doesn't match.
export const DEFAULT_PICKUP_LOCATION = {
  name: 'AL B2C',
}

export interface PincodeServiceabilityResult {
  isServiceable: boolean
  isCod: boolean
  isPrepaid: boolean
  district?: string
  state?: string
  estimatedDeliveryDays?: string
}

/**
 * Check if a pincode is serviceable by Delhivery
 */
export async function checkPincodeServiceability(pincode: string): Promise<PincodeServiceabilityResult> {
  if (!/^\d{6}$/.test(pincode)) {
    return { isServiceable: false, isCod: false, isPrepaid: false }
  }

  if (isMockMode()) {
    // Standard mock behavior: Pincodes starting with 9 are non-serviceable for testing
    if (pincode.startsWith('9')) {
      return { isServiceable: false, isCod: false, isPrepaid: false }
    }
    // All other pincodes are serviceable
    return {
      isServiceable: true,
      isCod: true,
      isPrepaid: true,
      district: pincode.startsWith('11') ? 'Delhi' : pincode.startsWith('40') ? 'Mumbai' : 'Bengaluru',
      state: pincode.startsWith('11') ? 'Delhi' : pincode.startsWith('40') ? 'Maharashtra' : 'Karnataka',
      estimatedDeliveryDays: '2-4 days',
    }
  }

  try {
    const token = getDelhiToken()
    const url = getDelhiUrl(`/c/api/pin-codes/json/?filter_codes=${pincode}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`[Delhivery Serviceability] Delhivery Pincode serviceability API error: ${response.status} ${response.statusText}`)
      return { isServiceable: false, isCod: false, isPrepaid: false }
    }

    const data = await response.json()
    const deliveryCodes = data?.delivery_codes || []

    if (deliveryCodes.length === 0) {
      return { isServiceable: false, isCod: false, isPrepaid: false }
    }

    const postalCodeInfo = deliveryCodes[0]?.postal_code || deliveryCodes[0]?.pin_code
    if (!postalCodeInfo) {
      console.warn(`[Delhivery Serviceability] postal_code or pin_code not found in delivery_codes[0] for pincode: ${pincode}`)
      return { isServiceable: false, isCod: false, isPrepaid: false }
    }

    // Delhivery API can return string 'Y'/'N' or boolean
    const isCod = postalCodeInfo.cod === true || postalCodeInfo.cod === 'Y' || postalCodeInfo.is_cod_serviceable === true
    const isPrepaid = postalCodeInfo.prepaid === true || postalCodeInfo.prepaid === 'Y' || postalCodeInfo.pre_paid === true || postalCodeInfo.pre_paid === 'Y' || postalCodeInfo.is_prepaid_serviceable === true
    
    // If pincode is found in Delhivery's serviceable codes database and has either COD or Prepaid enabled,
    // and is not explicitly set to false or 'N', we treat it as serviceable.
    const isServiceable = (postalCodeInfo.is_serviceable !== false && postalCodeInfo.is_serviceable !== 'N') && (isCod || isPrepaid)

    return {
      isServiceable,
      isCod,
      isPrepaid,
      district: postalCodeInfo.district || postalCodeInfo.city,
      state: postalCodeInfo.state,
      estimatedDeliveryDays: postalCodeInfo.d_time || '3-5 days',
    }
  } catch (error) {
    console.error('[Delhivery Serviceability] Error checking Delhivery pincode serviceability:', error)
    return { isServiceable: false, isCod: false, isPrepaid: false }
  }
}

export interface CreateShipmentParams {
  orderId: string
  consigneeName: string
  consigneePhone: string
  consigneeAddress: string
  consigneePincode: string
  consigneeCity: string
  consigneeState: string
  consigneeCountry?: string
  totalAmount: number
  paymentType: 'Prepaid' | 'COD'
  weightKg?: number
  lengthCm?: number
  breadthCm?: number
  heightCm?: number
  productName?: string
}

export interface CreateShipmentResult {
  success: boolean
  waybill?: string
  error?: string
  rawResponse?: unknown
}

/**
 * Register a shipment on Delhivery and get a Waybill / tracking number
 */
export async function createDelhiveryShipment(params: CreateShipmentParams): Promise<CreateShipmentResult> {
  // Field names verified against Delhivery's live /api/cmu/create.json — their B2C
  // shipment object uses these short names, not the "consignee_*" names shown in some docs.
  const payload = {
    shipments: [
      {
        order: params.orderId,
        name: params.consigneeName,
        phone: params.consigneePhone,
        add: params.consigneeAddress,
        pin: params.consigneePincode,
        city: params.consigneeCity,
        state: params.consigneeState,
        country: params.consigneeCountry || 'India',
        payment_mode: params.paymentType, // "Prepaid" or "COD"
        weight: params.weightKg || 0.5,
        shipment_length: params.lengthCm || 15,
        shipment_width: params.breadthCm || 15,
        shipment_height: params.heightCm || 10,
        cod_amount: params.paymentType === 'COD' ? params.totalAmount : 0,
        products_desc: params.productName || 'Luxury Watch',
        seller_name: DEFAULT_PICKUP_LOCATION.name,
      }
    ],
    pickup_location: {
      name: DEFAULT_PICKUP_LOCATION.name,
    }
  }

  if (isMockMode()) {
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000)
    const waybill = `DELH${randomDigits}`
    
    // Save waybill to the orders database asynchronously
    await db.update(orders)
      .set({ trackingNumber: waybill, status: 'processing', updatedAt: new Date() })
      .where(eq(orders.id, params.orderId))

    return {
      success: true,
      waybill,
      rawResponse: { mock: true, order: params.orderId }
    }
  }

  try {
    const token = getDelhiToken()
    const url = getDelhiUrl('/api/cmu/create.json')

    const bodyParams = new URLSearchParams()
    bodyParams.append('format', 'json')
    bodyParams.append('data', JSON.stringify(payload))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: bodyParams.toString(),
    })

    if (!response.ok) {
      console.error(`[Delhivery Shipment] Delhivery CMU API error: ${response.status} ${response.statusText}`)
      return { success: false, error: `Delhivery server returned status ${response.status}` }
    }

    const data = await response.json()

    // Delhivery's create-shipment response nests the per-package result in `packages[0]`,
    // with `status: "Success" | "Fail"` and a top-level `rmk` describing internal errors.
    const packageResult = data?.packages?.[0]

    if (data?.success === false || packageResult?.status !== 'Success' || !packageResult?.waybill) {
      const errorMsg = packageResult?.remarks?.[0] || data?.rmk || 'Unknown error occurred on Delhivery'
      console.error(`[Delhivery Shipment] Shipment creation failed. Error: ${errorMsg}`)
      return { success: false, error: errorMsg, rawResponse: data }
    }

    const waybill = packageResult.waybill

    await db.update(orders)
      .set({ trackingNumber: waybill, status: 'processing', updatedAt: new Date() })
      .where(eq(orders.id, params.orderId))

    return {
      success: true,
      waybill,
      rawResponse: data
    }
  } catch (error) {
    console.error('[Delhivery Shipment] Error creating Delhivery shipment:', error)
    const errorMsg = error instanceof Error ? error.message : 'Network error'
    return { success: false, error: errorMsg }
  }
}

export interface CancelShipmentResult {
  success: boolean
  error?: string
}

/**
 * Cancel a manifested Delhivery shipment before it has been picked up.
 * Delhivery rejects cancellation once a shipment is out for pickup/in transit —
 * callers should treat a failure here as "cannot cancel," not retry.
 *
 * UNVERIFIED: the /api/p/edit payload shape ({ waybill, cancellation: true }) and the
 * data.status/data.rmk response fields below are inferred from Delhivery's cancel-shipment
 * docs, not confirmed against a live/staging call (unlike createDelhiveryShipment, which was
 * verified against the live API). Confirm against a real request before relying on this in prod.
 */
export async function cancelDelhiveryShipment(waybill: string): Promise<CancelShipmentResult> {
  if (isMockMode()) {
    return { success: true }
  }

  try {
    const token = getDelhiToken()
    const url = getDelhiUrl('/api/p/edit')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ waybill, cancellation: true }),
    })

    if (!response.ok) {
      console.error(`[Delhivery Cancel] Delhivery cancel API error: ${response.status} ${response.statusText}`)
      return { success: false, error: `Delhivery server returned status ${response.status}` }
    }

    const data = await response.json()

    // Field names/types (status as bool or 'true' string, rmk/remark for errors) are
    // defensive assumptions pending live API verification — see the UNVERIFIED note above.
    if (data?.status !== true && data?.status !== 'true') {
      const errorMsg = data?.rmk || data?.remark || 'Delhivery rejected the cancellation request'
      console.error(`[Delhivery Cancel] Shipment cancellation failed for waybill ${waybill}: ${errorMsg}`)
      return { success: false, error: errorMsg }
    }

    return { success: true }
  } catch (error) {
    console.error('[Delhivery Cancel] Error cancelling Delhivery shipment:', error)
    const errorMsg = error instanceof Error ? error.message : 'Network error'
    return { success: false, error: errorMsg }
  }
}

export interface TrackingEvent {
  status: string
  location: string
  timestamp: string
  note?: string
}

export interface TrackingResult {
  waybill: string
  status: string
  statusDate?: string
  scans: TrackingEvent[]
}

/**
 * Fetch package tracking information from Delhivery
 */
export async function trackDelhiveryShipment(waybill: string): Promise<TrackingResult | null> {
  if (!waybill) return null

  if (isMockMode()) {
    // Generate realistic simulated tracking history for demo purposes
    const now = new Date()
    const trackingEvents: TrackingEvent[] = [
      {
        status: 'Manifest Created',
        location: 'Gurugram, Haryana',
        timestamp: new Date(now.getTime() - 24 * 3600_000).toISOString(),
        note: 'Shipment data received, waiting for pickup',
      },
    ]

    // Add extra statuses depending on the prefix/suffix of the mock waybill to simulate in-transit/delivered states
    const lastDigit = parseInt(waybill.slice(-1)) || 0
    
    if (lastDigit >= 3) {
      trackingEvents.push({
        status: 'In Transit',
        location: 'Gurugram Warehouse, Haryana',
        timestamp: new Date(now.getTime() - 18 * 3600_000).toISOString(),
        note: 'Package picked up by Delhivery and in transit',
      })
    }
    
    if (lastDigit >= 6) {
      trackingEvents.push({
        status: 'Reached Delivery Center',
        location: 'Destination Hub',
        timestamp: new Date(now.getTime() - 8 * 3600_000).toISOString(),
        note: 'Package arrived at delivery center',
      })
    }

    if (lastDigit >= 8) {
      trackingEvents.push({
        status: 'Out For Delivery',
        location: 'Destination Hub',
        timestamp: new Date(now.getTime() - 3 * 3600_000).toISOString(),
        note: 'Package is out with courier partner for delivery',
      })
    }

    if (lastDigit === 9) {
      trackingEvents.push({
        status: 'Delivered',
        location: 'Consignee Address',
        timestamp: new Date(now.getTime() - 1 * 3600_000).toISOString(),
        note: 'Package delivered successfully. Signed by customer.',
      })
    }

    return {
      waybill,
      status: trackingEvents[trackingEvents.length - 1].status,
      statusDate: trackingEvents[trackingEvents.length - 1].timestamp,
      scans: trackingEvents,
    }
  }

  try {
    const token = getDelhiToken()
    const url = getDelhiUrl(`/api/v1/packages/json/?waybill=${waybill}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`[Delhivery Tracking] Delhivery Tracking API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // Parse Delhivery tracking response structure
    const trackingData = data?.ShipmentData?.[0]?.Shipment || data?.tracking_data || data?.[0]
    
    if (!trackingData) {
      console.warn(`[Delhivery Tracking] No tracking data found in response for waybill: ${waybill}`)
      return null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scans: TrackingEvent[] = (trackingData.Scans || trackingData.scans || []).map((scan: any) => {
      const scanDetail = scan.ScanDetail || scan
      return {
        status: scanDetail.status || scanDetail.Scan || scanDetail.Instructions,
        location: scanDetail.ScannedLocation || scanDetail.location || scanDetail.ScanLocation,
        timestamp: scanDetail.ScanDateTime || scanDetail.date || scanDetail.ScanDate,
        note: scanDetail.Instructions || scanDetail.details || scanDetail.Comment,
      }
    })

    const statusObj = trackingData.Status || trackingData.status
    const status = statusObj?.Status || statusObj?.status || trackingData.Status?.status || 'Unknown'
    const statusDate = statusObj?.StatusDateTime || statusObj?.status_date || trackingData.Status?.status_date

    return {
      waybill,
      status,
      statusDate,
      scans: scans.length > 0 ? scans : [
        {
          status: status,
          location: trackingData.Destination || 'In Transit',
          timestamp: statusDate || new Date().toISOString(),
          note: trackingData.Instructions || 'Package status updated',
        }
      ],
    }
  } catch (error) {
    console.error('[Delhivery Tracking] Error tracking Delhivery shipment:', error)
    return null
  }
}
