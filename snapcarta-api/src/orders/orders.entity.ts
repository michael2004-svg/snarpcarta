import { User } from '../users/users.entity'
import { OrderItem } from './order-item.entity'

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  MPESA = 'mpesa',
}

export class Order {
  id: string
  orderNumber: string
  user: User
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  total: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentId: string
  trackingNumber: string
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    city: string
    country: string
    zip: string
    phone: string
  }
  aliexpressOrderId: string
  createdAt: Date
  updatedAt: Date
}
