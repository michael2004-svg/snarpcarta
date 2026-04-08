'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await signUp(form.email, form.password)
    
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-snap-card rounded-2xl border border-snap-border p-8">
            <h1 className="font-display text-3xl font-bold text-snap-text mb-4">Check Your Email</h1>
            <p className="text-snap-muted mb-6">
              We've sent you a confirmation link to <strong className="text-snap-text">{form.email}</strong>.
              Click the link to activate your account.
            </p>
            <Link href="/auth/login" className="btn-ghost">Back to Login</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-20 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-snap-card rounded-2xl border border-snap-border p-8">
          <h1 className="font-display text-3xl font-bold text-snap-text text-center mb-2">Create Account</h1>
          <p className="text-snap-muted text-center text-sm mb-8">Join Snapcarta today</p>

          {error && (
            <div className="bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-6 text-red-400 text-sm">
              {error}
            </div>
          )}

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
                minLength={6}
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-snap-muted text-sm text-center mt-6">
            Already have an account? <Link href="/auth/login" className="text-snap-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}