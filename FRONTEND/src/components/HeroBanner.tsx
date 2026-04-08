import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function HeroBanner() {
  return (
    <section className="pt-16 min-h-[70vh] flex items-center bg-snap-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-snap-accent/5 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="max-w-2xl">
          <span className="inline-block text-snap-accent text-xs font-bold tracking-widest uppercase mb-4 px-3 py-1 bg-snap-accent/10 rounded-full">
            New Collection 2026
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-snap-text leading-none mb-6">
            SHOP THE<br />
            <span className="text-snap-accent">FUTURE</span>
          </h1>
          <p className="text-snap-muted text-lg mb-8 max-w-lg leading-relaxed">
            Curated electronics, gadgets and accessories sourced from the world's best suppliers. 
            Fast shipping, unbeatable prices.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="#products" className="btn-accent flex items-center gap-2 text-sm">
              Shop Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/admin/products" className="btn-ghost text-sm">
              Import Products
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
