import { Category } from '../categories/categories.entity'

export enum ProductBadge {
  HOT = 'hot',
  NEW = 'new',
  SALE = 'sale',
}

export class Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice: number
  image: string
  images: string[]
  specs: Record<string, string>
  category: Category
  aliexpressId: string
  rating: number
  reviewCount: number
  inStock: boolean
  stock: number
  badge: ProductBadge | null
  createdAt: Date
  updatedAt: Date
}
