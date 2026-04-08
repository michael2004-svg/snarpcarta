import { getProduct } from '@/lib/products'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Star, ShoppingCart, ChevronLeft } from 'lucide-react'
import AddToCartButton from '@/components/AddToCartButton'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  const discount =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null

  return (
    <main className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-snap-muted hover:text-snap-text text-sm mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to shopping
        </Link>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-snap-card border border-snap-border">
              <img
                src={product.image || product.images?.[0] || '/placeholder.png'}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.slice(0, 6).map((img, i) => (
                  <button key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-snap-border flex-shrink-0">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {product.badge && (
              <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${
                product.badge === 'sale' ? 'bg-red-500 text-white' :
                product.badge === 'hot' ? 'bg-orange-500 text-white' :
                'bg-snap-accent text-white'
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
              <span className="text-snap-accent text-3xl font-bold">${product.price.toFixed(2)}</span>
              {product.originalPrice > product.price && (
                <span className="text-snap-muted text-lg line-through">${product.originalPrice.toFixed(2)}</span>
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

            <AddToCartButton product={product} />

            <div className="pt-4 border-t border-snap-border">
              <div className="flex items-center gap-2 text-sm text-snap-muted">
                <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-400' : 'bg-red-400'}`} />
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
