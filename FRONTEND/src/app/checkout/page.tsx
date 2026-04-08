'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import Link from 'next/link'
import { Loader2, CheckCircle } from 'lucide-react'

export default function CheckoutPage() {
  const { state, total, dispatch } = useCart()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Kenya',
    paymentMethod: 'mpesa',
  })

  if (success) {
    return (
      <main className="pt-20 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold text-snap-text mb-4">Order Placed!</h1>
          <p className="text-snap-muted mb-8">Thank you for your order. We'll send you a confirmation shortly.</p>
          <Link href="/" className="btn-accent">Continue Shopping</Link>
        </div>
      </main>
    )
  }

  if (state.items.length === 0) {
    return (
      <main className="pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-snap-text mb-4">Your cart is empty</h1>
          <Link href="/" className="btn-accent">Continue Shopping</Link>
        </div>
      </main>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    dispatch({ type: 'CLEAR' })
    setSuccess(true)
    setLoading(false)
  }

  return (
    <main className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <h1 className="font-display text-3xl font-bold text-snap-text mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-snap-card rounded-2xl border border-snap-border p-6">
              <h2 className="font-display text-lg font-bold text-snap-text mb-4">Contact Info</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="First Name"
                  className="bg-snap-surface border border-snap-border rounded-lg px-4 py-3 text-snap-text focus:outline-none focus:border-snap-accent"
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                />
                <input
                  required
                  placeholder="Last Name"
                  className="bg-snap-surface border border-snap-border rounded-lg px-4 py-3 text-snap-text focus:outline-none focus:border-snap-accent"
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  className="bg-snap-surface border border-snap-border rounded-lg px-4 py-3 text-snap-text focus:outline-none focus:border-snap-accent"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
                <input
                  required
                  placeholder="Phone"
                  className="bg-snap-surface border border-snap-border rounded-lg px-4 py-3 text-snap-text focus:outline-none focus:border-snap-accent"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-snap-card rounded-2xl border border-snap-border p-6">
              <h2 className="font-display text-lg font-bold text-snap-text mb-4">Shipping Address</h2>
              <div className="space-y-4">
                <input
                  required
                  placeholder="Address"
                  className="w-full bg-snap-surface border border-snap-border rounded-lg px-4 py-3 text-snap-text focus:outline-none focus:border-snap-accent"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    required
                    placeholder="City"
                    className="bg-snap-surface border border-snap-border rounded-lg px-4 py-3 text-snap-text focus:outline-none focus:border-snap-accent"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                  />
                  <select
                    className="bg-snap-surface border border-snap-border rounded-lg px-4 py-3 text-snap-text focus:outline-none focus:border-snap-accent"
                    value={form.country}
                    onChange={e => setForm({ ...form, country: e.target.value })}
                  >
                    <option value="Kenya">Kenya</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-snap-card rounded-2xl border border-snap-border p-6">
              <h2 className="font-display text-lg font-bold text-snap-text mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-snap-border cursor-pointer hover:border-snap-accent">
                  <input type="radio" name="payment" value="mpesa" checked={form.paymentMethod === 'mpesa'} onChange={() => setForm({ ...form, paymentMethod: 'mpesa' })} className="text-snap-accent" />
                  <span className="text-snap-text">M-Pesa</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-snap-border cursor-pointer hover:border-snap-accent">
                  <input type="radio" name="payment" value="stripe" checked={form.paymentMethod === 'stripe'} onChange={() => setForm({ ...form, paymentMethod: 'stripe' })} className="text-snap-accent" />
                  <span className="text-snap-text">Card (Stripe)</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-snap-border cursor-pointer hover:border-snap-accent">
                  <input type="radio" name="payment" value="cod" checked={form.paymentMethod === 'cod'} onChange={() => setForm({ ...form, paymentMethod: 'cod' })} className="text-snap-accent" />
                  <span className="text-snap-text">Cash on Delivery</span>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-snap-card rounded-2xl border border-snap-border p-6 sticky top-24">
              <h2 className="font-display text-lg font-bold text-snap-text mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {state.items.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-snap-muted">{item.quantity}x {item.product.title.substring(0, 25)}...</span>
                    <span className="text-snap-text">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-snap-border pt-3 flex justify-between font-bold mb-6">
                <span className="text-snap-text">Total</span>
                <span className="text-snap-accent text-xl">${total.toFixed(2)}</span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-accent w-full flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}