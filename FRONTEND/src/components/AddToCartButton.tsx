'use client'

import { useCart } from '@/context/CartContext'
import type { Product } from '@/lib/products'
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function AddToCartButton({ product }: { product: Product }) {
  const { dispatch, state } = useCart()
  const item = state.items.find(i => i.product.id === product.id)
  const qty = item?.quantity || 0

  if (qty > 0) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-snap-card border border-snap-border rounded-xl p-1">
          <button
            onClick={() => dispatch({ type: 'UPDATE_QTY', id: product.id, qty: qty - 1 })}
            className="w-10 h-10 rounded-lg bg-snap-surface flex items-center justify-center text-snap-muted hover:text-snap-text"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-bold text-snap-text">{qty}</span>
          <button
            onClick={() => dispatch({ type: 'ADD', product, qty: 1 })}
            className="w-10 h-10 rounded-lg bg-snap-surface flex items-center justify-center text-snap-muted hover:text-snap-text"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => dispatch({ type: 'REMOVE', id: product.id })}
          className="p-2.5 text-red-400 hover:text-red-300"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => dispatch({ type: 'ADD', product })}
      disabled={!product.inStock}
      className="btn-accent w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <ShoppingCart className="w-5 h-5" />
      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
    </button>
  )
}
