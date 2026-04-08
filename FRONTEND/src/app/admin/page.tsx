import { Package, ShoppingCart, DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getProducts } from '@/lib/products'

const stats = [
  { icon: DollarSign, label: 'Total Revenue', value: '$12,480', change: '+18%', positive: true },
  { icon: ShoppingCart, label: 'Total Orders', value: '342', change: '+12%', positive: true },
  { icon: Package, label: 'Products', value: '128', change: '+5', positive: true },
  { icon: Users, label: 'Customers', value: '1,240', change: '+24%', positive: true },
]

export default async function AdminPage() {
  const products = await getProducts()

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-snap-text">ADMIN DASHBOARD</h1>
            <p className="text-snap-muted text-sm mt-1">Snapcarta Control Panel</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/products" className="btn-ghost text-sm">Manage Products</Link>
            <Link href="/admin/orders" className="btn-accent text-sm">View Orders</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(stat => (
            <div key={stat.label} className="bg-snap-card rounded-2xl p-5 border border-snap-border">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-snap-accent" />
                <span className={`text-xs font-semibold ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>{stat.change}</span>
              </div>
              <p className="font-display text-2xl font-bold text-snap-text">{stat.value}</p>
              <p className="text-snap-muted text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-snap-card rounded-2xl border border-snap-border overflow-hidden">
          <div className="p-5 border-b border-snap-border flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-snap-text">PRODUCT INVENTORY</h2>
            <Link href="/admin/products" className="text-snap-accent text-sm hover:underline">Manage all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-snap-border">
                  {['Product', 'Category', 'Price', 'Stock', 'Badge'].map(h => (
                    <th key={h} className="text-left text-snap-muted text-xs font-semibold px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-snap-border hover:bg-snap-surface transition-colors">
                    <td className="px-5 py-3 text-snap-text font-medium max-w-xs truncate">{p.title}</td>
                    <td className="px-5 py-3 text-snap-muted">{p.category}</td>
                    <td className="px-5 py-3 text-snap-accent font-bold">${p.price}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.inStock ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                        {p.inStock ? 'In Stock' : 'Out'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-snap-muted capitalize">{p.badge || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
