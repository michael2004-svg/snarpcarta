'use client'

import Link from 'next/link'
import { ShoppingCart, Star } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/lib/products'

export default function ProductCard({ product }: { product: Product }) {
  const { dispatch } = useCart()

  const discount =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null

  return (
    <div className="group bg-snap-card rounded-2xl border border-snap-border overflow-hidden hover:border-snap-accent/40 transition-all duration-200 flex flex-col">
      <Link href={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-snap-surface">
        <img
          src={product.image || product.images?.[0] || '/placeholder.png'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
        />
        {product.badge && (
          <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
            product.badge === 'sale' ? 'bg-red-500 text-white' :
            product.badge === 'hot' ? 'bg-orange-500 text-white' :
            'bg-snap-accent text-white'
          }`}>
            {product.badge === 'sale' && discount ? `-${discount}%` : product.badge}
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-sm font-bold">Out of Stock</span>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link href={`/product/${product.id}`}>
          <h3 className="text-snap-text text-sm font-semibold leading-snug line-clamp-2 hover:text-snap-accent transition-colors">
            {product.title}
          </h3>
        </Link>

        {product.rating > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-snap-muted text-xs">{product.rating.toFixed(1)} ({product.reviewCount?.toLocaleString()})</span>
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div>
            <span className="text-snap-accent font-bold">${product.price.toFixed(2)}</span>
            {product.originalPrice > product.price && (
              <span className="text-snap-muted text-xs line-through ml-1.5">${product.originalPrice.toFixed(2)}</span>
            )}
          </div>
          <button
            onClick={() => dispatch({ type: 'ADD', product })}
            disabled={!product.inStock}
            className="p-2 rounded-xl bg-snap-accent/10 text-snap-accent hover:bg-snap-accent hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
