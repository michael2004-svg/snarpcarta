'use client'

import { useCart } from '@/context/CartContext'
import Link from 'next/link'
import Image from 'next/image'

export default function CartPage() {
  const { state, dispatch, total } = useCart()

  if (state.items.length === 0) {
    return (
      <main className="pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center">
          <h1 className="font-display text-3xl font-bold text-snap-text mb-4">Your Cart is Empty</h1>
          <p className="text-snap-muted mb-8">Start shopping to add items to your cart.</p>
          <Link href="/" className="btn-accent">Continue Shopping</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <h1 className="font-display text-3xl font-bold text-snap-text mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {state.items.map(item => (
              <div key={item.product.id} className="flex gap-4 bg-snap-card rounded-2xl border border-snap-border p-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-snap-surface flex-shrink-0">
                  <img
                    src={item.product.image || item.product.images?.[0] || '/placeholder.png'}
                    alt={item.product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.product.id}`} className="text-snap-text font-semibold hover:text-snap-accent">
                    {item.product.title}
                  </Link>
                  <p className="text-snap-accent font-bold mt-1">${item.product.price.toFixed(2)}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.product.id, qty: item.quantity - 1 })}
                        className="w-8 h-8 rounded-lg bg-snap-surface flex items-center justify-center text-snap-muted hover:text-snap-text"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.product.id, qty: item.quantity + 1 })}
                        className="w-8 h-8 rounded-lg bg-snap-surface flex items-center justify-center text-snap-muted hover:text-snap-text"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE', id: item.product.id })}
                      className="text-red-400 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-snap-card rounded-2xl border border-snap-border p-6 sticky top-24">
              <h2 className="font-display text-lg font-bold text-snap-text mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-snap-muted">Subtotal ({state.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="text-snap-text">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-snap-muted">Shipping</span>
                  <span className="text-snap-text">Calculated at checkout</span>
                </div>
                <div className="border-t border-snap-border pt-3 flex justify-between font-bold">
                  <span className="text-snap-text">Total</span>
                  <span className="text-snap-accent text-xl">${total.toFixed(2)}</span>
                </div>
              </div>
              <Link href="/checkout" className="btn-accent w-full text-center block mt-6">
                Proceed to Checkout
              </Link>
              <button
                onClick={() => dispatch({ type: 'CLEAR' })}
                className="w-full text-center text-snap-muted text-sm mt-3 hover:text-red-400"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}