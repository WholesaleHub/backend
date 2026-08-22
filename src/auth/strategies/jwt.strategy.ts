import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: any) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        user_id: payload.sub,
      },
      select: {
        customer_id: true,
      },
    });
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      customerId: customer?.customer_id,
    };
  }
}
