'use client'

import { useState } from 'react'
import { getProduct } from '@/lib/products'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Star, ShoppingCart, ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function ProductPage({ params }: { params: { id: string } }) {
  const productPromise = getProduct(params.id)
  const [selectedImage, setSelectedImage] = useState(0)
  const [qty, setQty] = useState(1)
  const { dispatch, state } = useCart()
  
  return productPromise.then(product => {
    if (!product) {
      notFound()
    }

    const discount = product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null

    const item = state.items.find(i => i.product.id === product.id)
    const inCart = item?.quantity || 0

    return (
      <main className="min-h-screen bg-snap-bg">
        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
            <Link href="/" className="inline-flex items-center gap-1 text-snap-muted hover:text-snap-text text-sm mb-6">
              <ChevronLeft className="w-4 h-4" /> Back to shopping
            </Link>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              <div className="space-y-4">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-snap-card border border-snap-border">
                  <img
                    src={product.images?.[selectedImage] || product.image || '/placeholder.png'}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
                  />
                </div>
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {product.images.slice(0, 6).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                          selectedImage === i ? 'border-snap-accent' : 'border-snap-border'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {product.badge && (
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                    product.badge === 'sale' ? 'bg-red-500 text-white' :
                    product.badge === 'hot' ? 'bg-orange-500 text-white' :
                    'bg-snap-accent text-black'
                  }`}>
                    {product.badge === 'sale' && discount ? `-${discount}% OFF` : product.badge.toUpperCase()}
                  </span>
                )}

                <h1 className="font-display text-3xl md:text-4xl font-bold text-snap-text">{product.title}</h1>

                {product.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-snap-border'}`}
                        />
                      ))}
                    </div>
                    <span className="text-snap-muted text-sm">{product.rating.toFixed(1)} ({product.reviewCount?.toLocaleString()} reviews)</span>
                  </div>
                )}

                <div className="flex items-baseline gap-3">
                  <span className="text-snap-accent text-4xl font-bold">${product.price.toFixed(2)}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-snap-muted text-xl line-through">${product.originalPrice.toFixed(2)}</span>
                  )}
                  {discount && (
                    <span className="text-green-400 text-sm font-semibold">Save {discount}%</span>
                  )}
                </div>

                <p className="text-snap-muted leading-relaxed">{product.description || 'No description available.'}</p>

                {product.specs && Object.keys(product.specs).length > 0 && (
                  <div className="bg-snap-card rounded-xl border border-snap-border p-4">
                    <h3 className="font-semibold text-snap-text mb-2">Specifications</h3>
                    <div className="space-y-1 text-sm">
                      {Object.entries(product.specs).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-snap-muted capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-snap-text">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-4">
                    <span className="text-snap-muted text-sm">Quantity:</span>
                    <div className="flex items-center gap-2 bg-snap-card border border-snap-border rounded-xl p-1">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="w-10 h-10 rounded-lg bg-snap-surface flex items-center justify-center text-snap-muted hover:text-snap-text"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-snap-text">{qty}</span>
                      <button
                        onClick={() => setQty(qty + 1)}
                        className="w-10 h-10 rounded-lg bg-snap-surface flex items-center justify-center text-snap-muted hover:text-snap-text"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {inCart > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2 bg-snap-card border border-snap-accent/30 rounded-xl p-1">
                        <button
                          onClick={() => dispatch({ type: 'UPDATE_QTY', id: product.id, qty: inCart - 1 })}
                          className="w-10 h-10 rounded-lg bg-snap-surface flex items-center justify-center text-snap-muted hover:text-snap-text"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="flex-1 text-center font-bold text-snap-text">{inCart} in cart</span>
                        <button
                          onClick={() => dispatch({ type: 'ADD', product, qty: 1 })}
                          className="w-10 h-10 rounded-lg bg-snap-surface flex items-center justify-center text-snap-muted hover:text-snap-text"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <Link
                        href="/checkout"
                        className="flex-1 py-3 bg-snap-accent text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-snap-accent-hover transition-colors"
                      >
                        Buy Now
                      </Link>
                      <button
                        onClick={() => dispatch({ type: 'REMOVE', id: product.id })}
                        className="p-3 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => dispatch({ type: 'ADD', product, qty })}
                      disabled={!product.inStock}
                      className="w-full py-4 bg-snap-accent text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-snap-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  )}

                  <Link
                    href="/checkout"
                    className="w-full py-3 bg-transparent border border-snap-border text-snap-text font-semibold rounded-xl flex items-center justify-center gap-2 hover:border-snap-accent hover:text-snap-accent transition-colors"
                  >
                    Buy Now
                  </Link>
                </div>

                <div className="pt-4 border-t border-snap-border">
                  <div className="flex items-center gap-2 text-sm text-snap-muted">
                    <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-400' : 'bg-red-400'}`} />
                    {product.inStock ? 'In Stock - Ready to ship' : 'Out of Stock'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  })
}
