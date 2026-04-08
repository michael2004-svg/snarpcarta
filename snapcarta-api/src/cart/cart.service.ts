import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class CartService {
  constructor(private supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient()
  }

  private throwDbError(error: any): never {
    throw new InternalServerErrorException(error.message)
  }

  async getCart(userId: string) {
    const { data, error } = await this.db
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('userId', userId)

    if (error) this.throwDbError(error)
    const items = data ?? []
    const total = items.reduce(
      (sum: number, item: any) => sum + Number(item.product?.price ?? 0) * item.quantity,
      0
    )
    return { items, total: parseFloat(total.toFixed(2)), itemCount: items.length }
  }

  async addItem(userId: string, productId: string, quantity: number = 1) {
    const { data: existing, error: findError } = await this.db
      .from('cart_items')
      .select('*')
      .eq('userId', userId)
      .eq('productId', productId)
      .maybeSingle()

    if (findError) this.throwDbError(findError)

    if (existing) {
      const { data, error } = await this.db
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select('*, product:products(*)')
        .single()

      if (error) this.throwDbError(error)
      return data
    }

    const { data, error } = await this.db
      .from('cart_items')
      .insert({ userId, productId, quantity })
      .select('*, product:products(*)')
      .single()

    if (error) this.throwDbError(error)
    return data
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    if (quantity <= 0) return this.removeItem(userId, itemId)

    const { error } = await this.db
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .eq('userId', userId)

    if (error) this.throwDbError(error)
    return this.getCart(userId)
  }

  async removeItem(userId: string, itemId: string) {
    const { error } = await this.db
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('userId', userId)

    if (error) this.throwDbError(error)
    return this.getCart(userId)
  }

  async clearCart(userId: string) {
    const { error } = await this.db.from('cart_items').delete().eq('userId', userId)
    if (error) this.throwDbError(error)
    return { message: 'Cart cleared' }
  }
}
