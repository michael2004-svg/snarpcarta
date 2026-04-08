'use client'

import { X, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function CartDrawer() {
  const { state, dispatch, total, itemCount } = useCart()

  if (!state.isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => dispatch({ type: 'CLOSE' })}
      />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-snap-bg border-l border-snap-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-snap-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-snap-accent" />
            <h2 className="font-display text-lg font-bold text-snap-text">CART</h2>
            {itemCount > 0 && (
              <span className="text-xs bg-snap-accent text-white rounded-full px-2 py-0.5 font-bold">{itemCount}</span>
            )}
          </div>
          <button onClick={() => dispatch({ type: 'CLOSE' })} className="text-snap-muted hover:text-snap-text p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-5 space-y-4">
          {state.items.length === 0 ? (
            <div className="text-center py-16 text-snap-muted">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Your cart is empty</p>
              <button
                onClick={() => dispatch({ type: 'CLOSE' })}
                className="mt-4 text-snap-accent text-sm hover:underline"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            state.items.map(item => (
              <div key={item.product.id} className="flex gap-3 bg-snap-card rounded-xl p-3 border border-snap-border">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-snap-surface flex-shrink-0">
                  <img
                    src={item.product.image || item.product.images?.[0] || '/placeholder.png'}
                    alt={item.product.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-snap-text text-sm font-semibold truncate">{item.product.title}</p>
                  <p className="text-snap-accent font-bold text-sm mt-0.5">${item.product.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.product.id, qty: item.quantity - 1 })}
                      className="w-6 h-6 rounded-md bg-snap-surface flex items-center justify-center text-snap-muted hover:text-snap-text"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-snap-text text-sm w-6 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.product.id, qty: item.quantity + 1 })}
                      className="w-6 h-6 rounded-md bg-snap-surface flex items-center justify-center text-snap-muted hover:text-snap-text"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE', id: item.product.id })}
                      className="ml-auto text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {state.items.length > 0 && (
          <div className="border-t border-snap-border px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-snap-text font-semibold">
              <span>Total</span>
              <span className="text-snap-accent text-lg font-bold">${total.toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={() => dispatch({ type: 'CLOSE' })}
              className="btn-accent w-full text-center block text-sm"
            >
              Checkout
            </Link>
            <button
              onClick={() => dispatch({ type: 'CLEAR' })}
              className="w-full text-snap-muted text-xs hover:text-red-400 transition-colors"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  )
}
