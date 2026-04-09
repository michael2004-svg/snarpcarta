'use client'

import Link from 'next/link'
import { ShoppingCart, Eye, Star } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/lib/products'

export default function ProductCard({ product }: { product: Product }) {
  const { dispatch } = useCart()

  const discount =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null

  return (
    <div className="group relative flex-shrink-0 w-48 sm:w-56 bg-snap-card rounded-xl border border-snap-border overflow-hidden hover:border-snap-accent/60 hover:scale-105 hover:shadow-xl hover:shadow-snap-accent/10 transition-all duration-300 ease-out">
      <Link href={`/product/${product.id}`} className="relative block aspect-[3/4] overflow-hidden bg-snap-surface">
        <img
          src={product.image || product.images?.[0] || '/placeholder.png'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {product.badge && (
          <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
            product.badge === 'sale' ? 'bg-red-500 text-white' :
            product.badge === 'hot' ? 'bg-orange-500 text-white' :
            'bg-snap-accent text-black'
          }`}>
            {product.badge === 'sale' && discount ? `-${discount}%` : product.badge}
          </span>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-sm font-bold">Out of Stock</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={(e) => {
              e.preventDefault()
              dispatch({ type: 'ADD', product })
            }}
            disabled={!product.inStock}
            className="flex-1 py-2 rounded-lg bg-snap-accent text-black font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-snap-accent-hover transition-colors disabled:opacity-40"
          >
            <ShoppingCart className="w-4 h-4" />
            Add
          </button>
          <Link
            href={`/product/${product.id}`}
            className="px-3 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white font-semibold text-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </Link>

      <div className="p-3">
        <Link href={`/product/${product.id}`}>
          <h3 className="text-snap-text text-sm font-medium leading-snug line-clamp-2 hover:text-snap-accent transition-colors">
            {product.title}
          </h3>
        </Link>

        {product.rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-snap-muted text-xs">{product.rating.toFixed(1)}</span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          <span className="text-snap-accent font-bold text-lg">${product.price.toFixed(2)}</span>
          {product.originalPrice > product.price && (
            <span className="text-snap-muted text-xs line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
