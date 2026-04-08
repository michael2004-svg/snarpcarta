import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-snap-border mt-20 py-10 bg-snap-bg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-snap-accent" />
          <span className="font-display text-lg font-bold text-snap-text">SNAPCARTA</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-snap-muted">
          <Link href="/" className="hover:text-snap-text transition-colors">Home</Link>
          <Link href="/orders" className="hover:text-snap-text transition-colors">Orders</Link>
          <Link href="/admin" className="hover:text-snap-text transition-colors">Admin</Link>
          <Link href="/auth/login" className="hover:text-snap-text transition-colors">Login</Link>
        </nav>
        <p className="text-snap-muted text-xs">&copy; {new Date().getFullYear()} Snapcarta. All rights reserved.</p>
      </div>
    </footer>
  )
}
