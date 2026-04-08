import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { SupabaseService } from '../supabase/supabase.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private jwtService: JwtService,
  ) {}

  private get sb() {
    return this.supabase.getClient()
  }

  private get adminSb() {
    return this.supabase.getAdminClient()
  }

  async register(dto: RegisterDto) {
    try {
      const { data, error } = await this.adminSb.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      })

      if (error) {
        console.error('Supabase admin createUser error:', error)
        if (error.message.includes('already been registered')) {
          throw new ConflictException('Email already registered')
        }
        throw new UnauthorizedException(error.message)
      }

      if (!data.user) {
        throw new UnauthorizedException('Registration failed')
      }

      const token = this.signToken(data.user.id, data.user.email!)
      return {
        access_token: token,
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      }
    } catch (error) {
      if (error instanceof ConflictException || error instanceof UnauthorizedException) {
        throw error
      }
      console.error('Registration error:', error)
      throw new UnauthorizedException('Registration failed')
    }
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.sb.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    })

    if (error) {
      console.error('Supabase login error:', error)
      throw new UnauthorizedException('Invalid credentials')
    }

    if (!data.user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const userData = data.user.user_metadata as Record<string, unknown>
    const token = this.signToken(data.user.id, data.user.email!)

    return {
      access_token: token,
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: userData?.firstName as string | undefined,
        lastName: userData?.lastName as string | undefined,
      },
    }
  }

  private signToken(userId: string, email: string) {
    return this.jwtService.sign({ sub: userId, email })
  }
}