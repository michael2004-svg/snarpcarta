export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export class User {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
  phone: string
  address: string
  city: string
  country: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
