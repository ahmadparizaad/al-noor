import { z } from 'zod'

export const addressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  line1: z.string().min(5).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
})

export const checkoutSchema = z.object({
  address: addressSchema,
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1).max(10),
  })).min(1),
})

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  category: z.string(),
  priceInr: z.number().positive(),
  originalPriceInr: z.number().positive().optional(),
  stock: z.number().int().min(0),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerSchema = loginSchema.extend({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
})
