'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from './products-data'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(product, quantity = 1) {
        set(state => {
          const existing = state.items.find(i => i.product.id === product.id)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product.id === product.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, 10) }
                  : i
              ),
            }
          }
          return { items: [...state.items, { product, quantity }] }
        })
      },

      removeItem(productId) {
        set(state => ({ items: state.items.filter(i => i.product.id !== productId) }))
      },

      updateQuantity(productId, quantity) {
        if (quantity < 1) {
          get().removeItem(productId)
          return
        }
        set(state => ({
          items: state.items.map(i =>
            i.product.id === productId ? { ...i, quantity: Math.min(quantity, 10) } : i
          ),
        }))
      },

      clearCart() {
        set({ items: [] })
      },

      totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      subtotal() {
        return get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
      },
    }),
    { name: 'al-noor-cart' }
  )
)
