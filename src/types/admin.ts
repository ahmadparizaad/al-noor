export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export interface AdminOrderItem {
  productId: string
  productName: string
  quantity: number
  priceInr: number
}

export interface AdminOrder {
  id: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: AdminOrderItem[]
  status: OrderStatus
  totalInr: number
  paymentStatus: string
  trackingNumber?: string
  shippingAddress: {
    fullName: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  createdAt: string
}

export interface AdminCustomer {
  id: string
  name: string
  email: string
  phone?: string
  ordersCount: number
  totalSpentInr: number
  lastOrderDate: string
  recentOrders: Array<{ id: string; totalInr: number; status: OrderStatus; createdAt: string }>
}

export interface AdminProduct {
  id: string
  name: string
  ref: string
  category: string
  material: string
  dial: string
  priceInr: number
  originalPriceInr: number
  stock: number
  isActive: boolean
  badge: string
  images: string[]
}

export interface RevenueMonth {
  month: string
  revenueInr: number
  ordersCount: number
}
