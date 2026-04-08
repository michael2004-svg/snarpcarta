// lib/scraper.ts
// AliExpress product scraper using fetch + cheerio
// Targets window.runParams and structured JSON first, falls back to HTML selectors

import * as cheerio from 'cheerio'

export interface ScrapedVariant {
  name: string
  value: string
  price?: number
  image?: string
  available?: boolean
}

export interface ScrapedProduct {
  source_url: string
  aliexpress_id: string | null
  title: string | null
  price_min: number | null
  price_max: number | null
  currency: string
  images: string[]
  description: string | null
  variants: ScrapedVariant[]
  rating: number | null
  review_count: number | null
  seller_name: string | null
  in_stock: boolean
  affiliate_url: string | null
  raw_data?: Record<string, unknown>
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractAliId(url: string): string | null {
  const match = url.match(/item\/(\d+)\.html/) || url.match(/\/(\d+)\.html/)
  return match ? match[1] : null
}

function buildAffiliateUrl(url: string): string {
  // If you have an AliExpress affiliate ID, inject it here
  // For now just clean + return canonical URL
  try {
    const u = new URL(url)
    u.searchParams.delete('aff_fcid')
    u.searchParams.delete('aff_fsk')
    u.searchParams.delete('aff_platform')
    // Uncomment and set your affiliate ID:
    // u.searchParams.set('aff_trace_key', 'YOUR_AFFILIATE_KEY')
    return u.toString()
  } catch {
    return url
  }
}

function safeParseFloat(val: unknown): number | null {
  if (val == null) return null
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? null : n
}

function dedupeImages(images: string[]): string[] {
  const seen = new Set<string>()
  return images
    .map(img => {
      // Upscale to 800x800 if AliExpress CDN image
      return img
        .replace(/_\d+x\d+\.(jpg|jpeg|png|webp)/i, '_800x800.$1')
        .replace(/\.jpg_\d+x\d+\.jpg/, '.jpg_800x800.jpg')
    })
    .filter(img => {
      if (!img || seen.has(img)) return false
      seen.add(img)
      return true
    })
}

// ─── Main JSON data extraction (window.runParams) ───────────────────────────

function extractRunParams(html: string): Record<string, unknown> | null {
  // AliExpress embeds product data in window.runParams = {...}
  const patterns = [
    /window\.runParams\s*=\s*(\{[\s\S]*?\});\s*(?:var|window|$)/,
    /runParams\s*=\s*(\{[\s\S]*?\});/,
    /"data"\s*:\s*(\{[\s\S]*?"productId"[\s\S]*?\})\s*[,}]/,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) {
      try {
        return JSON.parse(match[1])
      } catch {
        // try to extract the data sub-key
        try {
          const inner = match[1].match(/"data"\s*:\s*(\{[\s\S]+)/)
          if (inner) return JSON.parse(inner[1].replace(/\}\s*$/, '}'))
        } catch {
          continue
        }
      }
    }
  }

  // Try __NEXT_DATA__ (newer AliExpress pages)
  const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(\{[\s\S]*?)\}<\/script>/)
  if (nextMatch) {
    try {
      return JSON.parse(nextMatch[1] + '}')
    } catch {
      // ignore
    }
  }

  return null
}

