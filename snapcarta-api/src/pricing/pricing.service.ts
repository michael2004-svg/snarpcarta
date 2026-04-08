import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { PricingRule } from './pricing-rule.entity'

@Injectable()
export class PricingService {
  private defaultRules = [
    { minPrice: 0,   maxPrice: 10,  multiplier: 2.5 },
    { minPrice: 10,  maxPrice: 50,  multiplier: 1.8 },
    { minPrice: 50,  maxPrice: 200, multiplier: 1.5 },
    { minPrice: 200, maxPrice: 999999, multiplier: 1.3 },
  ]

  constructor(private supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient()
  }

  private throwDbError(error: any): never {
    throw new InternalServerErrorException(error.message)
  }

  async applyMarkup(aliexpressCostUSD: number): Promise<number> {
    const rules = await this.getRules()
    const rule = rules.find(
      r => aliexpressCostUSD >= Number(r.minPrice) && aliexpressCostUSD < Number(r.maxPrice)
    )

    const multiplier = rule ? Number(rule.multiplier) : 1.5
    return parseFloat((aliexpressCostUSD * multiplier).toFixed(2))
  }

  async getRules() {
    const { data, error } = await this.db.from('pricing_rules').select('*')
    if (error) this.throwDbError(error)
    return (data && data.length > 0) ? data : this.defaultRules
  }

  async updateRules(rules: Partial<PricingRule>[]) {
    const { error: deleteError } = await this.db
      .from('pricing_rules')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) this.throwDbError(deleteError)

    const { data, error } = await this.db
      .from('pricing_rules')
      .insert(rules as any)
      .select('*')

    if (error) this.throwDbError(error)
    return data ?? []
  }
}
