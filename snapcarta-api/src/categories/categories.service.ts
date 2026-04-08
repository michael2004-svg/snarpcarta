import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { Category } from './categories.entity'

@Injectable()
export class CategoriesService {
  constructor(private supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient()
  }

  private throwDbError(error: any): never {
    throw new InternalServerErrorException(error.message)
  }

  async findAll(): Promise<Category[]> {
    const { data, error } = await this.db.from('categories').select('*')
    if (error) this.throwDbError(error)
    return (data ?? []) as Category[]
  }

  async create(data: Partial<Category>): Promise<Category> {
    const { data: created, error } = await this.db
      .from('categories')
      .insert(data)
      .select('*')
      .single()

    if (error) this.throwDbError(error)
    return created as Category
  }
}
