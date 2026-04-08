import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private supabase: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    })
  }

  async validate(payload: { sub: string; email: string }) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .auth.admin.getUserById(payload.sub)

    if (error || !data.user) {
      console.error('JWT validation error:', error)
      throw new UnauthorizedException()
    }

    const userData = data.user.user_metadata as Record<string, unknown>
    return {
      id: data.user.id,
      email: data.user.email,
      firstName: userData?.firstName,
      lastName: userData?.lastName,
    }
  }
}