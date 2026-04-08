import ProductCard from '@/components/ProductCard'
import type { Product } from '@/lib/products'

export default function ProductRow({ title, products }: { title: string; products: Product[] }) {
  if (!products.length) return null

  return (
    <section className="py-10 px-4 md:px-8 max-w-7xl mx-auto" id="products">
      <h2 className="font-display text-2xl font-bold text-snap-text mb-6 uppercase">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
