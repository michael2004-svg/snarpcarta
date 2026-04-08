import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { Product } from './products.entity'
import { CreateProductDto } from './dto/create-product.dto'
import { QueryProductDto } from './dto/query-product.dto'

@Injectable()
export class ProductsService {
  constructor(private supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient()
  }

  private throwDbError(error: any): never {
    throw new InternalServerErrorException(error.message)
  }

  private normalizeProductInput(input: any) {
    const normalized = { ...input }
    if (normalized.category?.id && !normalized.categoryId) {
      normalized.categoryId = normalized.category.id
    }
    delete normalized.category
    return normalized
  }

  async findAll(query: QueryProductDto) {
    const { search, category, badge, minPrice, maxPrice, sortBy, page = 1, limit = 20 } = query

    let categoryId: string | undefined
    if (category) {
      const { data: cat, error: catError } = await this.db
        .from('categories')
        .select('id')
        .eq('slug', category)
        .maybeSingle()

      if (catError) this.throwDbError(catError)
      if (!cat) {
        return { data: [], total: 0, page, limit, pages: 0 }
      }
      categoryId = cat.id
    }

    let qb = this.db
      .from('products')
      .select('*, category:categories(*)', { count: 'exact' })

    if (search) {
      const safeSearch = search.replace(/,/g, ' ')
      qb = qb.or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`)
    }
    if (categoryId) {
      qb = qb.eq('categoryId', categoryId)
    }
    if (badge) {
      qb = qb.eq('badge', badge)
    }
    if (minPrice !== undefined) {
      qb = qb.gte('price', minPrice)
    }
    if (maxPrice !== undefined) {
      qb = qb.lte('price', maxPrice)
    }

    switch (sortBy) {
      case 'price_asc':
        qb = qb.order('price', { ascending: true })
        break
      case 'price_desc':
        qb = qb.order('price', { ascending: false })
        break
      case 'rating':
        qb = qb.order('rating', { ascending: false })
        break
      default:
        qb = qb.order('createdAt', { ascending: false })
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    qb = qb.range(from, to)

    const { data, error, count } = await qb
    if (error) this.throwDbError(error)

    const total = count ?? 0
    return {
      data: (data ?? []) as Product[],
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }
  }

  async findOne(id: string): Promise<Product> {
    const { data, error } = await this.db
      .from('products')
      .select('*, category:categories(*)')
      .eq('id', id)
      .maybeSingle()

    if (error) this.throwDbError(error)
    if (!data) throw new NotFoundException('Product not found')
    return data as Product
  }

  async findByAliExpressId(aliexpressId: string): Promise<Product | null> {
    const { data, error } = await this.db
      .from('products')
      .select('id')
      .eq('aliexpressId', aliexpressId)
      .maybeSingle()

    if (error) this.throwDbError(error)
    return (data as Product) ?? null
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const payload = this.normalizeProductInput(dto)

    if (payload.aliexpressId) {
      const existing = await this.findByAliExpressId(payload.aliexpressId)
      if (existing) {
        return this.update(existing.id, payload)
      }
    }

    const { data, error } = await this.db
      .from('products')
      .insert(payload)
      .select('*, category:categories(*)')
      .single()

    if (error) this.throwDbError(error)
    return data as Product
  }

  async update(id: string, dto: Partial<CreateProductDto>): Promise<Product> {
    await this.findOne(id)
    const payload = this.normalizeProductInput(dto)
    const { data, error } = await this.db
      .from('products')
      .update(payload)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single()

    if (error) this.throwDbError(error)
    return data as Product
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id)
    const { error } = await this.db.from('products').delete().eq('id', id)
    if (error) this.throwDbError(error)
  }

  async getTrending(): Promise<Product[]> {
    const { data, error } = await this.db
      .from('products')
      .select('*')
      .eq('badge', 'hot')
      .limit(10)

    if (error) this.throwDbError(error)
    return (data ?? []) as Product[]
  }

  async getNewArrivals(): Promise<Product[]> {
    const { data, error } = await this.db
      .from('products')
      .select('*')
      .eq('badge', 'new')
      .limit(10)

    if (error) this.throwDbError(error)
    return (data ?? []) as Product[]
  }

  async bulkCreate(products: Partial<Product>[]): Promise<Product[]> {
    const results: Product[] = []
    for (const product of products) {
      const payload = this.normalizeProductInput(product)
      const created = await this.create(payload as CreateProductDto)
      results.push(created)
    }
    return results
  }

  async findAllImported(): Promise<Product[]> {
    const { data, error } = await this.db
      .from('products')
      .select('*')
      .not('aliexpressId', 'is', null)

    if (error) this.throwDbError(error)
    return (data ?? []) as Product[]
  }
}
