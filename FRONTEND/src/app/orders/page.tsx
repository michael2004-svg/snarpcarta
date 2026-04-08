'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface OrderItem {
  id: string
  quantity: number
  priceAtPurchase: number
  products: {
    id: string
    title: string
    image: string
  } | null
}

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  paymentMethod: string
  createdAt: string
  order_items: OrderItem[]
}

const statusColors: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  processing: 'text-yellow-400 bg-yellow-400/10',
  paid: 'text-blue-400 bg-blue-400/10',
  shipped: 'text-blue-400 bg-blue-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
  refunded: 'text-red-400 bg-red-400/10',
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const params = new URLSearchParams({ userId: user.id })
        const res = await fetch(`/api/orders?${params}`)
        const data = await res.json()

        if (res.ok && data.orders) {
          setOrders(data.orders)
        }
      } catch (err) {
        console.error('Failed to fetch orders', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  if (loading) {
    return (
      <main className="pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-snap-accent" />
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center">
          <h1 className="font-display text-3xl font-bold text-snap-text mb-4">Sign In Required</h1>
          <p className="text-snap-muted mb-6">Please sign in to view your orders.</p>
          <Link href="/auth/login" className="btn-accent">Sign In</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <h1 className="font-display text-4xl font-bold text-snap-text mb-8">MY ORDERS</h1>
        
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-snap-muted text-lg mb-6">You haven't placed any orders yet.</p>
            <Link href="/" className="btn-accent">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-snap-card rounded-2xl border border-snap-border overflow-hidden">
                <div className="p-5 flex items-center justify-between border-b border-snap-border">
                  <div>
                    <span className="text-snap-text font-mono font-bold">{order.orderNumber}</span>
                    <span className="text-snap-muted text-sm ml-4">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                    <span className="text-snap-accent font-bold">${order.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex gap-4 overflow-x-auto">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-snap-surface">
                          {item.products?.image ? (
                            <img
                              src={item.products.image}
                              alt={item.products.title || ''}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-snap-muted text-xs">
                              No image
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-snap-muted mt-1 truncate max-w-20">
                          {item.quantity}x
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}