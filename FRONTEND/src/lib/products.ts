import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice: number
  image: string
  images: string[]
  specs: Record<string, unknown>
  categoryId: string | null
  aliexpressId: string | null
  rating: number
  reviewCount: number
  inStock: boolean
  stock: number
  badge: 'hot' | 'new' | 'sale' | null
  createdAt: string
  updatedAt: string
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return (data || []) as Product[]
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data as Product
}

export async function getTrending(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('badge', 'hot')
    .limit(10)

  if (error) return []
  return (data || []) as Product[]
}

export async function getNewArrivals(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(10)

  if (error) return []
  return (data || []) as Product[]
}

export async function getSaleItems(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('badge', 'sale')
    .limit(10)

  if (error) return []
  return (data || []) as Product[]
}

export async function getByCategory(categoryName: string): Promise<Product[]> {
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .maybeSingle()

  if (!cat?.id) return []

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('categoryId', cat.id)
    .limit(20)

  if (error) return []
  return (data || []) as Product[]
}
