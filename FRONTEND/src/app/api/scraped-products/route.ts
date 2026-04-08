// app/api/scraped-products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getScrapedProducts,
  updateScrapedProductStatus,
  publishScrapedProduct,
} from '@/lib/scraped-products'

export const runtime = 'nodejs'

const toMessage = (err: unknown) => (err instanceof Error ? err.message : JSON.stringify(err))

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status') || undefined
    const products = await getScrapedProducts(status)
    return NextResponse.json({ products })
  } catch (err) {
    return NextResponse.json({ error: toMessage(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action, overrides } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action required' }, { status: 400 })
    }

    if (action === 'publish') {
      const product = await publishScrapedProduct(id, overrides)
      return NextResponse.json({ success: true, product })
    }

    if (action === 'skip') {
      await updateScrapedProductStatus(id, 'skipped')
      return NextResponse.json({ success: true })
    }

    if (action === 'reset') {
      await updateScrapedProductStatus(id, 'pending')
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: toMessage(err) }, { status: 500 })
  }
}

