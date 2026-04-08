'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    router.push('/')
  }

  return (
    <main className="pt-20 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-snap-card rounded-2xl border border-snap-border p-8">
          <h1 className="font-display text-3xl font-bold text-snap-text text-center mb-2">Welcome Back</h1>
          <p className="text-snap-muted text-center text-sm mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-snap-muted text-xs mb-1 block">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full bg-snap-surface border border-snap-border rounded-lg px-4 py-3 text-snap-text focus:outline-none focus:border-snap-accent"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-snap-muted text-xs mb-1 block">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-snap-surface border border-snap-border rounded-lg px-4 py-3 text-snap-text focus:outline-none focus:border-snap-accent"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-snap-muted text-sm text-center mt-6">
            Don't have an account? <Link href="/auth/register" className="text-snap-accent hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </main>
  )
}