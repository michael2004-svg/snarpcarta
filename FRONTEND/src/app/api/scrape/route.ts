import { NextRequest, NextResponse } from 'next/server'
import { scrapeMultipleProducts } from '@/lib/scraper'
import { upsertScrapedProduct } from '@/lib/scraped-products'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const urls: string[] = Array.isArray(body.urls)
      ? body.urls
      : typeof body.url === 'string'
      ? [body.url]
      : []

    if (!urls.length) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
    }

    const validUrls = urls.filter(u => {
      try {
        const parsed = new URL(u)
        return parsed.hostname.includes('aliexpress.com')
      } catch {
        return false
      }
    })

    if (!validUrls.length) {
      return NextResponse.json(
        { error: 'No valid AliExpress URLs found' },
        { status: 400 }
      )
    }

    const results = await scrapeMultipleProducts(validUrls)

    const saved = []
    const saveErrors = []

    for (const product of results.success) {
      try {
        const record = await upsertScrapedProduct(product)
        saved.push(record)
      } catch (err) {
        saveErrors.push({
          url: product.source_url,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return NextResponse.json({
      success: true,
      scraped: results.success.length,
      saved: saved.length,
      failed: [...results.failed, ...saveErrors],
      products: saved,
    })
  } catch (err) {
    console.error('[SCRAPE API]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Scrape failed' },
      { status: 500 }
    )
  }
}
