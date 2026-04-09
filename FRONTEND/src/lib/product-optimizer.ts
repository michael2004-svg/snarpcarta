// lib/product-optimizer.ts
import type { DBScrapedProduct } from './scraped-products'

export interface OptimizedProduct {
  title: string
  price: number
  originalPrice: number
  description: string
  images: string[]
  badge: 'hot' | 'new' | 'sale' | null
  categoryId: string | null
  inStock: boolean
}

export interface OptimizerResult {
  status: 'success' | 'skipped'
  product?: OptimizedProduct
  reason?: string
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  electronics: ['wireless', 'bluetooth', 'earbuds', 'headphone', 'speaker', 'charger', 'cable', 'usb', 'led', 'smart', 'watch', 'camera', 'drone'],
  fashion: ['shirt', 'dress', 'pants', 'jacket', 'shoes', 'sneakers', 'boots', 'hat', 'cap', 'scarf', 'bag', 'wallet', 'watch', 'jewelry'],
  home: ['pillow', 'blanket', 'curtain', 'rug', 'lamp', 'candle', 'vase', 'kitchen', 'storage', 'organizer'],
  fitness: ['yoga', 'fitness', 'gym', 'workout', 'running', 'sports', 'bike', 'cycling', 'weight', 'dumbbell'],
  gadgets: ['phone', 'tablet', 'laptop', 'computer', 'keyboard', 'mouse', 'gaming', 'controller', 'tools'],
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

function hasWatermark(url: string): boolean {
  const watermarks = ['watermark', 'water-mark', 'logo', 'brand']
  return watermarks.some(w => url.toLowerCase().includes(w))
}

function cleanTitle(title: string | null): string {
  if (!title) return ''

  let cleaned = title
    .replace(/[🔥💰🔥⭐️🌟✨📦🛒🚚💨🎁🎉]/g, '')
    .replace(/\b(HOT SALE|NEW ARRIVAL|BEST SELLING|TOP RATED|🔥|💰)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  cleaned = cleaned.replace(/\b(AliExpress|Alibaba|Shopify|WooCommerce|Dropship)\b/gi, '')

  if (cleaned.length > 80) {
    cleaned = cleaned.substring(0, 77) + '...'
  }

  return cleaned
}

function calculateSellingPrice(price: number): number {
  let multiplier: number

  if (price < 10) {
    multiplier = 2.5
  } else if (price < 50) {
    multiplier = 1.8
  } else {
    multiplier = 1.5
  }

  const rawPrice = price * multiplier
  const rounded = Math.floor(rawPrice)
  return rounded - 0.01 + 0.99
}

function optimizeDescription(
  title: string,
  originalDesc: string | null,
  rating: number | null,
  reviewCount: number | null
): string {
  const parts: string[] = []

  const keyMatch = title.match(/^(.+?)(?:\s+with|\s+-\s*)/i)
  const productType = keyMatch ? keyMatch[1] : title.split(' ').slice(0, 3).join(' ')

  parts.push(`Premium ${productType} - designed for everyday convenience and reliable performance.`)

  const benefits: string[] = []

  if (title.toLowerCase().includes('bluetooth') || title.toLowerCase().includes('wireless')) {
    benefits.push(' Seamless wireless connectivity')
    benefits.push(' Easy pairing with any device')
  }
  if (title.toLowerCase().includes('waterproof') || title.toLowerCase().includes('water resistant')) {
    benefits.push(' Water-resistant design for outdoor use')
  }
  if (title.toLowerCase().includes('battery') || title.toLowerCase().includes('charge')) {
    benefits.push(' Long-lasting battery life')
  }
  if (title.toLowerCase().includes('noise') || title.toLowerCase().includes('cancel')) {
    benefits.push(' Enhanced noise reduction')
  }

  if (benefits.length > 0) {
    parts.push('Key Benefits:')
    benefits.forEach(b => parts.push('•' + b))
  }

  parts.push('Features:')
  parts.push('• Durable construction')
  parts.push('• Easy to use')
  parts.push('• Modern design')

  if (rating && rating > 0) {
    const ratingText = rating >= 4.5 ? 'Excellent' : rating >= 4 ? 'Great' : 'Good'
    parts.push(`${ratingText} quality - rated ${rating.toFixed(1)} stars`)
  }

  if (reviewCount && reviewCount > 100) {
    parts.push(`Trusted by ${reviewCount.toLocaleString()}+ happy customers`)
  }

  parts.push('Order now and elevate your experience!')

  const fullDesc = parts.join('\n')
  if (fullDesc.length > 300 * 4) {
    return fullDesc.substring(0, 1200) + '...'
  }

  return fullDesc
}

function selectBestImages(images: string[]): string[] {
  if (!images || images.length === 0) return []

  const validImages = images
    .filter(img => img && typeof img === 'string' && isValidUrl(img) && !hasWatermark(img))

  const uniqueImages = Array.from(new Set(validImages))

  return uniqueImages.slice(0, 5)
}

function assignBadge(reviewCount: number | null, scrapedAt: string | null): 'hot' | 'new' | 'sale' | null {
  if (reviewCount && reviewCount > 500) {
    return 'hot'
  }

  if (scrapedAt) {
    const scrapedDate = new Date(scrapedAt)
    const daysSince = (Date.now() - scrapedDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < 3) {
      return 'new'
    }
  }

  return null
}

function classifyCategory(title: string, description: string | null): string | null {
  const text = (title + ' ' + (description || '')).toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category
      }
    }
  }

  return null
}