function parseFromRunParams(
  params: Record<string, unknown>,
  sourceUrl: string
): Partial<ScrapedProduct> {
  // Navigate the nested structure — AliExpress nests under data.data or pageData
  const data =
    (params?.data as Record<string, unknown>) ||
    (params?.pageData as Record<string, unknown>) ||
    params

  const productInfo =
    (data?.productInfoComponent as Record<string, unknown>) ||
    (data?.product as Record<string, unknown>) ||
    {}

  const priceInfo =
    (data?.priceComponent as Record<string, unknown>) ||
    (data?.price as Record<string, unknown>) ||
    (productInfo?.priceInfo as Record<string, unknown>) ||
    {}

  const mediaInfo =
    (data?.imageComponent as Record<string, unknown>) ||
    (data?.media as Record<string, unknown>) ||
    {}

  const skuInfo =
    (data?.skuComponent as Record<string, unknown>) ||
    (data?.sku as Record<string, unknown>) ||
    {}

  const storeInfo =
    (data?.sellerComponent as Record<string, unknown>) ||
    (data?.store as Record<string, unknown>) ||
    {}

  const reviewInfo =
    (data?.feedbackComponent as Record<string, unknown>) ||
    (data?.review as Record<string, unknown>) ||
    {}

  // Title
  const title =
    (productInfo?.subject as string) ||
    (productInfo?.title as string) ||
    (data?.title as string) ||
    null

  // Price
  const priceStr =
    (priceInfo?.formatedPrice as string) ||
    (priceInfo?.price as string) ||
    (priceInfo?.salePrice as Record<string, unknown>)?.formatedAmount as string ||
    ''

  const priceRangeStr =
    (priceInfo?.formatedActivityPrice as string) || priceStr

  let priceMin: number | null = null
  let priceMax: number | null = null
  let currency = 'USD'

  if (priceRangeStr) {
    const curr = priceRangeStr.match(/([A-Z]{2,3}|\$|€|£|KSh)/)
    if (curr) currency = curr[1]

    const nums = priceRangeStr
      .replace(/[^0-9.\-]/g, ' ')
      .trim()
      .split(/\s+/)
      .map(safeParseFloat)
      .filter((n): n is number => n !== null)

    if (nums.length >= 2) {
      priceMin = Math.min(...nums)
      priceMax = Math.max(...nums)
    } else if (nums.length === 1) {
      priceMin = nums[0]
      priceMax = null
    }
  }

  // Images
  const imageList =
    (mediaInfo?.imagePathList as string[]) ||
    (mediaInfo?.images as string[]) ||
    []

  const images = dedupeImages(
    imageList.map((img: string) =>
      img.startsWith('http') ? img : `https:${img}`
    )
  )

  // Variants (SKU props)
  const variants: ScrapedVariant[] = []
  const skuProps =
    (skuInfo?.skuPropertyList as Array<Record<string, unknown>>) ||
    (skuInfo?.props as Array<Record<string, unknown>>) ||
    []

  for (const prop of skuProps) {
    const propName = (prop?.skuPropertyName as string) || (prop?.name as string) || 'Option'
    const values =
      (prop?.skuPropertyValues as Array<Record<string, unknown>>) ||
      (prop?.values as Array<Record<string, unknown>>) ||
      []

    for (const val of values) {
      variants.push({
        name: propName,
        value: (val?.propertyValueDisplayName as string) || (val?.name as string) || '',
        image: (val?.skuPropertyImagePath as string) || undefined,
        available: true,
      })
    }
  }

  // Rating & reviews
  const rating =
    safeParseFloat(
      (reviewInfo?.evarageStar as string) ||
      (reviewInfo?.rating as string) ||
      (data?.averageStar as string)
    )

  const reviewCount =
    parseInt(
      String(
        (reviewInfo?.totalValidNum as number) ||
        (reviewInfo?.count as number) ||
        (data?.totalValidNum as number) ||
        0
      )
    ) || null

  // Seller
  const sellerName =
    (storeInfo?.storeName as string) ||
    (storeInfo?.name as string) ||
    (data?.storeName as string) ||
    null

  return {
    title,
    price_min: priceMin,
    price_max: priceMax,
    currency,
    images,
    variants,
    rating,
    review_count: reviewCount || null,
    seller_name: sellerName,
    in_stock: true,
  }
}

// ─── HTML fallback extraction ────────────────────────────────────────────────

