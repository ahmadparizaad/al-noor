export type UserRole = 'customer' | 'admin'

export interface SessionUser {
  id: string
  email?: string | null
  phone?: string | null
  name?: string | null
  role: UserRole
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  category: string
  priceInr: number
  originalPriceInr?: number
  stock: number
  images?: string[]
  specs?: Record<string, string>
  isActive: boolean
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  priceInr: number
}

export interface Order {
  id: string
  userId?: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  totalInr: number
  shippingAddress: Address
  phonePeTransactionId?: string
  paymentStatus: string
  trackingNumber?: string
  items: OrderItem[]
  createdAt: string
}

export interface Address {
  fullName: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

// Extend next-auth session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      phone?: string | null
      name?: string | null
      role: UserRole
    }
    // Set by jwt callback when refresh token is expired — triggers forced re-login
    error?: 'RefreshTokenExpired' | 'RefreshTokenMissing'
  }

  interface JWT {
    id?: string
    role?: string
    phone?: string
    email?: string
    accessExpiry?: number
    refreshToken?: string
    error?: string
  }
}
