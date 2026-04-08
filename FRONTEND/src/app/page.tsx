import ProductRow from '@/components/ProductRow'
import HeroBanner from '@/components/HeroBanner'
import { getProducts, getTrending, getNewArrivals, getSaleItems } from '@/lib/products'

export default async function HomePage() {
  const [trending, newArrivals, saleItems, allProducts] = await Promise.all([
    getTrending().catch(() => []),
    getNewArrivals().catch(() => []),
    getSaleItems().catch(() => []),
    getProducts().catch(() => []),
  ])

  return (
    <main className="min-h-screen">
      <HeroBanner />
      {trending.length > 0 && <ProductRow title="Trending Now" products={trending} />}
      {newArrivals.length > 0 && <ProductRow title="New Arrivals" products={newArrivals} />}
      {saleItems.length > 0 && <ProductRow title="On Sale" products={saleItems} />}
      {allProducts.length === 0 && trending.length === 0 && (
        <div className="text-center py-20 text-snap-muted text-lg">
          No products yet. Visit <a href="/admin/products" className="text-snap-accent underline">admin</a> to import products.
        </div>
      )}
    </main>
  )
}
