'use client'

import Link from 'next/link'
import { ArrowRight, ShoppingCart, Sparkles, Zap, Shield } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/lib/products'

interface HeroBannerProps {
  featuredProduct?: Product | null
}

export default function HeroBanner({ featuredProduct }: HeroBannerProps) {
  const { dispatch } = useCart()

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-snap-bg">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-snap-accent/10 via-snap-bg to-snap-bg" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-snap-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-24 w-full">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="flex items-center gap-1.5 text-snap-accent text-xs font-semibold tracking-wider uppercase px-3 py-1.5 bg-snap-accent/10 rounded-full border border-snap-accent/20">
              <Sparkles className="w-3.5 h-3.5" />
              Premium Collection
            </span>
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold text-snap-text leading-[1.1] mb-6 tracking-tight">
            Discover
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-snap-accent to-purple-400">
              Extraordinary
            </span>
            Products
          </h1>
          
          <p className="text-snap-muted text-xl mb-8 max-w-xl leading-relaxed">
            Curated electronics, gadgets & accessories from world-class suppliers. 
            Fast shipping, unbeatable prices, premium quality.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-12">
            <Link 
              href={featuredProduct ? `/product/${featuredProduct.id}` : '#products'} 
              className="group px-6 py-3.5 bg-snap-accent text-black font-bold rounded-xl flex items-center gap-2 hover:bg-snap-accent-hover transition-all hover:shadow-lg hover:shadow-snap-accent/25"
            >
              Shop Now 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href="#products" 
              className="px-6 py-3.5 bg-snap-card border border-snap-border text-snap-text font-semibold rounded-xl flex items-center gap-2 hover:border-snap-accent hover:text-snap-accent transition-all"
            >
              Explore Collection
            </Link>
          </div>

          <div className="flex flex-wrap gap-8 text-sm">
            <div className="flex items-center gap-2 text-snap-muted">
              <div className="p-2 rounded-lg bg-snap-card border border-snap-border">
                <Zap className="w-4 h-4 text-snap-accent" />
              </div>
              <span>Fast Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-snap-muted">
              <div className="p-2 rounded-lg bg-snap-card border border-snap-border">
                <Shield className="w-4 h-4 text-snap-accent" />
              </div>
              <span>Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2 text-snap-muted">
              <div className="p-2 rounded-lg bg-snap-card border border-snap-border">
                <Sparkles className="w-4 h-4 text-snap-accent" />
              </div>
              <span>Premium Quality</span>
            </div>
          </div>
        </div>

        {featuredProduct && (
          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-80">
            <div className="relative bg-snap-card border border-snap-border rounded-2xl p-4 shadow-2xl">
              <div className="aspect-square rounded-xl overflow-hidden mb-4">
                <img
                  src={featuredProduct.image || featuredProduct.images?.[0] || '/placeholder.png'}
                  alt={featuredProduct.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-snap-text font-semibold text-sm line-clamp-2">{featuredProduct.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-snap-accent font-bold text-xl">${featuredProduct.price.toFixed(2)}</span>
                  {featuredProduct.originalPrice > featuredProduct.price && (
                    <span className="text-snap-muted text-sm line-through">${featuredProduct.originalPrice.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/product/${featuredProduct.id}`}
                    className="flex-1 py-2 bg-snap-accent text-black font-semibold text-sm rounded-lg text-center hover:bg-snap-accent-hover transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => dispatch({ type: 'ADD', product: featuredProduct })}
                    className="p-2 bg-snap-surface border border-snap-border rounded-lg text-snap-accent hover:border-snap-accent transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-snap-bg to-transparent" />
    </section>
  )
}
