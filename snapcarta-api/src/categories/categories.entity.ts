import { Product } from '../products/products.entity'

export class Category {
  id: string
  name: string
  slug: string
  icon: string
  products: Product[]
}
