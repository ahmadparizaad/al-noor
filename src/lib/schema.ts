import { pgTable, text, integer, decimal, timestamp, boolean, pgEnum, index } from 'drizzle-orm/pg-core'

export const orderStatusEnum = pgEnum('order_status', [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
])

export const userRoleEnum = pgEnum('user_role', ['customer', 'admin'])

export const deviceTypeEnum = pgEnum('device_type', ['mobile', 'desktop', 'tablet'])

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  phone: text('phone'),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').default('customer').notNull(),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => [
  index('idx_verification_tokens_user_id').on(t.userId),
])



export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  category: text('category').notNull(),
  priceInr: decimal('price_inr', { precision: 10, scale: 2 }).notNull(),
  originalPriceInr: decimal('original_price_inr', { precision: 10, scale: 2 }),
  stock: integer('stock').default(0).notNull(),
  images: text('images').array(),
  specs: text('specs'),   // JSON string
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  status: orderStatusEnum('status').default('pending').notNull(),
  totalInr: decimal('total_inr', { precision: 10, scale: 2 }).notNull(),
  shippingAddress: text('shipping_address').notNull(),  // JSON string
  phonePeTransactionId: text('phonepe_transaction_id').unique(),
  // Live flow is COD-only (Delhivery collects cash on delivery): 'cod_pending' -> 'cod_collected' | 'cancelled'.
  // 'refund_pending' / 'refunded' are reserved for a future prepaid/return flow, not written by any code yet.
  // 'paid' / 'failed' are legacy values written only by the retired Cashfree/PhonePe routes (kept as dead code).
  paymentStatus: text('payment_status').default('cod_pending').notNull(),
  trackingNumber: text('tracking_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, t => [
  index('idx_orders_user_id').on(t.userId),
  index('idx_orders_payment_status').on(t.paymentStatus),
])

export const addresses = pgTable('addresses', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  label: text('label').default('HOME').notNull(),   // HOME | WORK | OTHER
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  line1: text('line1').notNull(),
  line2: text('line2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  pincode: text('pincode').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => [
  index('idx_addresses_user_id').on(t.userId),
])

export const refreshTokens = pgTable('refresh_tokens', {
  id:          text('id').primaryKey(),
  userId:      text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tokenHash:   text('token_hash').notNull().unique(),   // SHA-256 of the actual token
  expiresAt:   timestamp('expires_at').notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  replacedAt:  timestamp('replaced_at'),               // set when rotated; null = still active
  replacedBy:  text('replaced_by'),                    // tokenHash of successor, for reuse grace
}, t => [index('idx_refresh_tokens_user').on(t.userId)])

export const catalogueOptions = pgTable('catalogue_options', {
  id:        text('id').primaryKey(),
  type:      text('type').notNull(),   // 'category' | 'material' | 'dial' | 'badge'
  value:     text('value').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
}, t => [
  index('idx_catalogue_options_type').on(t.type),
])

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  priceInr: decimal('price_inr', { precision: 10, scale: 2 }).notNull(),
})

export const featuredProducts = pgTable('featured_products', {
  position: integer('position').primaryKey(), // 1, 2, 3, 4
  productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const qrCodes = pgTable('qr_codes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  destination: text('destination').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  scanCount: integer('scan_count').default(0).notNull(),
  qrPngUrl: text('qr_png_url').notNull(),
  qrSvgUrl: text('qr_svg_url').notNull(),
  qrColor: text('qr_color').default('#000000').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const qrScans = pgTable('qr_scans', {
  id: text('id').primaryKey(),
  qrCodeId: text('qr_code_id').references(() => qrCodes.id, { onDelete: 'cascade' }).notNull(),
  scannedAt: timestamp('scanned_at').defaultNow().notNull(),
  deviceType: deviceTypeEnum('device_type'),
  browser: text('browser'),
  os: text('os'),
  city: text('city'),
  country: text('country'),
  region: text('region'),
  latitude: decimal('latitude', { precision: 9, scale: 6 }),
  longitude: decimal('longitude', { precision: 9, scale: 6 }),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
}, t => [
  index('idx_qr_scans_qr_code_id').on(t.qrCodeId),
  index('idx_qr_scans_scanned_at').on(t.scannedAt),
])

export const phoneOtps = pgTable('phone_otps', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull(),
  otpHash: text('otp_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  attempts: integer('attempts').default(0).notNull(),
}, t => [
  index('idx_phone_otps_phone').on(t.phone),
])


