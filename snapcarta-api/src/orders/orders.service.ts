import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { Order, OrderStatus, PaymentMethod } from './orders.entity'
import { CartService } from '../cart/cart.service'

@Injectable()
export class OrdersService {
  constructor(
    private supabase: SupabaseService,
    private cartService: CartService,
  ) {}

  private get db() {
    return this.supabase.getClient()
  }

  private throwDbError(error: any): never {
    throw new InternalServerErrorException(error.message)
  }

  private generateOrderNumber(): string {
    return `SC-${Date.now().toString().slice(-8)}`
  }

  async createFromCart(
    userId: string,
    shippingAddress: any,
    paymentMethod: PaymentMethod,
  ) {
    const cart = await this.cartService.getCart(userId)
    if (cart.items.length === 0) throw new BadRequestException('Cart is empty')

    const subtotal = cart.total
    const shippingCost = 4.99
    const total = subtotal + shippingCost

    const { data: order, error } = await this.db
      .from('orders')
      .insert({
        orderNumber: this.generateOrderNumber(),
        userId,
        subtotal,
        shippingCost,
        total,
        paymentMethod,
        shippingAddress,
        status: OrderStatus.PENDING,
      })
      .select('*')
      .single()

    if (error) this.throwDbError(error)

    const items = cart.items.map((item: any) => ({
      orderId: order.id,
      productId: item.product.id,
      quantity: item.quantity,
      priceAtPurchase: Number(item.product.price),
    }))

    const { error: itemsError } = await this.db.from('order_items').insert(items)
    if (itemsError) this.throwDbError(itemsError)

    await this.cartService.clearCart(userId)
    return this.findOne(order.id)
  }

  async findUserOrders(userId: string) {
    const { data, error } = await this.db
      .from('orders')
      .select('*, items:order_items(*, product:products(*))')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (error) this.throwDbError(error)
    return data ?? []
  }

  async findOne(id: string, userId?: string) {
    let query = this.db
      .from('orders')
      .select('*, items:order_items(*, product:products(*)), user:users(*)')
      .eq('id', id)

    if (userId) query = query.eq('userId', userId)

    const { data, error } = await query.maybeSingle()
    if (error) this.throwDbError(error)
    if (!data) throw new NotFoundException('Order not found')
    return data as Order
  }

  async updateStatus(id: string, status: OrderStatus, trackingNumber?: string) {
    const update: any = { status }
    if (trackingNumber) update.trackingNumber = trackingNumber

    const { data, error } = await this.db
      .from('orders')
      .update(update)
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) this.throwDbError(error)
    if (!data) throw new NotFoundException('Order not found')
    return data as Order
  }

  async findAll(page: number = 1, limit: number = 20) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await this.db
      .from('orders')
      .select('*, user:users(*), items:order_items(*)', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) this.throwDbError(error)

    const total = count ?? 0
    return { data: data ?? [], total, page, pages: Math.ceil(total / limit) }
  }
}

