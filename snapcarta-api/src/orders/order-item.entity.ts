import { Order } from './orders.entity'
import { Product } from '../products/products.entity'

export class OrderItem {
  id: string
  order: Order
  product: Product
  quantity: number
  priceAtPurchase: number
  aliexpressProductId: string
}
