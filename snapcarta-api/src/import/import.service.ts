import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { ProductsService } from '../products/products.service'
import { PricingService } from '../pricing/pricing.service'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

type PriceRange = {
  min: number
  max: number
  currency: string
}

type VariantValue = {
  name: string
  price?: number
  skuId?: string
  image?: string
}

type VariantGroup = {
  name: string
  values: VariantValue[]
}

type PreviewProduct = {
  aliexpressId?: string
  title: string
  description: string
  price: number
  originalPrice: number
  currency: string
  image: string
  images: string[]
  variants: VariantGroup[]
  rating: number
  reviewCount: number
  inStock: boolean
  stock?: number
  seller?: string
  sourceUrl?: string
  priceRange?: PriceRange
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name)
  private readonly apiUrl = 'https://gw.api.alibaba.com/openapi/param2/2/portals.open/api.listPromotionProduct/json'

  constructor(
    private config: ConfigService,
    private productsService: ProductsService,
    private pricingService: PricingService,
  ) {}

  private getApiCredentials() {
    const appKey = this.config.get('ALIEXPRESS_APP_KEY')
    const accessToken = this.config.get('ALIEXPRESS_ACCESS_TOKEN')

    if (!appKey || !accessToken || appKey === 'your_app_key' || accessToken === 'your_access_token') {
      throw new BadRequestException(
        'AliExpress API credentials not configured. Set ALIEXPRESS_APP_KEY and ALIEXPRESS_ACCESS_TOKEN in .env'
      )
    }

    return { appKey, accessToken }
  }

  private async callAliExpressApi(params: Record<string, any>, accessToken: string) {
    const { data } = await axios.get(this.apiUrl, {
      params: {
        ...params,
        appKey: this.config.get('ALIEXPRESS_APP_KEY'),
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 15000,
    })

    if (data.errorCode) {
      throw new BadRequestException(`AliExpress API error: ${data.errorCode} - ${data.errorMessage || 'Unknown error'}`)
    }

    return data
  }

  private isUrl(value?: string) {
    return !!value && /^https?:\/\//i.test(value)
  }

  private parseProductIdFromUrl(url: string): string | undefined {
    const match = url.match(/\/item\/(\d+)\.html/i) || url.match(/[?&]productId=(\d+)/i)
    return match?.[1]
  }

  private parsePrice(value: any): number {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^0-9.]/g, ''))
      return Number.isFinite(parsed) ? parsed : 0
    }
    if (typeof value === 'object') {
      if (value.amount !== undefined) return this.parsePrice(value.amount)
      if (value.value !== undefined) return this.parsePrice(value.value)
      if (value.minAmount !== undefined) return this.parsePrice(value.minAmount)
      if (value.maxAmount !== undefined) return this.parsePrice(value.maxAmount)
    }
    return 0
  }

  private normalizeImages(images: string[] = []): string[] {
    const seen = new Set<string>()
    const normalized: string[] = []
    for (const img of images) {
      if (!img) continue
      const url = img.startsWith('//') ? `https:${img}` : img
      if (!seen.has(url)) {
        seen.add(url)
        normalized.push(url)
      }
    }
    return normalized
  }

  private buildPreviewProduct(input: Partial<PreviewProduct>): PreviewProduct {
    const images = this.normalizeImages(input.images ?? [])
    const image = input.image || images[0] || ''
    const priceMin = input.priceRange?.min ?? input.price ?? 0
    const priceMax = input.priceRange?.max ?? input.originalPrice ?? priceMin
    const currency = input.priceRange?.currency || input.currency || 'USD'

    return {
      aliexpressId: input.aliexpressId,
      title: input.title || 'AliExpress Product',
      description: input.description || input.title || '',
      price: priceMin,
      originalPrice: priceMax,
      currency,
      image,
      images,
      variants: input.variants ?? [],
      rating: Number.isFinite(input.rating) ? (input.rating ?? 0) : 0,
      reviewCount: Number.isFinite(input.reviewCount) ? (input.reviewCount ?? 0) : 0,
      inStock: input.inStock ?? true,
      stock: input.stock,
      seller: input.seller,
      sourceUrl: input.sourceUrl,
      priceRange: {
        min: priceMin,
        max: priceMax,
        currency,
      },
    }
  }

  private normalizeFromSearch(raw: any): PreviewProduct {
    const priceMin = this.parsePrice(raw.salePrice?.amount || raw.salePrice)
    const priceMax = this.parsePrice(raw.originalPrice?.amount || raw.originalPrice)
    const currency = raw.salePrice?.currencyCode || raw.originalPrice?.currencyCode || 'USD'

    return this.buildPreviewProduct({
      aliexpressId: raw.productId ? String(raw.productId) : undefined,
      title: raw.productTitle,
      description: raw.productTitle,
      image: raw.productMainImageUrl,
      images: raw.productImages?.string || [raw.productMainImageUrl],
      rating: raw.evaluateRate ? parseFloat(raw.evaluateRate) / 20 : 0,
      reviewCount: raw.evaluateCount ? parseInt(raw.evaluateCount, 10) : 0,
      sourceUrl: raw.productDetailUrl,
      priceRange: {
        min: priceMin,
        max: priceMax || priceMin,
        currency,
      },
    })
  }

  private normalizeFromJsonLd(jsonLd: any, sourceUrl: string): PreviewProduct | null {
    const product = Array.isArray(jsonLd) ? jsonLd.find(item => item?.['@type'] === 'Product') : jsonLd
    if (!product || product['@type'] !== 'Product') return null

    const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers
    const priceMin = this.parsePrice(offers?.lowPrice ?? offers?.price)
    const priceMax = this.parsePrice(offers?.highPrice ?? offers?.price)
    const currency = offers?.priceCurrency || 'USD'

    return this.buildPreviewProduct({
      title: product.name,
      description: product.description,
      image: Array.isArray(product.image) ? product.image[0] : product.image,
      images: Array.isArray(product.image) ? product.image : product.image ? [product.image] : [],
      rating: this.parsePrice(product.aggregateRating?.ratingValue),
      reviewCount: parseInt(product.aggregateRating?.reviewCount || product.aggregateRating?.ratingCount || '0', 10),
      inStock: !offers?.availability || String(offers.availability).includes('InStock'),
      sourceUrl,
      priceRange: {
        min: priceMin,
        max: priceMax || priceMin,
        currency,
      },
    })
  }

  private normalizeFromRunParams(runParams: any, sourceUrl: string): PreviewProduct | null {
    const data = runParams?.data ?? runParams
    if (!data) return null

    const titleModule = data.titleModule ?? {}
    const imageModule = data.imageModule ?? {}
    const priceModule = data.priceModule ?? {}
    const feedbackModule = data.feedbackModule ?? data.reviewModule ?? {}
    const storeModule = data.storeModule ?? {}
    const inventoryModule = data.inventoryModule ?? {}
    const skuModule = data.skuModule ?? {}

    const title = titleModule.subject || titleModule.title || titleModule.productTitle
    const images = imageModule.imagePathList || imageModule.images || []

    const minPrice = this.parsePrice(priceModule.minAmount?.value ?? priceModule.minAmount?.amount ?? priceModule.minAmount)
    const maxPrice = this.parsePrice(priceModule.maxAmount?.value ?? priceModule.maxAmount?.amount ?? priceModule.maxAmount)
    const currency = priceModule.currencyCode || priceModule.currency || 'USD'

    const variants: VariantGroup[] = (skuModule.productSKUPropertyList || []).map((prop: any) => ({
      name: prop.skuPropertyName || prop.propertyName || '',
      values: (prop.skuPropertyValues || []).map((val: any) => ({
        name: val.propertyValueDisplayName || val.propertyValueName || '',
        price: this.parsePrice(val.skuPropertyPrice?.value ?? val.skuPropertyPrice ?? val.price),
        skuId: val.propertyValueId || val.skuId,
        image: val.skuPropertyImagePath || val.image,
      })).filter((val: VariantValue) => val.name),
    })).filter((group: VariantGroup) => group.name)

    const rating = this.parsePrice(feedbackModule.averageStar)
    const reviewCount = parseInt(feedbackModule.totalValidNum || feedbackModule.reviewCount || '0', 10)

    const stock = parseInt(inventoryModule.totalAvailQuantity || inventoryModule.totalStock || '0', 10)

    return this.buildPreviewProduct({
      aliexpressId: data.productId ? String(data.productId) : data.productIdStr,
      title,
      description: data.descriptionModule?.description || title,
      images,
      rating,
      reviewCount,
      inStock: stock > 0 || stock === 0,
      stock: Number.isFinite(stock) ? stock : undefined,
      seller: storeModule.storeName,
      variants,
      sourceUrl,
      priceRange: {
        min: minPrice,
        max: maxPrice || minPrice,
        currency,
      },
    })
  }

  private safeJsonParse(payload: string): any | null {
    try {
      return JSON.parse(payload)
    } catch {
      return null
    }
  }

  private extractJsonCandidates(html: string): any[] {
    const candidates: any[] = []

    const runParamsMatch = html.match(/window\.runParams\s*=\s*(\{[\s\S]*?\});/i)
    if (runParamsMatch?.[1]) {
      const parsed = this.safeJsonParse(runParamsMatch[1])
      if (parsed) candidates.push(parsed)
    }

    const initialDataMatch = html.match(/window\.__INITIAL_DATA__\s*=\s*(\{[\s\S]*?\});/i)
    if (initialDataMatch?.[1]) {
      const parsed = this.safeJsonParse(initialDataMatch[1])
      if (parsed) candidates.push(parsed)
    }

    const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    for (const match of jsonLdMatches) {
      const parsed = this.safeJsonParse(match[1])
      if (parsed) candidates.push(parsed)
    }

    return candidates
  }

  private async scrapeProductPage(url: string): Promise<PreviewProduct> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    })

    const html = response.data as string
    const candidates = this.extractJsonCandidates(html)

    for (const candidate of candidates) {
      const runParams = candidate?.data ? candidate : candidate?.data
      const fromRunParams = this.normalizeFromRunParams(runParams, url)
      if (fromRunParams?.title && fromRunParams.image) return fromRunParams

      const fromJsonLd = this.normalizeFromJsonLd(candidate, url)
      if (fromJsonLd?.title && fromJsonLd.image) return fromJsonLd
    }

    const fallback = this.normalizeFromJsonLd(candidates[0], url)
    if (fallback) return fallback

    throw new BadRequestException('Unable to extract product data from AliExpress page')
  }

  private async fetchByKeyword(keyword: string): Promise<PreviewProduct[]> {
    const { accessToken } = this.getApiCredentials()
    const data = await this.callAliExpressApi({
      keywords: keyword,
      fields: 'productId,productTitle,productMainImageUrl,productImages,salePrice,originalPrice,evaluateRate,evaluateCount,productDetailUrl',
      pageSize: 20,
      pageNo: 1,
    }, accessToken)

    const rawProducts = data?.result?.products?.product || []
    return rawProducts.map((raw: any) => this.normalizeFromSearch(raw))
  }

  async previewFromAliExpress(keyword?: string, categoryId?: string, sourceUrl?: string, urls?: string[]) {
    const targetUrls = urls?.filter(this.isUrl) ?? []
    if (sourceUrl && this.isUrl(sourceUrl)) targetUrls.unshift(sourceUrl)

    if (targetUrls.length === 0 && (!keyword || keyword.trim().length === 0)) {
      throw new BadRequestException('Provide a keyword or AliExpress URL to preview products')
    }

    const previews: PreviewProduct[] = []

    if (targetUrls.length > 0) {
      for (const url of targetUrls) {
        try {
          previews.push(await this.scrapeProductPage(url))
        } catch (error: any) {
          this.logger.warn(`Failed to scrape ${url}: ${error.message}`)
        }
      }
    }

    if (previews.length === 0 && keyword) {
      previews.push(...await this.fetchByKeyword(keyword))
    }

    return { data: previews, keyword, categoryId }
  }

  // -- Manual import trigger --------------------------------------------------
  async importFromAliExpress(keyword: string, categoryId?: string) {
    if (!keyword || keyword.trim().length === 0) {
      throw new BadRequestException('Keyword is required for product import')
    }

    this.logger.log(`Importing products for keyword: ${keyword}`)

    const { accessToken } = this.getApiCredentials()

    try {
      const data = await this.callAliExpressApi({
        keywords: keyword,
        fields: 'productId,productTitle,productMainImageUrl,productImages,salePrice,originalPrice,evaluateRate,evaluateCount,productDetailUrl',
        pageSize: 20,
        pageNo: 1,
      }, accessToken)

      const rawProducts = data?.result?.products?.product || []
      const imported: any[] = []

      for (const raw of rawProducts) {
        const aliexpressCost = this.parsePrice(raw.salePrice?.amount || raw.originalPrice?.amount || raw.salePrice || raw.originalPrice || '10')
        const markedUpPrice = await this.pricingService.applyMarkup(aliexpressCost)

        imported.push({
          title: raw.productTitle,
          description: raw.productTitle,
          price: markedUpPrice,
          originalPrice: aliexpressCost * 2,
          image: raw.productMainImageUrl,
          images: raw.productImages?.string || [raw.productMainImageUrl],
          aliexpressId: String(raw.productId),
          rating: raw.evaluateRate ? parseFloat(raw.evaluateRate) / 20 : 0,
          reviewCount: raw.evaluateCount ? parseInt(raw.evaluateCount, 10) : 0,
          inStock: true,
          stock: 999,
          ...(categoryId && { category: { id: categoryId } as any }),
        })
      }

      if (imported.length > 0) {
        await this.productsService.bulkCreate(imported)
        this.logger.log(`Imported ${imported.length} products for keyword: ${keyword}`)
      }

      return { imported: imported.length, keyword }
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error
      this.logger.error(`AliExpress import failed for keyword "${keyword}":`, error.message)
      throw new BadRequestException(`AliExpress import failed: ${error.message}`)
    }
  }

  // -- Scheduled price sync every 6 hours -------------------------------------
  @Cron(CronExpression.EVERY_6_HOURS)
  async syncPrices() {
    this.logger.log('Running scheduled price sync...')

    let accessToken: string
    try {
      const creds = this.getApiCredentials()
      accessToken = creds.accessToken
    } catch {
      this.logger.warn('Price sync skipped: AliExpress credentials not configured')
      return
    }

    const products = await this.productsService.findAllImported()
    let updated = 0
    let failed = 0

    for (const product of products) {
      try {
        const data = await this.callAliExpressApi({
          keywords: product.aliexpressId,
          fields: 'productId,salePrice,originalPrice',
          pageSize: 1,
          pageNo: 1,
        }, accessToken)

        const rawProduct = data?.result?.products?.product?.[0]
        if (!rawProduct) {
          this.logger.warn(`Product ${product.aliexpressId} not found on AliExpress, skipping`)
          failed++
          continue
        }

        const newCost = this.parsePrice(rawProduct.salePrice?.amount || rawProduct.originalPrice?.amount || rawProduct.salePrice || rawProduct.originalPrice || String(product.price))
        const newPrice = await this.pricingService.applyMarkup(newCost)

        if (newPrice !== Number(product.price)) {
          await this.productsService.update(product.id, {
            price: newPrice,
            originalPrice: newCost * 2,
          })
          updated++
          this.logger.log(`Updated price for "${product.title}": ${product.price} -> ${newPrice}`)
        }

        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error: any) {
        this.logger.error(`Failed to sync price for product ${product.aliexpressId}:`, error.message)
        failed++
      }
    }

    this.logger.log(`Price sync complete: ${updated} updated, ${failed} failed, ${products.length} total`)
  }
}
