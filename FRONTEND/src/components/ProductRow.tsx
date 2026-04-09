'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/lib/products'

export default function ProductRow({ title, products }: { title: string; products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (!products.length) return null

  return (
    <section className="py-8">
      <div className="flex items-center justify-between px-4 md:px-8 max-w-7xl mx-auto mb-4">
        <h2 className="font-display text-xl font-bold text-snap-text uppercase tracking-wide">
          {title}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-snap-card border border-snap-border text-snap-muted hover:text-snap-text hover:border-snap-accent transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-snap-card border border-snap-border text-snap-muted hover:text-snap-text hover:border-snap-accent transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
