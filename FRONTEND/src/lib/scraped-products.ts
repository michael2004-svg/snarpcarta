// lib/scraped-products.ts
import { createClient } from '@/lib/supabase/server'
import type { ScrapedProduct } from './scraper'

export interface DBScrapedProduct extends ScrapedProduct {
  id: string
  status: 'pending' | 'added' | 'skipped'
  scraped_at: string
  updated_at: string
}

export type PublishOverrides = {
  title?: string
  price?: number
  originalPrice?: number
  description?: string
  badge?: 'hot' | 'new' | 'sale' | null
  inStock?: boolean
  categoryId?: string | null
}

const DEFAULT_IMAGE = '/logo.png'

const coerceNumber = (val: unknown): number | null => {
  if (val == null) return null
  const num = Number(val)
  return Number.isNaN(num) ? null : num
}

const normalizeScrapedRow = (row: any): DBScrapedProduct => ({
  ...row,
  price_min: coerceNumber(row.price_min),
  price_max: coerceNumber(row.price_max),
  rating: coerceNumber(row.rating),
  review_count: row.review_count != null ? Number(row.review_count) : null,
  images: Array.isArray(row.images) ? row.images : [],
  variants: Array.isArray(row.variants) ? row.variants : [],
  in_stock: row.in_stock ?? true,
})

function buildSpecs(sp: DBScrapedProduct) {
  return {
    variants: sp.variants || [],
    sellerName: sp.seller_name || null,
  }
}

export async function upsertScrapedProduct(product: ScrapedProduct) {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('scraped_products')
    .select('status')
    .eq('source_url', product.source_url)
    .maybeSingle()

  const currentStatus = existing?.status ?? 'pending'

  const payload = {
    source_url: product.source_url,
    aliexpress_id: product.aliexpress_id,
    title: product.title,
    price_min: product.price_min,
    price_max: product.price_max,
    currency: product.currency || 'USD',
    images: product.images || [],
    description: product.description,
    variants: product.variants || [],
    rating: product.rating,
    review_count: product.review_count,
    seller_name: product.seller_name,
    in_stock: product.in_stock,
    affiliate_url: product.affiliate_url,
    raw_data: product.raw_data || null,
    status: currentStatus as 'pending' | 'added' | 'skipped',
    scraped_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('scraped_products')
    .upsert(payload, {
      onConflict: 'source_url',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  if (error) throw error
  return normalizeScrapedRow(data)
}

export async function getScrapedProducts(status?: string) {
  const supabase = createClient()

  let query = supabase
    .from('scraped_products')
    .select('*')
    .order('scraped_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(normalizeScrapedRow)
}

export async function updateScrapedProductStatus(
  id: string,
  status: 'pending' | 'added' | 'skipped'
) {
  const supabase = createClient()

  const { error } = await supabase
    .from('scraped_products')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function publishScrapedProduct(scrapedId: string, overrides: PublishOverrides = {}) {
  const supabase = createClient()

  const { data: sp, error: fetchErr } = await supabase
    .from('scraped_products')
    .select('*')
    .eq('id', scrapedId)
    .single()

  if (fetchErr || !sp) throw fetchErr || new Error('Scraped product not found')

  const scraped = normalizeScrapedRow(sp)

  const scrapedPrice = scraped.price_min ?? scraped.price_max ?? 0
  const price = overrides.price != null && overrides.price > 0 ? overrides.price : scrapedPrice
  const originalPrice =
    overrides.originalPrice != null && overrides.originalPrice > 0
      ? overrides.originalPrice
      : (scraped.price_max != null && scraped.price_max > price ? scraped.price_max : price)
  if (!price || price <= 0) {
    throw new Error('Price is required before publishing')
  }

  const image = (scraped.images && scraped.images[0]) || DEFAULT_IMAGE

  const payload = {
    title: overrides.title?.trim() || scraped.title || 'Imported product',
    description: overrides.description?.trim() || scraped.description || '',
    price,
    originalPrice,
    image,
    images: scraped.images || [],
    specs: buildSpecs(scraped),
    categoryId: overrides.categoryId ?? null,
    aliexpressId: scraped.aliexpress_id,
    rating: scraped.rating ?? 0,
    reviewCount: scraped.review_count ?? 0,
    inStock: overrides.inStock ?? scraped.in_stock ?? true,
    badge: overrides.badge ?? null,
  }

  let productId: string | null = null

  if (scraped.aliexpress_id) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('aliexpressId', scraped.aliexpress_id)
      .maybeSingle()

    if (existing?.id) productId = existing.id
  }

  let product

  if (productId) {
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .select()
      .single()

    if (error) throw error
    product = data
  } else {
    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    product = data
  }

  await updateScrapedProductStatus(scrapedId, 'added')

  return product
}

