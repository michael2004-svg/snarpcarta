import Link from 'next/link'

const orders = [
  { id: 'SC-10234', customer: 'John Doe', date: '2026-04-01', total: 79.97, status: 'shipped', items: 2, method: 'Stripe' },
  { id: 'SC-10233', customer: 'Jane Smith', date: '2026-04-01', total: 49.99, status: 'processing', items: 1, method: 'M-Pesa' },
  { id: 'SC-10232', customer: 'Ali Hassan', date: '2026-03-31', total: 129.98, status: 'delivered', items: 3, method: 'PayPal' },
]

const statusColors = { processing: 'text-yellow-400 bg-yellow-400/10', shipped: 'text-blue-400 bg-blue-400/10', delivered: 'text-green-400 bg-green-400/10', cancelled: 'text-red-400 bg-red-400/10' }

export default function AdminOrdersPage() {
  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl font-bold text-snap-text">ALL ORDERS</h1>
          <Link href="/admin" className="btn-ghost text-sm">← Dashboard</Link>
        </div>
        <div className="bg-snap-card rounded-2xl border border-snap-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-snap-border">
                  {['Order ID', 'Customer', 'Date', 'Items', 'Payment', 'Total', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left text-snap-muted text-xs font-semibold px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-snap-border hover:bg-snap-surface transition-colors">
                    <td className="px-5 py-4 text-snap-text font-mono font-bold">{o.id}</td>
                    <td className="px-5 py-4 text-snap-text">{o.customer}</td>
                    <td className="px-5 py-4 text-snap-muted">{o.date}</td>
                    <td className="px-5 py-4 text-snap-muted">{o.items}</td>
                    <td className="px-5 py-4 text-snap-muted">{o.method}</td>
                    <td className="px-5 py-4 text-snap-accent font-bold">${o.total.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[o.status as keyof typeof statusColors]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button className="text-snap-accent text-xs hover:underline">View</button>
                    </td>
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
