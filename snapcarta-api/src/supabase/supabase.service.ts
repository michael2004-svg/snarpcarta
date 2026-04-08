import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService {
  private client: SupabaseClient
  private adminClient: SupabaseClient

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL')
    const anonKey = this.config.get<string>('SUPABASE_ANON_KEY')
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')

    if (!url || !anonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required')
    }

    this.client = createClient(url, anonKey, {
      auth: { persistSession: false },
    })

    if (serviceRoleKey) {
      this.adminClient = createClient(url, serviceRoleKey, {
        auth: { persistSession: false },
      })
    } else {
      this.adminClient = this.client
    }
  }

  getClient(): SupabaseClient {
    return this.client
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient
  }
}