export function validateAndOptimizeProduct(scraped: DBScrapedProduct): OptimizerResult {
  const title = cleanTitle(scraped.title)
  if (!title || title.length < 3) {
    return { status: 'skipped', reason: 'Invalid or empty title' }
  }

  const basePrice = scraped.price_min ?? scraped.price_max ?? 0
  if (basePrice <= 0) {
    return { status: 'skipped', reason: 'Invalid price' }
  }

  const images = selectBestImages(scraped.images)
  if (images.length === 0) {
    return { status: 'skipped', reason: 'No valid images' }
  }

  const rating = scraped.rating ?? 0
  if (rating < 0 || rating > 5) {
    return { status: 'skipped', reason: 'Invalid rating' }
  }

  const reviewCount = scraped.review_count ?? 0
  if (reviewCount < 0) {
    return { status: 'skipped', reason: 'Invalid review count' }
  }

  const sellingPrice = calculateSellingPrice(basePrice)
  const originalPrice = basePrice > sellingPrice ? calculateSellingPrice(basePrice * 1.2) : sellingPrice + 10

  const discount = originalPrice > sellingPrice
    ? ((originalPrice - sellingPrice) / originalPrice) * 100
    : 0

  let badge = assignBadge(reviewCount, scraped.scraped_at)
  if (discount > 30 && !badge) {
    badge = 'sale'
  }

  const categoryId = classifyCategory(title, scraped.description)

  const description = optimizeDescription(title, scraped.description, rating, reviewCount)

  const inStock = scraped.in_stock ?? true

  return {
    status: 'success',
    product: {
      title,
      price: sellingPrice,
      originalPrice: Math.round(originalPrice * 100) / 100,
      description,
      images,
      badge,
      categoryId,
      inStock,
    },
  }
}

export function applyOverrides(
  optimized: OptimizedProduct,
  overrides: { title?: string; price?: number; originalPrice?: number; description?: string; badge?: 'hot' | 'new' | 'sale' | null; inStock?: boolean; categoryId?: string | null }
): OptimizedProduct {
  return {
    ...optimized,
    title: overrides.title?.trim() || optimized.title,
    price: overrides.price != null && overrides.price > 0 ? overrides.price : optimized.price,
    originalPrice: overrides.originalPrice != null && overrides.originalPrice > 0 ? overrides.originalPrice : optimized.originalPrice,
    description: overrides.description?.trim() || optimized.description,
    badge: overrides.badge !== undefined ? overrides.badge : optimized.badge,
    inStock: overrides.inStock !== undefined ? overrides.inStock : optimized.inStock,
    categoryId: overrides.categoryId !== undefined ? overrides.categoryId : optimized.categoryId,
  }
}