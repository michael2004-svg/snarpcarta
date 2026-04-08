import { User } from '../users/users.entity'
import { Product } from '../products/products.entity'

export class CartItem {
  id: string
  user: User
  product: Product
  quantity: number
  createdAt: Date
}
