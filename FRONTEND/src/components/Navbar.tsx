'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X, Zap, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const { itemCount, dispatch } = useCart()
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-snap-bg/90 backdrop-blur-md border-b border-snap-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-snap-accent" />
          <span className="font-display text-xl font-bold text-snap-text tracking-tight">SNAPCARTA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-snap-muted hover:text-snap-text transition-colors">Home</Link>
          {user && <Link href="/orders" className="text-snap-muted hover:text-snap-text transition-colors">Orders</Link>}
          <Link href="/admin" className="text-snap-muted hover:text-snap-text transition-colors">Admin</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: 'OPEN' })}
            className="relative p-2 text-snap-muted hover:text-snap-text transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-snap-accent text-white text-xs rounded-full flex items-center justify-center font-bold">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
          {user ? (
            <button
              onClick={() => signOut()}
              className="hidden md:flex items-center gap-2 text-sm text-snap-muted hover:text-snap-text transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <Link href="/auth/login" className="hidden md:block btn-ghost text-sm">Login</Link>
          )}
          <button
            className="md:hidden p-2 text-snap-muted hover:text-snap-text"
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-snap-bg border-t border-snap-border px-4 py-4 flex flex-col gap-4">
          <Link href="/" className="text-snap-text font-medium" onClick={() => setMenuOpen(false)}>Home</Link>
          {user && <Link href="/orders" className="text-snap-text font-medium" onClick={() => setMenuOpen(false)}>Orders</Link>}
          <Link href="/admin" className="text-snap-text font-medium" onClick={() => setMenuOpen(false)}>Admin</Link>
          {user ? (
            <button onClick={() => signOut()} className="text-snap-text font-medium text-left">Sign Out</button>
          ) : (
            <Link href="/auth/login" className="text-snap-text font-medium" onClick={() => setMenuOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </header>
  )
}