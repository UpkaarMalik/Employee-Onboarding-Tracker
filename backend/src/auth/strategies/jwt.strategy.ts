import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

interface AccessTokenPayload {
  sub: string;
  role: string;
  jti: string;
  exp: number;
  mustChangePassword:boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  // async validate(payload: AccessTokenPayload) {
  //   const blacklisted = await this.authService.isBlacklisted(payload.jti);
  //   if (blacklisted) {
  //     throw new UnauthorizedException('Session has been invalidated');
  //   }
  //   // This becomes `req.user` in every guarded controller
  //   return { userId: payload.sub, role: payload.role, jti: payload.jti, exp: payload.exp, mustChangePassword: payload.mustChangePassword };
  // }
  async validate(payload: AccessTokenPayload) {
  console.log('JWT PAYLOAD:', payload);

  const blacklisted = await this.authService.isBlacklisted(payload.jti);

  if (blacklisted) {
    throw new UnauthorizedException('Session has been invalidated');
  }

  const user = {
    userId: payload.sub,
    role: payload.role,
    jti: payload.jti,
    exp: payload.exp,
    mustChangePassword: payload.mustChangePassword,
  };

  console.log('JWT USER:', user);

  return user;
}
}