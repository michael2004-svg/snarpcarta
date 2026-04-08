import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { User } from './users.entity'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient()
  }

  private throwDbError(error: any): never {
    throw new InternalServerErrorException(error.message)
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await this.db.from('users').select('*')
    if (error) this.throwDbError(error)
    return (data ?? []) as User[]
  }

  async findOne(id: string): Promise<User> {
    const { data, error } = await this.db.from('users').select('*').eq('id', id).maybeSingle()
    if (error) this.throwDbError(error)
    if (!data) throw new NotFoundException('User not found')
    return data as User
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.db
      .from('users')
      .select('id,email,password,role,firstName,lastName')
      .eq('email', email)
      .maybeSingle()

    if (error) this.throwDbError(error)
    return (data as User) ?? null
  }

  async create(data: Partial<User>): Promise<User> {
    const hashed = await bcrypt.hash(data.password!, 12)
    const payload = { ...data, password: hashed }

    const { data: created, error } = await this.db
      .from('users')
      .insert(payload)
      .select('*')
      .single()

    if (error) this.throwDbError(error)
    return created as User
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const { data: updated, error } = await this.db
      .from('users')
      .update(data)
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) this.throwDbError(error)
    if (!updated) throw new NotFoundException('User not found')
    return updated as User
  }
}