function parseFromHTML(html: string, $: cheerio.CheerioAPI): Partial<ScrapedProduct> {
  const title =
    $('h1[data-pl="product-title"]').text().trim() ||
    $('h1.product-title-text').text().trim() ||
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    null

  const priceText =
    $('.product-price-value').first().text().trim() ||
    $('[class*="price"]').first().text().trim() ||
    $('meta[property="product:price:amount"]').attr('content') ||
    ''

  const currency =
    $('meta[property="product:price:currency"]').attr('content') || 'USD'

  const nums = priceText
    .replace(/[^0-9.\-]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(safeParseFloat)
    .filter((n): n is number => n !== null)

  const price_min = nums.length > 0 ? Math.min(...nums) : null
  const price_max = nums.length > 1 ? Math.max(...nums) : null

  // Images from og tags and img tags
  const images: string[] = []
  $('meta[property="og:image"]').each((_, el) => {
    const content = $(el).attr('content')
    if (content) images.push(content)
  })
  $('img[src*="alicdn.com"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src')
    if (src) images.push(src.startsWith('http') ? src : `https:${src}`)
  })

  const description =
    $('meta[name="description"]').attr('content') ||
    $('[class*="description"]').first().text().trim().slice(0, 1000) ||
    null

  const sellerName =
    $('[class*="store-name"]').first().text().trim() ||
    $('a[href*="store/"]').first().text().trim() ||
    null

  return {
    title,
    price_min,
    price_max,
    currency,
    images: dedupeImages(images),
    description,
    variants: [],
    rating: null,
    review_count: null,
    seller_name: sellerName,
    in_stock: true,
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function scrapeAliExpressProduct(url: string): Promise<ScrapedProduct> {
  const aliexpressId = extractAliId(url)

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    Referer: 'https://www.aliexpress.com/',
    'Cache-Control': 'no-cache',
  }

  let html = ''
  let lastError: Error | null = null

  // Retry up to 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      html = await res.text()
      if (html.length > 5000) break
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < 3) await new Promise(r => setTimeout(r, 1500 * attempt))
    }
  }

  if (!html) {
    throw lastError || new Error('Failed to fetch page after 3 attempts')
  }

  const $ = cheerio.load(html)

  // Remove script/style to clean description extraction later
  $('script, style, noscript').remove()

  // Try JSON extraction first
  const runParams = extractRunParams(html)
  let product: Partial<ScrapedProduct> = {}

  if (runParams) {
    product = parseFromRunParams(runParams, url)
  }

  // Fill any missing fields from HTML
  const htmlData = parseFromHTML(html, $)

  const merged: ScrapedProduct = {
    source_url: url,
    aliexpress_id: aliexpressId,
    title: product.title || htmlData.title || null,
    price_min: product.price_min ?? htmlData.price_min ?? null,
    price_max: product.price_max ?? htmlData.price_max ?? null,
    currency: product.currency || htmlData.currency || 'USD',
    images:
      (product.images?.length ? product.images : null) ||
      htmlData.images ||
      [],
    description: product.description || htmlData.description || null,
    variants: product.variants?.length ? product.variants : htmlData.variants || [],
    rating: product.rating ?? htmlData.rating ?? null,
    review_count: product.review_count ?? htmlData.review_count ?? null,
    seller_name: product.seller_name || htmlData.seller_name || null,
    in_stock: product.in_stock ?? true,
    affiliate_url: buildAffiliateUrl(url),
    raw_data: runParams || undefined,
  }

  return merged
}

export async function scrapeMultipleProducts(
  urls: string[],
  onProgress?: (done: number, total: number, current: ScrapedProduct | null, error: string | null) => void
): Promise<{ success: ScrapedProduct[]; failed: { url: string; error: string }[] }> {
  const success: ScrapedProduct[] = []
  const failed: { url: string; error: string }[] = []

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i].trim()
    if (!url) continue

    try {
      const product = await scrapeAliExpressProduct(url)
      success.push(product)
      onProgress?.(i + 1, urls.length, product, null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      failed.push({ url, error: errorMsg })
      onProgress?.(i + 1, urls.length, null, errorMsg)
    }

    // Polite delay between requests to avoid rate limiting
    if (i < urls.length - 1) {
      await new Promise(r => setTimeout(r, 1200))
    }
  }

  return { success, failed }
}