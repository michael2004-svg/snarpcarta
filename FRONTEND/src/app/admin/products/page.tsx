// app/admin/products/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Package, Plus, Loader2, CheckCircle, XCircle, RefreshCw, ExternalLink, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

interface ScrapedProduct {
  id: string
  source_url: string
  aliexpress_id: string | null
  title: string | null
  price_min: number | null
  price_max: number | null
  currency: string
  images: string[]
  description: string | null
  variants: { name: string; value: string }[]
  rating: number | null
  review_count: number | null
  seller_name: string | null
  in_stock: boolean
  status: 'pending' | 'added' | 'skipped'
  scraped_at: string
}

type FilterTab = 'all' | 'pending' | 'added' | 'skipped'

export default function AdminProductsPage() {
  const [urlInput, setUrlInput] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeResult, setScrapeResult] = useState<{ scraped: number; saved: number; failed: { url: string; error: string }[] } | null>(null)
  const [products, setProducts] = useState<ScrapedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editProduct, setEditProduct] = useState<ScrapedProduct | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    price: '',
    originalPrice: '',
    description: '',
  })

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = activeTab !== 'all' ? `?status=${activeTab}` : ''
      const res = await fetch(`/api/scraped-products${params}`)
      const data = await res.json()
      if (res.ok && data.products) {
        setProducts(data.products)
      } else {
        console.error('Failed to load products:', data.error || data)
        setProducts([])
      }
    } catch (err) {
      console.error('Failed to load products', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  async function handleScrape() {
    const urls = urlInput
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0)

    if (!urls.length) return

    setScraping(true)
    setScrapeResult(null)

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      })
      const data = await res.json()
      
      let failed: { url: string; error: string }[] = []
      if (data.failed && Array.isArray(data.failed)) {
        failed = data.failed.map((f: any) => ({
          url: f.url || '',
          error: f.error?.message || f.error?.toString() || String(f.error || ''),
        }))
      }
      
      setScrapeResult({ scraped: data.scraped || 0, saved: data.saved || 0, failed })
      if (data.success) {
        setUrlInput('')
        await fetchProducts()
      }
    } catch (err) {
      console.error('Scrape failed', err)
    } finally {
      setScraping(false)
    }
  }

  function openEdit(p: ScrapedProduct) {
    setEditError(null)
    setEditProduct(p)

    const basePrice = p.price_min ?? p.price_max ?? 0
    const derivedOriginal = p.price_max != null && p.price_max > basePrice ? p.price_max : basePrice

    setEditForm({
      title: p.title || '',
      price: basePrice ? String(basePrice) : '',
      originalPrice: derivedOriginal ? String(derivedOriginal) : '',
      description: p.description || '',
    })
    setEditOpen(true)
  }

  function closeEdit() {
    setEditOpen(false)
    setEditProduct(null)
    setEditError(null)
  }

  async function handlePublish() {
    if (!editProduct) return
    const price = parseFloat(editForm.price)
    if (!price || price <= 0) {
      setEditError('Enter a valid price')
      return
    }

    const originalPrice = editForm.originalPrice ? parseFloat(editForm.originalPrice) : undefined
    const overrides = {
      title: editForm.title.trim(),
      price,
      originalPrice: originalPrice && originalPrice > 0 ? originalPrice : undefined,
      description: editForm.description.trim(),
    }

    await handleAction(editProduct.id, 'publish', overrides)
    closeEdit()
  }

  async function handleAction(id: string, action: 'publish' | 'skip' | 'reset', overrides?: any) {
    setActionLoading(id + action)
    try {
      const res = await fetch('/api/scraped-products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, overrides }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || data?.error) {
        let message = 'Action failed'
        if (typeof data?.error === 'string') {
          message = data.error
        } else if (data?.error?.message) {
          message = typeof data.error.message === 'string' ? data.error.message : JSON.stringify(data.error.message)
        } else if (data?.message) {
          message = typeof data.message === 'string' ? data.message : JSON.stringify(data.message)
        }
        alert(message)
        return
      }

      if (data.success) {
        await fetchProducts()
      } else {
        alert('Action failed')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      alert(message)
    } finally {
      setActionLoading(null)
    }
  }

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'added', label: 'Added' },
    { id: 'skipped', label: 'Skipped' },
  ]

  const counts = {
    all: products.length,
    pending: products.filter(p => p.status === 'pending').length,
    added: products.filter(p => p.status === 'added').length,
    skipped: products.filter(p => p.status === 'skipped').length,
  }

  const displayedProducts = activeTab === 'all' ? products : products.filter(p => p.status === activeTab)

  function formatPrice(p: ScrapedProduct) {
    const sym = p.currency === 'USD' ? '$' : p.currency + ' '
    if (p.price_min != null && p.price_max != null && p.price_min !== p.price_max) {
      return `${sym}${p.price_min.toFixed(2)} - ${sym}${p.price_max.toFixed(2)}`
    }
    if (p.price_min != null) return `${sym}${p.price_min.toFixed(2)}`
    return '-'
  }

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-snap-text">MANAGE PRODUCTS</h1>
            <p className="text-snap-muted text-sm mt-1">Scrape from AliExpress and publish to your catalog</p>
          </div>
          <Link href="/admin" className="btn-ghost text-sm">&lt;- Dashboard</Link>
        </div>

        {/* Scraper Panel */}
        <div className="bg-snap-card rounded-2xl border border-snap-border p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-snap-accent" />
            <h2 className="font-display text-lg font-bold text-snap-text">SCRAPE PRODUCTS</h2>
          </div>
          <p className="text-snap-muted text-sm mb-4">
            Paste one or more AliExpress product URLs (one per line). Products will be scraped and queued for review.
          </p>
          <textarea
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder={`https://www.aliexpress.com/item/1005006789012345.html\nhttps://www.aliexpress.com/item/1005001234567890.html`}
            rows={4}
            className="w-full bg-snap-surface border border-snap-border rounded-xl px-4 py-3 text-snap-text text-sm placeholder:text-snap-muted focus:outline-none focus:border-snap-accent resize-none font-mono"
          />
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleScrape}
              disabled={scraping || !urlInput.trim()}
              className="btn-accent text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scraping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Scrape Products
                </>
              )}


            </button>
            {urlInput && (
              <span className="text-snap-muted text-xs">
                {urlInput.split('\n').filter(l => l.trim()).length} URL(s) queued
              </span>
            )}
          </div>

          {/* Scrape result feedback */}
          {scrapeResult && (
            <div className="mt-4 p-4 rounded-xl bg-snap-surface border border-snap-border text-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {scrapeResult.saved} saved
                </span>
                <span className="text-snap-muted">
                  {scrapeResult.scraped} scraped
                </span>
                {scrapeResult.failed.length > 0 && (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {scrapeResult.failed.length} failed
                  </span>
                )}
              </div>
              {scrapeResult.failed.length > 0 && (
                <div className="mt-2 space-y-1">
                  {scrapeResult.failed.map((f, i) => (
                    <p key={i} className="text-red-400 text-xs font-mono truncate">
                      x {f.url}: {f.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Queue */}
        <div className="bg-snap-card rounded-2xl border border-snap-border overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-snap-border px-5 pt-4">
            <div className="flex gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? 'text-snap-accent border-b-2 border-snap-accent'
                      : 'text-snap-muted hover:text-snap-text'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs opacity-60">({counts[tab.id]})</span>
                </button>
              ))}
            </div>
            <button
              onClick={fetchProducts}
              className="text-snap-muted hover:text-snap-text transition-colors p-2"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-snap-accent" />
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="p-10 text-center text-snap-muted text-sm">
              {activeTab === 'all'
                ? 'No scraped products yet. Paste URLs above to get started.'
                : `No ${activeTab} products.`}
            </div>
          ) : (
            <div className="divide-y divide-snap-border">
              {displayedProducts.map(p => (
                <div key={p.id} className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-snap-surface flex-shrink-0 border border-snap-border">
                      {p.images[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.title || ''}
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-snap-muted" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-snap-text font-semibold text-sm leading-tight truncate max-w-lg">
                            {p.title || 'Untitled product'}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-snap-accent font-bold text-sm">{formatPrice(p)}</span>
                            {p.seller_name && (
                              <span className="text-snap-muted text-xs">by {p.seller_name}</span>
                            )}
                            {p.rating && (
                              <span className="text-snap-muted text-xs">* {p.rating} ({p.review_count?.toLocaleString() || 0})</span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              p.in_stock ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                            }`}>
                              {p.in_stock ? 'In Stock' : 'Out'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              p.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                              p.status === 'added' ? 'bg-green-400/10 text-green-400' :
                              'bg-snap-muted/10 text-snap-muted'
                            }`}>
                              {p.status}
                            </span>
                            <span className="text-snap-muted text-xs">
                              {p.images.length} image{p.images.length !== 1 ? 's' : ''}
                              {p.variants.length > 0 && ` - ${new Set(p.variants.map(v => v.name)).size} variant type(s)`}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a
                            href={p.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-snap-muted hover:text-snap-accent transition-colors"
                            title="View on AliExpress"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                            className="p-1.5 text-snap-muted hover:text-snap-text transition-colors"
                            title="Toggle details"
                          >
                            {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          {p.status === 'pending' && (
                            <>
                              <button
                                onClick={() => openEdit(p)}
                                disabled={actionLoading === p.id + 'publish'}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-snap-accent/10 text-snap-accent text-xs font-semibold hover:bg-snap-accent/20 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === p.id + 'publish' ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                                Add to Store
                              </button>
                              <button
                                onClick={() => handleAction(p.id, 'skip')}
                                disabled={actionLoading === p.id + 'skip'}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 text-xs font-semibold hover:bg-red-400/20 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" />
                                Skip
                              </button>
                            </>
                          )}

                          {(p.status === 'added' || p.status === 'skipped') && (
                            <button
                              onClick={() => handleAction(p.id, 'reset')}
                              disabled={actionLoading === p.id + 'reset'}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-snap-surface text-snap-muted text-xs font-semibold hover:text-snap-text transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === p.id && (
                    <div className="mt-4 pl-20 space-y-4">
                      {/* Image strip */}
                      {p.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {p.images.slice(0, 8).map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt=""
                              className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-snap-border"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          ))}
                          {p.images.length > 8 && (
                            <div className="w-14 h-14 rounded-lg border border-snap-border flex items-center justify-center text-snap-muted text-xs flex-shrink-0">
                              +{p.images.length - 8}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Variants */}
                      {p.variants.length > 0 && (
                        <div>
                          <p className="text-snap-muted text-xs font-semibold mb-2">VARIANTS</p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(
                              p.variants.reduce((acc, v) => {
                                if (!acc[v.name]) acc[v.name] = []
                                acc[v.name].push(v.value)
                                return acc
                              }, {} as Record<string, string[]>)
                            ).map(([name, values]) => (
                              <div key={name} className="text-xs text-snap-muted">
                                <span className="font-semibold text-snap-text">{name}:</span>{' '}
                                {values.slice(0, 5).join(', ')}
                                {values.length > 5 && ` +${values.length - 5} more`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {p.description && (
                        <div>
                          <p className="text-snap-muted text-xs font-semibold mb-1">DESCRIPTION</p>
                          <p className="text-snap-muted text-xs leading-relaxed line-clamp-3">
                            {p.description}
                          </p>
                        </div>
                      )}

                      {p.affiliate_url && (
                        <div>
                          <p className="text-snap-muted text-xs font-semibold mb-1">AFFILIATE LINK</p>
                          <a
                            href={p.affiliate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-snap-accent text-xs break-all"
                          >
                            Open affiliate link
                          </a>
                        </div>
                      )}


                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      {editOpen && editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg bg-snap-card rounded-2xl border border-snap-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-snap-text">Edit Before Publish</h3>
              <button onClick={closeEdit} className="text-snap-muted hover:text-snap-text">x</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-snap-muted text-xs mb-1 block">Product Name</label>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-snap-surface border border-snap-border rounded-lg px-3 py-2 text-sm text-snap-text focus:outline-none focus:border-snap-accent"
                  placeholder="Enter product title"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-snap-muted text-xs mb-1 block">Price (USD)</label>
                  <input
                    value={editForm.price}
                    onChange={e => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-snap-surface border border-snap-border rounded-lg px-3 py-2 text-sm text-snap-text focus:outline-none focus:border-snap-accent"
                    placeholder="29.99"
                  />
                </div>
                <div>
                  <label className="text-snap-muted text-xs mb-1 block">Original Price</label>
                  <input
                    value={editForm.originalPrice}
                    onChange={e => setEditForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                    className="w-full bg-snap-surface border border-snap-border rounded-lg px-3 py-2 text-sm text-snap-text focus:outline-none focus:border-snap-accent"
                    placeholder="39.99"
                  />
                </div>
              </div>
              <div>
                <label className="text-snap-muted text-xs mb-1 block">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-snap-surface border border-snap-border rounded-lg px-3 py-2 text-sm text-snap-text focus:outline-none focus:border-snap-accent resize-none"
                  placeholder="Optional description"
                />
              </div>
            </div>
            {editError && (
              <p className="text-red-400 text-xs mt-2">{editError}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={closeEdit} className="btn-ghost text-sm">Cancel</button>
              <button onClick={handlePublish} className="btn-accent text-sm">Add to Store</button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
















